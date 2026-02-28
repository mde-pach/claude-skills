---
name: nextjs-code-style
description: Next.js code style guide emphasizing Server Components, minimal code, and quick iteration. Use when writing Next.js code, implementing Next.js features, creating components, pages, or routes, refactoring Next.js applications, or when the user explicitly requests clean/minimal/modern Next.js code. Applies to .tsx/.ts files in Next.js projects including app router pages, components, server actions, and data fetching logic.
---

# Next.js Code Style

Write clean, modern Next.js code that minimizes complexity and enables quick iteration.

## Core Philosophy

1. **Server Components First** - Default to React Server Components, only use 'use client' when necessary
2. **Functional & Concise** - Short functions, avoid classes, prefer composition over abstraction
3. **Clear Boundaries** - Separate business logic (domain components) from agnostic UI components
4. **Minimal Code** - No over-engineering, no premature abstractions
5. **Data in Routes** - Route components fetch data and pass to presentational components

## Quick Reference

**Architecture:**
- Routes (Server Components) fetch data and pass to components
- Data layer in `lib/data/` with focused functions (Prisma only)
- Server Actions in `lib/actions/` for mutations
- Domain components in `components/[domain]/` understand business logic
- Generic components in `components/ui/` are fully agnostic

**Database & ORM:**
- Always use Prisma (required)
- Use Prisma generated types for all database operations
- Docker Compose for local database setup
- Type-safe queries and transactions

**When to use 'use client':**
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect)
- Event handlers that need state
- Third-party client libraries

**Keep it minimal:**
- Three similar lines of code is better than a premature abstraction
- Only validate at system boundaries (user input, external APIs)
- Extract functions when reused, not "just in case"

## Detailed Patterns

See [patterns.md](references/patterns.md) for comprehensive architectural patterns, component boundaries, and code style guidelines.

**patterns.md covers:**
- Library choices (Next.js, Zod, Prisma, Better Auth, shadcn/ui, Tailwind)
- Tailwind theming setup
- Prisma ORM patterns and type-safe usage
- Docker Compose local development setup
- **Project management & deployment:**
  - Local workflow (precommit checks)
  - Git repository setup
  - Railway/Render deployment
  - Database migrations in production
  - Environment variables management
- File structure conventions
- Data fetching patterns
- Component boundaries (domain vs generic)
- Client component guidelines
- Server Actions vs API routes decision guide
- Code style guidelines (function length, error handling, colocation)
- Common patterns (loading states, error boundaries, type safety)

**Template files in assets/:**
- `docker-compose.yml` - Local database and services setup
- `.env.example` - Environment variables template
- `README.md` - Project README template
- `.gitignore` - Next.js specific gitignore
- `biome.json` - Biome configuration (linting + formatting)

## Complete Examples

See [examples.md](references/examples.md) for full implementations of common scenarios.

**examples.md includes:**
- Simple list page
- Detail page with related data
- Form with Server Action
- Search with client state
- Modal with client interaction
- Infinite scroll
- Real-time updates

## Workflow

When writing Next.js code:

1. **Determine component type** - Start with Server Component, only add 'use client' if needed
2. **Data fetching** - Fetch in route, pass to components; extract to `lib/data/` if reusable
3. **Component boundary** - Domain component (knows business) or generic component (fully agnostic)?
4. **Keep it simple** - Write the straightforward solution first, only abstract when needed
5. **Reference patterns** - Check patterns.md for architectural guidance or examples.md for similar scenarios

When in doubt, consult patterns.md for detailed guidance on structure and conventions.

## Documentation and Debugging

**Always use Context7 MCP for:**
- Non-standard libraries (outside core stack)
- Any bugs or unexpected behavior
- API changes or deprecated patterns
- Complex integrations

Don't guess—verify with current documentation through Context7 before implementing or debugging.
