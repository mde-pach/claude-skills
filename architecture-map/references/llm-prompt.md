# LLM Prompt Template for Architecture Diagram Generation

Use this prompt (or adapt it) when feeding the extracted JSON to an LLM to produce Mermaid diagrams.

---

## System Prompt

```
You are a software architecture analyst. You receive a raw JSON extraction of a Next.js codebase and produce clean, hierarchical Mermaid diagrams.

Rules:
- Group by domain module (yum, event, covoit, market, cse, etc.)
- Show data flow direction: Page → Component → Hook → API Route → Service → Prisma Model
- Use subgraphs for module boundaries
- Use different node shapes: pages ([Page]), components((Component)), hooks{{Hook}}, API routes[/Route/], database[(Model)]
- Keep labels short — use the component/hook name, not full paths
- Omit UI primitives (Button, Dialog, etc.) — only show business components
- For the Prisma layer, show only models with cross-module relations
- Use arrows to show import/usage direction
- Max ~60 nodes per diagram — split into multiple if needed
```

## User Prompt (Full Architecture)

```
Here is the extracted architecture JSON of a Next.js codebase:

<json>
{PASTE_JSON_HERE}
</json>

Generate a Mermaid flowchart (graph TD) showing the full application architecture:
1. Group components, hooks, and API routes by their domain module
2. Show the data flow from pages through hooks to API routes to Prisma models
3. Highlight cross-module dependencies
4. Include a legend subgraph explaining node shapes

Output ONLY the Mermaid code block, no explanation.
```

## User Prompt (Module Zoom)

```
Here is the extracted architecture JSON:

<json>
{PASTE_JSON_HERE}
</json>

Generate a detailed Mermaid flowchart for the "{MODULE_NAME}" module only.
Show:
- Every page and component in this module
- Every hook used by these components
- Every API route called by these hooks
- Every Prisma model accessed by these routes
- Props interfaces between components (as edge labels)

Output ONLY the Mermaid code block.
```

## User Prompt (Data Model)

```
Here is the Prisma models section from the architecture extraction:

<json>
{PASTE_PRISMA_MODELS_JSON}
</json>

Generate a Mermaid entity-relationship diagram (erDiagram) showing:
- All models and their key fields (skip timestamps, IDs)
- All relations with cardinality (1:1, 1:N, N:M)
- Group related models visually

Output ONLY the Mermaid code block.
```

## User Prompt (API Surface)

```
Here is the routes section from the architecture extraction:

<json>
{PASTE_ROUTES_JSON}
</json>

Generate a Mermaid flowchart showing the API surface:
- Group routes by domain (/api/yum/*, /api/events/*, etc.)
- Show HTTP methods as labels on edges
- Connect to validation schemas where referenced
- Show which hooks consume each route group

Output ONLY the Mermaid code block.
```

## Iteration Prompts

After the initial diagram, use these to refine:

- "Collapse the UI component layer — only show hooks → API → database"
- "Add edge labels showing the Zod validation schema name on each API route"
- "Split this into 3 diagrams: frontend layer, API layer, data layer"
- "Highlight all cross-module dependencies in red"
- "Show only components that are client components ('use client')"
