#!/usr/bin/env bun
/**
 * Codebase static analysis script.
 * Outputs JSON with file sizes, dead exports, coupling data, string literal frequency.
 * Usage: bun run scripts/analyze-codebase.ts [src-dir]
 */
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const srcDir = process.argv[2] || "src";

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory() && !entry.startsWith(".") && entry !== "node_modules" && entry !== ".next") {
      results.push(...walk(full));
    } else if (full.endsWith(".ts") || full.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

const allFiles = walk(srcDir);
const allContents = new Map<string, string>();
for (const f of allFiles) {
  allContents.set(f, readFileSync(f, "utf-8"));
}

// 1. File sizes
const fileSizes = allFiles
  .map((f) => ({ file: f, lines: allContents.get(f)!.split("\n").length }))
  .sort((a, b) => b.lines - a.lines);

console.log("=== TOP 30 LARGEST FILES ===");
for (const { file, lines } of fileSizes.slice(0, 30)) {
  console.log(`  ${lines}\t${file}`);
}

// 2. Directory sizes
const dirSizes = new Map<string, number>();
for (const { file, lines } of fileSizes) {
  const parts = file.split("/");
  // Group by first 3 path segments (e.g., src/components/yum)
  for (let depth = 2; depth <= Math.min(4, parts.length - 1); depth++) {
    const dir = parts.slice(0, depth).join("/");
    dirSizes.set(dir, (dirSizes.get(dir) || 0) + lines);
  }
}
const sortedDirs = [...dirSizes.entries()]
  .filter(([dir]) => dir.split("/").length >= 3)
  .sort((a, b) => b[1] - a[1]);

console.log("\n=== DIRECTORY SIZES (lines) ===");
for (const [dir, lines] of sortedDirs.slice(0, 20)) {
  console.log(`  ${lines}\t${dir}`);
}

// 3. Unused exports
function countOccurrences(sym: string): number {
  let count = 0;
  for (const [, content] of allContents) {
    if (content.includes(sym)) count++;
  }
  return count;
}

const exportRe = /export\s+(function|const|type|interface)\s+(\w+)/g;
const unusedExports: { symbol: string; file: string; kind: string }[] = [];

for (const [file, content] of allContents) {
  let m: RegExpExecArray | null;
  const re = new RegExp(exportRe.source, "g");
  while ((m = re.exec(content)) !== null) {
    const kind = m[1];
    const sym = m[2];
    if (countOccurrences(sym) <= 1) {
      unusedExports.push({ symbol: sym, file, kind });
    }
  }
}

console.log(`\n=== UNUSED EXPORTS (${unusedExports.length} found) ===`);
for (const { symbol, file, kind } of unusedExports) {
  console.log(`  ${kind} ${symbol}\tin ${file}`);
}

// 4. Most imported modules
const importCounts = new Map<string, number>();
const importRe = /from\s+['"](@\/[^'"]+)['"]/g;
for (const [, content] of allContents) {
  let m: RegExpExecArray | null;
  const re = new RegExp(importRe.source, "g");
  while ((m = re.exec(content)) !== null) {
    const mod = m[1];
    importCounts.set(mod, (importCounts.get(mod) || 0) + 1);
  }
}
const sortedImports = [...importCounts.entries()].sort((a, b) => b[1] - a[1]);

console.log("\n=== MOST IMPORTED MODULES (top 20) ===");
for (const [mod, count] of sortedImports.slice(0, 20)) {
  console.log(`  ${count}\t${mod}`);
}

// 5. High coupling files (most local imports)
const fileCoupling: { file: string; imports: number }[] = [];
for (const [file, content] of allContents) {
  const re = new RegExp(/from\s+['"]@\//.source, "g");
  let count = 0;
  while (re.exec(content)) count++;
  if (count > 8) fileCoupling.push({ file, imports: count });
}
fileCoupling.sort((a, b) => b.imports - a.imports);

console.log("\n=== HIGH COUPLING FILES (>8 local imports) ===");
for (const { file, imports } of fileCoupling.slice(0, 15)) {
  console.log(`  ${imports}\t${file}`);
}

// 6. Repeated uppercase string literals
const literalCounts = new Map<string, number>();
const litRe = /'([A-Z_]{3,})'/g;
for (const [, content] of allContents) {
  let m: RegExpExecArray | null;
  const re = new RegExp(litRe.source, "g");
  while ((m = re.exec(content)) !== null) {
    const lit = m[1];
    literalCounts.set(lit, (literalCounts.get(lit) || 0) + 1);
  }
}
const sortedLiterals = [...literalCounts.entries()]
  .filter(([, count]) => count >= 5)
  .sort((a, b) => b[1] - a[1]);

console.log("\n=== REPEATED STRING LITERALS (5+ occurrences) ===");
for (const [lit, count] of sortedLiterals.slice(0, 20)) {
  console.log(`  ${count}\t'${lit}'`);
}

// 7. Summary
console.log("\n=== SUMMARY ===");
console.log(`  Total files: ${allFiles.length}`);
console.log(`  Total lines: ${fileSizes.reduce((s, f) => s + f.lines, 0)}`);
console.log(`  Unused exports: ${unusedExports.length}`);
console.log(`  Files >300 lines: ${fileSizes.filter((f) => f.lines > 300).length}`);
console.log(`  Files >500 lines: ${fileSizes.filter((f) => f.lines > 500).length}`);
console.log(`  High coupling files (>8 imports): ${fileCoupling.length}`);
