#!/usr/bin/env bun
/**
 * generate-mermaid.ts
 *
 * Reads the extracted architecture JSON and generates a Mermaid-based
 * ARCHITECTURE.md file. Does NOT require an LLM — produces a deterministic
 * diagram from the extraction data.
 *
 * Usage:
 *   bun run generate-mermaid.ts --json <architecture.json> [--out <ARCHITECTURE.md>]
 *
 * Defaults:
 *   --json   ./architecture.json
 *   --out    ./ARCHITECTURE.md
 */

import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

const { values: args } = parseArgs({
  options: {
    json: { type: "string", default: "./architecture.json" },
    out: { type: "string", default: "./ARCHITECTURE.md" },
  },
});

const data = JSON.parse(readFileSync(args.json!, "utf-8"));
const s = data.summary;

// ── Helpers ──

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const out: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item);
    if (!out[key]) out[key] = [];
    out[key].push(item);
  }
  return out;
}

function apiDomain(route: any): string {
  const parts = route.routePath.split("/").filter(Boolean);
  return parts[1] || "root";
}

function sanitize(text: string): string {
  return text.replace(/"/g, "'").replace(/[<>]/g, "");
}

// ── Build module map ──

interface ModuleInfo {
  name: string;
  label: string;
  emoji: string;
  pages: string[];
  components: { name: string; isClient: boolean }[];
  hooks: string[];
  apiRoutes: { path: string; methods: string[] }[];
  models: string[];
  validationSchemas: string[];
}

const MODULE_META: Record<string, { label: string; emoji: string; models: string[] }> = {
  yum: { label: "Yum — Restaurants & Meals", emoji: "🍽️", models: ["Restaurant", "RestaurantRating", "MealOffer", "MealReservation", "TokenTransaction", "RestaurantPhoto", "RestaurantRatingPhoto", "MealOfferScope"] },
  event: { label: "Events", emoji: "📅", models: ["Event", "EventScope", "EventParticipation"] },
  covoit: { label: "CoVoit — Carpooling", emoji: "🚗", models: ["Ride", "RideScope", "RideReservation", "RideConversation", "RideMessage"] },
  market: { label: "Market — Marketplace", emoji: "🛒", models: ["MarketListing", "MarketListingScope", "MarketConversation", "MarketMessage"] },
  cse: { label: "CSE — QVT / Avantages / Communauté", emoji: "💼", models: ["CsePoll", "CsePollScope", "CsePollResponse", "CseDiscount", "CsePost", "CseDiscussion", "CseDiscussionReply", "CseDiscussionVote", "CseDiscussionReaction", "CseDiscussionReplyReaction", "CseDiscussionScope", "CseChatMessage"] },
  apps: { label: "Apps — Poker & Games", emoji: "🎮", models: ["PokerSession", "PokerVote", "PokerParticipant", "DailyScore", "DailyGameLocations"] },
};

const CROSS_MODELS = ["Organization", "User", "UserPreferences", "UserTag", "Tag", "ModulesConfig", "ThemeConfig", "Notification", "UserAchievement", "ModerationReport"];

// Group pages by module heuristic
function pageModule(routePath: string): string | null {
  if (routePath.includes("/yum")) return "yum";
  if (routePath.includes("/event")) return "event";
  if (routePath.includes("/covoit")) return "covoit";
  if (routePath.includes("/market")) return "market";
  if (routePath.includes("/qvt") || routePath.includes("/avantages") || routePath.includes("/community") || routePath.includes("/cse")) return "cse";
  if (routePath.includes("/apps")) return "apps";
  return null;
}

function hookModule(h: any): string | null {
  const m = h.module;
  if (["restaurants", "meal-offers", "tokens", "ratings"].includes(m)) return "yum";
  if (m === "events") return "event";
  if (m === "covoit") return "covoit";
  if (m === "market") return "market";
  if (m === "cse") return "cse";
  if (["apps", "games"].includes(m)) return "apps";
  return null;
}

// Build modules
const modules: ModuleInfo[] = [];

for (const [key, meta] of Object.entries(MODULE_META)) {
  const pages = data.routes
    .filter((r: any) => r.type === "page" && pageModule(r.routePath) === key)
    .map((r: any) => r.routePath);

  const comps = data.components
    .filter((c: any) => {
      if (key === "yum") return c.module === "yum";
      if (key === "event") return c.module === "event";
      if (key === "covoit") return c.module === "covoit";
      if (key === "market") return c.module === "market";
      if (key === "cse") return c.module === "cse";
      if (key === "apps") return c.module === "apps";
      return false;
    })
    .map((c: any) => ({ name: c.name, isClient: c.isClientComponent }));

  const hooks = data.hooks
    .filter((h: any) => hookModule(h) === key)
    .flatMap((h: any) => h.hookNames);

  const apis = data.routes
    .filter((r: any) => r.type === "api" && (() => {
      const dom = apiDomain(r);
      if (key === "yum") return dom === "yum";
      if (key === "event") return dom === "events";
      if (key === "covoit") return dom === "covoit";
      if (key === "market") return dom === "market";
      if (key === "cse") return dom === "cse";
      if (key === "apps") return dom === "apps" || dom === "game";
      return false;
    })())
    .map((r: any) => ({ path: r.routePath, methods: r.httpMethods || [] }));

  modules.push({
    name: key,
    label: meta.label,
    emoji: meta.emoji,
    pages,
    components: comps,
    hooks,
    apiRoutes: apis,
    models: meta.models,
    validationSchemas: [],
  });
}

// ── Generate markdown ──

let md = `# Architecture Map

> Auto-generated. ${s.totalComponents} components, ${s.apiRoutes} API routes, ${s.totalPrismaModels} Prisma models, ${s.totalHooks} hooks, ${s.totalValidationSchemas} Zod schemas.

## Full Architecture Overview

\`\`\`mermaid
graph TD
    classDef page fill:#4f46e5,color:#fff,stroke:#3730a3
    classDef comp fill:#0891b2,color:#fff,stroke:#0e7490
    classDef hook fill:#d97706,color:#fff,stroke:#b45309
    classDef api fill:#059669,color:#fff,stroke:#047857
    classDef db fill:#7c3aed,color:#fff,stroke:#6d28d9
    classDef infra fill:#64748b,color:#fff,stroke:#475569

    %% Infrastructure
    subgraph INFRA["Infrastructure"]
        CLERK["Clerk Auth"]:::infra
        PRISMA["Prisma ORM"]:::infra
        POSTGRES[("PostgreSQL + PostGIS")]:::db
    end

    subgraph AUTH["Auth & Session"]
        MW["proxy.ts"]:::infra
        AUTH_UTILS["auth-utils.ts"]:::infra
        WEBHOOK["/api/webhooks/clerk"]:::api
    end
    CLERK --> MW
    CLERK --> AUTH_UTILS
    CLERK --> WEBHOOK
`;

// Add each module as a subgraph
for (const mod of modules) {
  const ID = mod.name.toUpperCase();
  const hookList = mod.hooks.slice(0, 6).join("\\n");
  const apiList = [...new Set(mod.apiRoutes.map(a => {
    const parts = a.path.split("/").slice(0, 4);
    return parts.join("/");
  }))].slice(0, 4).join("\\n");
  const modelList = mod.models.filter(m => !m.includes("Scope") && !m.includes("Photo") && !m.includes("Reaction")).slice(0, 5).join("\\n");

  md += `
    subgraph ${ID}["${mod.emoji} ${mod.label} · ${mod.components.length} components"]
        direction TB
        ${ID}_P["${mod.pages.length} pages"]:::page
        ${ID}_C["${mod.components.length} components\\n(${mod.components.filter(c => c.isClient).length} client)"]:::comp
        ${ID}_H{{"${sanitize(hookList)}"}}:::hook
        ${ID}_A["${sanitize(apiList)}"]:::api
        ${ID}_D[("${sanitize(modelList)}")]:::db
    end
    ${ID}_P --> ${ID}_C --> ${ID}_H
    ${ID}_H -->|"fetch/mutate"| ${ID}_A
    ${ID}_A --> ${ID}_D
    ${ID}_D --> POSTGRES
    ${ID}_A --> AUTH_UTILS
`;
}

// Cross-cutting
md += `
    subgraph CROSS["Cross-Cutting"]
        NOTIF{{"useNotifications"}}:::hook
        NOTIF_API["/api/notifications"]:::api
        MOD_API["/api/moderation"]:::api
        ACH_API["/api/achievements"]:::api
        NOTIF_DB[("Notification\\nModerationReport\\nUserAchievement")]:::db
    end
    NOTIF --> NOTIF_API --> NOTIF_DB --> POSTGRES
    MOD_API --> NOTIF_DB
    ACH_API --> NOTIF_DB

    subgraph CORE["Core Data"]
        ORG[("Organization")]:::db
        USER[("User")]:::db
        TAG[("Tag")]:::db
    end
    AUTH_UTILS --> ORG
    ORG --> POSTGRES
    USER --> POSTGRES
    TAG --> POSTGRES
`;

// Cross-module FK links
for (const mod of modules) {
  const ID = mod.name.toUpperCase();
  md += `    ${ID}_D -.->|"orgId"| ORG\n`;
  md += `    ${ID}_D -.->|"userId"| USER\n`;
}

md += "```\n\n";

// ── ER Diagram ──

md += `## Data Model

\`\`\`mermaid
erDiagram
    Organization ||--o{ User : "has many"
    Organization ||--o| ModulesConfig : "config"
    Organization ||--o| ThemeConfig : "theme"
    Organization ||--o{ Tag : "has many"
`;

const orgRelModels = ["Restaurant", "Event", "Ride", "MarketListing", "CsePoll", "CsePost", "CseDiscount", "CseDiscussion", "PokerSession", "Notification", "ModerationReport"];
for (const m of orgRelModels) {
  md += `    Organization ||--o{ ${m} : "has many"\n`;
}

md += `
    User ||--o| UserPreferences : "has one"
    User ||--o{ UserTag : "tagged"
    User ||--o{ UserAchievement : "earned"
    User ||--o{ Notification : "receives"
    User ||--o{ ModerationReport : "reports"
`;

// Module-specific relations
const relMap: [string, string, string][] = [
  ["User", "RestaurantRating", "rates"],
  ["User", "MealOffer", "offers"],
  ["User", "MealReservation", "reserves"],
  ["User", "Event", "creates"],
  ["User", "EventParticipation", "joins"],
  ["User", "Ride", "drives"],
  ["User", "RideReservation", "books"],
  ["User", "MarketListing", "sells"],
  ["User", "CsePollResponse", "votes"],
  ["User", "CseDiscussion", "starts"],
  ["User", "CseChatMessage", "chats"],
  ["Tag", "MealOfferScope", "scopes"],
  ["Tag", "EventScope", "scopes"],
  ["Tag", "RideScope", "scopes"],
  ["Tag", "MarketListingScope", "scopes"],
  ["Tag", "CsePollScope", "scopes"],
  ["Tag", "CseDiscussionScope", "scopes"],
  ["Restaurant", "RestaurantRating", "rated"],
  ["Restaurant", "MealOffer", "serves"],
  ["MealOffer", "MealReservation", "reserved by"],
  ["Event", "EventParticipation", "attended by"],
  ["Ride", "RideReservation", "booked"],
  ["Ride", "RideConversation", "discussed"],
  ["RideConversation", "RideMessage", "contains"],
  ["MarketListing", "MarketConversation", "discussed"],
  ["MarketConversation", "MarketMessage", "contains"],
  ["CsePoll", "CsePollResponse", "answered"],
  ["CseDiscussion", "CseDiscussionReply", "replied"],
  ["PokerSession", "PokerVote", "voted"],
  ["PokerSession", "PokerParticipant", "joined"],
];

for (const [from, to, label] of relMap) {
  md += `    ${from} ||--o{ ${to} : "${label}"\n`;
}

md += "```\n\n";

// ── Data Flow ──

md += `## Data Flow per Module

\`\`\`mermaid
graph LR
    classDef page fill:#4f46e5,color:#fff
    classDef hook fill:#d97706,color:#fff
    classDef api fill:#059669,color:#fff
    classDef db fill:#7c3aed,color:#fff
`;

for (const mod of modules) {
  const ID = mod.name.toUpperCase();
  const hookStr = mod.hooks.slice(0, 4).join("\\n");
  const apiDomains = [...new Set(mod.apiRoutes.map(a => "/" + a.path.split("/").slice(1, 3).join("/")))].slice(0, 3).join("\\n");
  const modelStr = mod.models.filter(m => !m.includes("Scope") && !m.includes("Photo") && !m.includes("Reaction")).slice(0, 4).join("\\n");

  md += `
    subgraph ${ID}["${mod.emoji} ${mod.label}"]
        ${ID}_P["/${mod.name}/*"]:::page
        ${ID}_H{{"${sanitize(hookStr)}"}}:::hook
        ${ID}_A["${sanitize(apiDomains)}"]:::api
        ${ID}_D[("${sanitize(modelStr)}")]:::db
    end
    ${ID}_P --> ${ID}_H --> ${ID}_A --> ${ID}_D
`;
}

md += "```\n\n";

// ── Role routing ──

md += `## Role-Based View Routing

\`\`\`mermaid
graph TD
    classDef emp fill:#3b82f6,color:#fff
    classDef admin fill:#ef4444,color:#fff
    classDef cse fill:#8b5cf6,color:#fff
    classDef hr fill:#10b981,color:#fff
    classDef office fill:#f59e0b,color:#fff

    LOGIN["Login"] --> MW{"Middleware"}
    MW -->|"no org"| SETUP["/setup"]
    MW -->|"auth"| DASH["/dashboard"]
    DASH --> VS["ViewSwitcher"]

    VS -->|"Employee"| EMP
    VS -->|"Admin"| ADM
    VS -->|"CSE"| CSE_V
    VS -->|"HR"| HR_V
    VS -->|"Office"| OFF

    subgraph EMP["Employee Routes"]
        direction LR
        E1["/dashboard"]:::emp
        E2["/yum"]:::emp
        E3["/events"]:::emp
        E4["/covoit"]:::emp
        E5["/market"]:::emp
        E6["/qvt"]:::emp
        E7["/avantages"]:::emp
        E8["/community"]:::emp
    end

    subgraph ADM["Admin Routes"]
        direction LR
        A1["/admin/settings"]:::admin
        A2["/admin/users"]:::admin
        A3["/admin/modules"]:::admin
    end

    subgraph CSE_V["CSE Manage Routes"]
        direction LR
        C1["/cse-manage/polls"]:::cse
        C2["/cse-manage/discounts"]:::cse
        C3["/cse-manage/analytics"]:::cse
    end

    subgraph HR_V["HR Routes"]
        direction LR
        H1["/hr/directory"]:::hr
        H2["/hr/teams"]:::hr
    end

    subgraph OFF["Office Routes"]
        direction LR
        O1["/office/reductions"]:::office
        O2["/office/announcements"]:::office
    end
\`\`\`

## Legend

| Symbol | Meaning |
|--------|---------|
| Rectangle | Page / Route |
| Rounded | Component |
| Hexagon | Hook |
| Cylinder | Database Model |
| Solid arrow | Direct dependency |
| Dashed arrow | FK relation (orgId / userId) |

---

*Auto-generated from codebase extraction.*
`;

writeFileSync(args.out!, md);
console.error(`✅ Generated ${args.out} (${(md.length / 1024).toFixed(1)} KB, ${Object.keys(MODULE_META).length + 3} diagrams)`);
