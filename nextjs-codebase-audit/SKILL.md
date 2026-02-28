---
name: nextjs-codebase-audit
description: >
  Comprehensive codebase audit for Next.js App Router projects with TypeScript, TanStack Query, Prisma, and Zod.
  Analyzes code quality, duplication, composition patterns, dead code, coupling, and developer experience.
  Produces a structured AUDIT.md with findings and a prioritized refactoring roadmap.
  Use when asked to: (1) audit a codebase, (2) find duplication or dead code, (3) analyze code quality,
  (4) review architecture, (5) find refactoring opportunities, (6) reduce code quantity,
  (7) improve developer experience, or (8) assess technical debt.
  Trigger phrases: "audit", "code review", "tech debt", "refactor analysis", "reduce code",
  "find duplication", "dead code", "code quality", "codebase analysis".
---

# Next.js Codebase Audit

Two-phase audit: parallel pattern-matching agents, then data-driven static analysis. Output: `AUDIT.md` at project root.

## Phase 1: Pattern-Based Analysis

Launch **6 parallel Task agents** (subagent_type=Explore, run_in_background=true) in a single message. Each agent reads full files and quantifies findings. See [references/audit-dimensions.md](references/audit-dimensions.md) for detailed per-dimension prompts.

| # | Agent | Scope | Key question |
|---|-------|-------|-------------|
| 1 | API Routes | `src/app/api/` (8-10 files) | What boilerplate repeats in every route? |
| 2 | Query Hooks | `src/hooks/api/`, `src/lib/query-keys.ts` | How many CRUD patterns are duplicated? |
| 3 | UI Components | `src/components/` (all modules) | How similar are dialogs? Card variants? |
| 4 | Pages | `src/app/(dashboard)/` page.tsx files | Are shared components used or reimplemented? |
| 5 | Types & Validations | `src/types/`, `src/lib/validations/` | Where are response types defined? Conflicts? |
| 6 | Services & Utilities | `src/services/`, `src/stores/`, `src/lib/` | Is business logic in routes or services? |

After all 6 complete, launch **3 more parallel agents**:

| # | Agent | Scope | Key question |
|---|-------|-------|-------------|
| 7 | Detail Pages | All `[id]/page.tsx` files | Shared layout? Creator card? Not-found state? |
| 8 | Form Fields | ALL dialog/form files | How many FormField instances per type? |
| 9 | Micro-Patterns | Full codebase search | Inline pagination? Skeleton grids? Badge factories? |

Each agent prompt must include: "Read FULL files. Provide file paths and line numbers. Quantify patterns as lines x occurrences."

## Phase 2: Data-Driven Analysis

Launch **3 parallel Task agents** (subagent_type=Bash, run_in_background=true):

### Agent 10: Static Analysis Script

```bash
bun run <skill-dir>/scripts/analyze-codebase.ts src
```

Outputs: top 30 files by size, directory sizes, unused exports, most-imported modules, high-coupling files, repeated string literals, summary stats.

### Agent 11: TypeScript & Health Metrics

```bash
npx tsc --noEmit 2>&1 | grep -oP 'TS\d+' | sort | uniq -c | sort -rn
npx tsc --noEmit 2>&1 | grep -oP 'src/[^(]+' | sort | uniq -c | sort -rn | head -25
grep -rn 'TODO\|FIXME\|HACK' src/ --include='*.ts' --include='*.tsx'
grep -rn 'console\.\(log\|error\|warn\)' src/ --include='*.ts' --include='*.tsx' | grep -v seed
```

### Agent 12: Unused Dependencies

Cross-reference `package.json` dependencies with `src/` imports. Use a Node/Bun script:
```bash
node -e "
const pkg = require('./package.json');
const deps = Object.keys({...pkg.dependencies, ...pkg.devDependencies});
const {execSync} = require('child_process');
for (const d of deps) {
  if (d.startsWith('@types/')) continue;
  try { execSync('grep -rl \"'+d+'\" src/ --include=\"*.ts\" --include=\"*.tsx\"', {timeout:5000}); }
  catch { console.log('POSSIBLY UNUSED: ' + d); }
}
"
```

## Phase 3: Synthesize into AUDIT.md

After all agents complete, write `AUDIT.md` at project root:

```
# Codebase Audit
## Executive Summary              — Total lines, reducible estimate, summary table
## 1-N. Pattern Findings           — One section per dimension (file paths, line counts, proposed fix)
## Data-Driven Findings            — Size outliers, dead code inventory, coupling, health metrics
## Positive Patterns               — Well-designed abstractions to preserve
## Refactoring Roadmap             — Phased: quick wins → medium → high effort
## Appendix: File-Level Impact Map — Highest-impact files, already-good files
```

### Principles

- **Quantify everything**: "15-line pattern x 30 routes = 450 lines" — never just "some duplication"
- **File paths always**: Every finding references `src/path/file.tsx:lineN`
- **Two-phase approach**: Patterns find common duplication; data-driven finds outliers and dead code
- **Maximize parallelism**: Launch all independent agents in a single message
- **Read full files**: Agents must read complete contents, not grep snippets
- **Net savings**: Subtract lines invested in new abstractions from gross savings
