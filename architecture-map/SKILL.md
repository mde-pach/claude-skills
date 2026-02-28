---
name: architecture-map
description: Extract codebase architecture from Next.js/TypeScript projects and generate Mermaid diagrams. Programmatically scans imports, components, hooks, API routes, Prisma models, stores, and services into structured JSON, then generates an ARCHITECTURE.md with 4 Mermaid diagrams (overview, ER, data flow, role routing). Includes a built-in local Mermaid viewer served over HTTP. Use when asked to map a codebase, generate architecture diagrams, visualize dependencies, understand project structure, create component maps, or produce data flow diagrams. Trigger phrases include "architecture map", "codebase diagram", "dependency graph", "visualize architecture", "component map", "data flow diagram", "map the codebase".
---

# Architecture Map

Extract codebase structure into JSON, generate an ARCHITECTURE.md with Mermaid diagrams, and view locally.

## Workflow

### Step 1: Extract

```bash
bun run <skill-path>/scripts/extract-architecture.ts --root <project-root> --out architecture.json
```

Extracts: file tree, routes (pages/layouts/API with HTTP methods), components (name, module, client/server, props, imports), hooks (names, API endpoints, query keys), stores, services, lib, validations (Zod schema names), types, Prisma models (fields + relations with cardinality), summary.

### Step 2: Generate ARCHITECTURE.md

**Option A — Deterministic (no LLM):**

```bash
bun run <skill-path>/scripts/generate-mermaid.ts --json architecture.json --out ARCHITECTURE.md
```

Produces 4 diagrams: Full Architecture Overview, Data Model (ER), Data Flow per Module, Role-Based View Routing. The `.md` renders natively on GitHub.

The `generate-mermaid.ts` script has a `MODULE_META` map that defines module names, labels, emojis, and Prisma models. Edit it to customize for any project.

**Option B — LLM-assisted (custom diagrams):**

Feed `architecture.json` to an LLM using prompt templates in `references/llm-prompt.md`.

### Step 3: View locally

```bash
bun run <skill-path>/scripts/serve-viewer.ts ./ARCHITECTURE.md
```

This starts a local HTTP server, serves a dark-mode Mermaid viewer at `http://localhost:4321`, and opens the browser automatically. Pass any `.md` file with Mermaid blocks — it's project-agnostic.

Options: `--port 5000` to change port.

### Step 4: Iterate

Re-run extraction + generation after code changes, or refine via LLM prompts from `references/llm-prompt.md`.

## Resources

- `scripts/extract-architecture.ts` — Bun: codebase → JSON (zero deps)
- `scripts/generate-mermaid.ts` — Bun: JSON → ARCHITECTURE.md (zero deps)
- `scripts/serve-viewer.ts` — Bun: local HTTP viewer for any .md with Mermaid blocks
- `references/llm-prompt.md` — LLM prompt templates for custom diagrams
