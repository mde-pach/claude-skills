#!/usr/bin/env bun
/**
 * extract-architecture.ts
 *
 * Walks a Next.js App Router + TypeScript codebase and emits a single JSON
 * blob that an LLM can consume to produce architecture diagrams.
 *
 * Usage:
 *   bun run extract-architecture.ts [--root <project-root>] [--out <output.json>]
 *
 * Defaults:
 *   --root  current working directory
 *   --out   stdout (pipe to file yourself)
 */

import { readdir, readFile, stat } from "node:fs/promises";
import { basename, dirname, extname, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const { values: args } = parseArgs({
  options: {
    root: { type: "string", default: process.cwd() },
    out: { type: "string", default: "" },
  },
});

const ROOT = resolve(args.root!);
const SRC = join(ROOT, "src");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function walk(dir: string, filter?: (p: string) => boolean): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
  const results: string[] = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue;
      results.push(...(await walk(full, filter)));
    } else if (!filter || filter(full)) {
      results.push(full);
    }
  }
  return results;
}

function rel(p: string): string {
  return relative(ROOT, p);
}

async function read(p: string): Promise<string> {
  return readFile(p, "utf-8").catch(() => "");
}

// ---------------------------------------------------------------------------
// 1. File tree (directories only, 2 levels deep from src/)
// ---------------------------------------------------------------------------

async function extractFileTree() {
  const tree: Record<string, string[]> = {};
  const l1 = await readdir(SRC, { withFileTypes: true }).catch(() => []);
  for (const d1 of l1) {
    if (!d1.isDirectory()) continue;
    const sub = join(SRC, d1.name);
    const l2 = await readdir(sub, { withFileTypes: true }).catch(() => []);
    tree[`src/${d1.name}`] = l2
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
  }
  return tree;
}

// ---------------------------------------------------------------------------
// 2. App routes (pages + API routes)
// ---------------------------------------------------------------------------

interface RouteInfo {
  path: string; // relative file path
  routePath: string; // URL path
  type: "page" | "layout" | "api";
  httpMethods?: string[]; // GET, POST, etc.
  imports: string[]; // local imports (relative paths resolved)
}

function fileToRoutePath(filePath: string): string {
  // src/app/(dashboard)/yum/page.tsx → /yum
  // src/app/api/yum/restaurants/route.ts → /api/yum/restaurants
  let route = relative(join(SRC, "app"), filePath);
  route = route
    .replace(/\/page\.(tsx?|jsx?)$/, "")
    .replace(/\/layout\.(tsx?|jsx?)$/, "")
    .replace(/\/route\.(tsx?|jsx?)$/, "")
    .replace(/\([\w-]+\)\//g, "") // remove route groups
    .replace(/\\/g, "/");
  return "/" + route || "/";
}

function extractImports(content: string, filePath: string): string[] {
  const imports: string[] = [];
  // Match: import ... from '...'  or  import ... from "..."
  const re = /import\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("@/") || spec.startsWith("~/")) {
      // Resolve relative to file directory
      let resolved: string;
      if (spec.startsWith("@/") || spec.startsWith("~/")) {
        resolved = `src/${spec.slice(2)}`;
      } else {
        resolved = relative(ROOT, resolve(dirname(filePath), spec));
      }
      // Normalise: strip extension, add /index if dir
      resolved = resolved.replace(/\.(tsx?|jsx?|mjs)$/, "");
      imports.push(resolved);
    }
  }
  return [...new Set(imports)];
}

function extractHttpMethods(content: string): string[] {
  const methods: string[] = [];
  for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
    // export const GET = ... OR export async function GET
    if (new RegExp(`export\\s+(const|async\\s+function|function)\\s+${method}\\b`).test(content)) {
      methods.push(method);
    }
  }
  return methods;
}

async function extractRoutes(): Promise<RouteInfo[]> {
  const appDir = join(SRC, "app");
  const files = await walk(appDir, (p) =>
    /\/(page|layout|route)\.(tsx?|jsx?)$/.test(p)
  );
  const routes: RouteInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    const isApi = f.includes("/api/");
    const isLayout = basename(f).startsWith("layout.");
    const type: RouteInfo["type"] = isApi ? "api" : isLayout ? "layout" : "page";

    const info: RouteInfo = {
      path: rel(f),
      routePath: fileToRoutePath(f),
      type,
      imports: extractImports(content, f),
    };

    if (type === "api") {
      info.httpMethods = extractHttpMethods(content);
    }

    routes.push(info);
  }

  return routes;
}

// ---------------------------------------------------------------------------
// 3. Components
// ---------------------------------------------------------------------------

interface ComponentInfo {
  path: string;
  name: string; // PascalCase component name
  module: string; // parent directory (yum, event, ui, shared…)
  isClientComponent: boolean;
  exports: string[]; // named exports
  imports: string[]; // local imports
  propsInterface: string | null; // raw Props type text (compact)
}

function extractExports(content: string): string[] {
  const exports: string[] = [];
  // export function Foo / export const Foo / export default function Foo
  const re = /export\s+(?:default\s+)?(?:const|function|class|type|interface|enum)\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    exports.push(m[1]);
  }
  return [...new Set(exports)];
}

function extractPropsInterface(content: string): string | null {
  // Matches: interface FooProps { ... } or type FooProps = { ... }
  // We extract just the name and field names (not full types) to keep compact
  const ifaceRe = /(?:interface|type)\s+(\w*Props\w*)\s*(?:=\s*)?\{([^}]*)\}/gs;
  const match = ifaceRe.exec(content);
  if (!match) return null;

  const name = match[1];
  const body = match[2];
  // Extract field names
  const fields = [...body.matchAll(/(\w+)\s*[?:]?\s*:/g)].map((m) => m[1]);
  return `${name} { ${fields.join(", ")} }`;
}

function fileToComponentName(filePath: string): string {
  const base = basename(filePath).replace(/\.(tsx?|jsx?)$/, "");
  // kebab-case → PascalCase
  return base
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

async function extractComponents(): Promise<ComponentInfo[]> {
  const compDir = join(SRC, "components");
  const files = await walk(compDir, (p) => /\.(tsx?|jsx?)$/.test(p));
  const components: ComponentInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    const relPath = rel(f);
    const parts = relPath.split("/");
    // src/components/<module>/file.tsx → module = parts[2]
    const module = parts.length >= 4 ? parts[2] : "root";

    components.push({
      path: relPath,
      name: fileToComponentName(f),
      module,
      isClientComponent: /^['"]use client['"]/.test(content.trim()),
      exports: extractExports(content),
      imports: extractImports(content, f),
      propsInterface: extractPropsInterface(content),
    });
  }

  return components;
}

// ---------------------------------------------------------------------------
// 4. Hooks
// ---------------------------------------------------------------------------

interface HookInfo {
  path: string;
  module: string;
  hookNames: string[]; // useXxx exports
  apiEndpoints: string[]; // /api/... endpoints referenced
  queryKeys: string[]; // query key references (e.g. restaurantKeys.list)
  imports: string[];
}

function extractHookNames(content: string): string[] {
  const re = /export\s+(?:const|function)\s+(use\w+)/g;
  const names: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) names.push(m[1]);
  return names;
}

function extractApiEndpoints(content: string): string[] {
  // Match: '/api/...' or "/api/..." or `/api/...` or '/yum/...' (relative to /api)
  const re = /['"`](\/?(?:api\/)?[\w/-]+)['"`]/g;
  const endpoints: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) {
    const ep = m[1];
    if (ep.includes("/") && !ep.startsWith("@") && !ep.startsWith(".") && !ep.includes("node_modules")) {
      endpoints.push(ep);
    }
  }
  // Deduplicate and filter meaningful ones
  return [...new Set(endpoints)].filter(
    (e) => e.split("/").length >= 2 && !e.includes("__") && e.length < 80
  );
}

function extractQueryKeyRefs(content: string): string[] {
  // Match: fooKeys.bar or queryKeys.foo.bar
  const re = /(\w+Keys\.\w+(?:\([^)]*\))?)/g;
  const refs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content))) refs.push(m[1]);
  return [...new Set(refs)];
}

async function extractHooks(): Promise<HookInfo[]> {
  const hooksApiDir = join(SRC, "hooks", "api");
  const files = await walk(hooksApiDir, (p) => /\.(tsx?|jsx?)$/.test(p));
  const hooks: HookInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    const base = basename(f).replace(/\.(tsx?|jsx?)$/, "");
    hooks.push({
      path: rel(f),
      module: base.replace(/^use-/, ""),
      hookNames: extractHookNames(content),
      apiEndpoints: extractApiEndpoints(content),
      queryKeys: extractQueryKeyRefs(content),
      imports: extractImports(content, f),
    });
  }

  return hooks;
}

// ---------------------------------------------------------------------------
// 5. Stores (Zustand)
// ---------------------------------------------------------------------------

interface StoreInfo {
  path: string;
  name: string;
  exports: string[];
}

async function extractStores(): Promise<StoreInfo[]> {
  const storesDir = join(SRC, "stores");
  const files = await walk(storesDir, (p) => /\.(tsx?|jsx?)$/.test(p));
  const stores: StoreInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    stores.push({
      path: rel(f),
      name: basename(f).replace(/\.(tsx?|jsx?)$/, ""),
      exports: extractExports(content),
    });
  }

  return stores;
}

// ---------------------------------------------------------------------------
// 6. Services (business logic)
// ---------------------------------------------------------------------------

interface ServiceInfo {
  path: string;
  name: string;
  exports: string[];
  imports: string[];
}

async function extractServices(): Promise<ServiceInfo[]> {
  const servicesDir = join(SRC, "services");
  const files = await walk(servicesDir, (p) => /\.(tsx?|jsx?)$/.test(p));
  const services: ServiceInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    services.push({
      path: rel(f),
      name: basename(f).replace(/\.(tsx?|jsx?)$/, ""),
      exports: extractExports(content),
      imports: extractImports(content, f),
    });
  }

  return services;
}

// ---------------------------------------------------------------------------
// 7. Prisma schema
// ---------------------------------------------------------------------------

interface PrismaModelInfo {
  name: string;
  fields: { name: string; type: string; isRelation: boolean }[];
  relations: { field: string; target: string; type: "1:1" | "1:N" | "N:1" | "N:M" }[];
}

function extractPrismaModels(schemaContent: string): PrismaModelInfo[] {
  const models: PrismaModelInfo[] = [];
  // Match model blocks
  const modelRe = /model\s+(\w+)\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;

  // Collect all model names first for relation detection
  const modelNames = new Set<string>();
  const tempRe = /model\s+(\w+)\s*\{/g;
  let tmp: RegExpExecArray | null;
  while ((tmp = tempRe.exec(schemaContent))) modelNames.add(tmp[1]);

  while ((m = modelRe.exec(schemaContent))) {
    const modelName = m[1];
    const body = m[2];
    const fields: PrismaModelInfo["fields"] = [];
    const relations: PrismaModelInfo["relations"] = [];

    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@")) continue;

      // field  Type  @...
      const fieldMatch = trimmed.match(/^(\w+)\s+([\w?[\]]+)/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      let fieldType = fieldMatch[2];
      const isArray = fieldType.endsWith("[]");
      const isOptional = fieldType.endsWith("?");
      const baseType = fieldType.replace(/[\[\]?]/g, "");
      const isRelation = modelNames.has(baseType);

      fields.push({ name: fieldName, type: fieldType, isRelation });

      if (isRelation) {
        let relType: PrismaModelInfo["relations"][0]["type"];
        if (isArray) {
          relType = "1:N";
        } else if (isOptional) {
          relType = "1:1";
        } else {
          relType = "N:1";
        }
        relations.push({ field: fieldName, target: baseType, type: relType });
      }
    }

    models.push({ name: modelName, fields, relations });
  }

  return models;
}

// ---------------------------------------------------------------------------
// 8. Lib files (utilities, query-keys, api-client, etc.)
// ---------------------------------------------------------------------------

interface LibInfo {
  path: string;
  exports: string[];
  imports: string[];
}

async function extractLib(): Promise<LibInfo[]> {
  const libDir = join(SRC, "lib");
  const files = await walk(libDir, (p) => /\.(tsx?|jsx?)$/.test(p));
  const libs: LibInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    libs.push({
      path: rel(f),
      exports: extractExports(content),
      imports: extractImports(content, f),
    });
  }

  return libs;
}

// ---------------------------------------------------------------------------
// 9. Validation schemas
// ---------------------------------------------------------------------------

interface ValidationInfo {
  path: string;
  schemaNames: string[];
}

async function extractValidations(): Promise<ValidationInfo[]> {
  const validDir = join(SRC, "lib", "validations");
  const files = await walk(validDir, (p) => /\.(tsx?|jsx?)$/.test(p));
  const validations: ValidationInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    // z.object exports
    const re = /export\s+const\s+(\w+Schema\w*)\s*=/g;
    const schemas: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(content))) schemas.push(m[1]);
    if (schemas.length) {
      validations.push({ path: rel(f), schemaNames: schemas });
    }
  }

  return validations;
}

// ---------------------------------------------------------------------------
// 10. Types
// ---------------------------------------------------------------------------

interface TypeInfo {
  path: string;
  exports: string[];
}

async function extractTypes(): Promise<TypeInfo[]> {
  const typesDir = join(SRC, "types");
  const files = await walk(typesDir, (p) => /\.(tsx?|jsx?)$/.test(p));
  const types: TypeInfo[] = [];

  for (const f of files) {
    const content = await read(f);
    types.push({
      path: rel(f),
      exports: extractExports(content),
    });
  }

  return types;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const prismaPath = join(ROOT, "prisma", "schema.prisma");
  const prismaContent = await read(prismaPath);

  const [
    fileTree,
    routes,
    components,
    hooks,
    stores,
    services,
    lib,
    validations,
    types,
  ] = await Promise.all([
    extractFileTree(),
    extractRoutes(),
    extractComponents(),
    extractHooks(),
    extractStores(),
    extractServices(),
    extractLib(),
    extractValidations(),
    extractTypes(),
  ]);

  const prismaModels = extractPrismaModels(prismaContent);

  const output = {
    _meta: {
      extractedAt: new Date().toISOString(),
      root: ROOT,
      version: "1.0.0",
    },
    fileTree,
    routes,
    components,
    hooks,
    stores,
    services,
    lib,
    validations,
    types,
    prismaModels,
    summary: {
      totalRoutes: routes.length,
      apiRoutes: routes.filter((r) => r.type === "api").length,
      pages: routes.filter((r) => r.type === "page").length,
      layouts: routes.filter((r) => r.type === "layout").length,
      totalComponents: components.length,
      clientComponents: components.filter((c) => c.isClientComponent).length,
      serverComponents: components.filter((c) => !c.isClientComponent).length,
      componentModules: [...new Set(components.map((c) => c.module))],
      totalHooks: hooks.reduce((a, h) => a + h.hookNames.length, 0),
      hookFiles: hooks.length,
      totalStores: stores.length,
      totalServices: services.length,
      totalPrismaModels: prismaModels.length,
      totalValidationSchemas: validations.reduce((a, v) => a + v.schemaNames.length, 0),
    },
  };

  const json = JSON.stringify(output, null, 2);

  if (args.out) {
    await Bun.write(args.out, json);
    console.error(`✅ Architecture extracted → ${args.out} (${(json.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log(json);
  }
}

main().catch((err) => {
  console.error("❌ Extraction failed:", err);
  process.exit(1);
});
