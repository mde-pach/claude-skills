---
name: nextjs-quickstart
description: Bootstrap a production-ready Next.js 16 project with TypeScript, Tailwind CSS 4, Prisma 7, Better Auth, TanStack Query, React Hook Form, Zod validation, nuqs, shadcn/ui components, and Biome linting. Includes Docker Compose, git hooks, example pages with working patterns, and complete type safety. Use when the user wants to create/start/bootstrap/initialize a new Next.js application, start a new web project with Next.js, or quickstart a Next.js app. Triggers include phrases like "create a Next.js app", "start a Next.js project", "bootstrap Next.js", "new Next.js app", or "quickstart Next.js".
---

# Next.js Quickstart

Bootstrap a modern Next.js 16 application with best practices and essential integrations pre-configured.

## Quick Start

When the user requests a new Next.js project:

1. Ask for the project name and destination directory
2. Copy the entire `assets/nextjs-boilerplate/` directory to the destination
3. Run the setup script: `bash scripts/setup.sh` from within the new project directory
4. Guide the user through environment configuration (see Setup Guide below)

## What's Included

The boilerplate provides:

- **Next.js 16** with App Router
- **TypeScript 5** with strict mode
- **Tailwind CSS 4** with shadcn/ui components
- **Prisma 7** with PostgreSQL adapter and example schema
- **Better Auth** for authentication (email/password + social providers)
- **TanStack Query** for server state management and caching
- **React Hook Form + Zod** for type-safe forms with validation
- **nuqs** for type-safe URL state management
- **Biome** for linting and formatting
- **Bun** as package manager
- **Docker Compose** for local PostgreSQL
- **Git Hooks** with Husky + lint-staged + commitlint
- **Pre-built pages with working examples**:
  - Landing page with hero and features
  - Admin dashboard with user management
  - Users page demonstrating all patterns (TanStack Query, nuqs, React Hook Form)

## Setup Workflow

### 1. Copy Boilerplate

```bash
cp -r assets/nextjs-boilerplate /path/to/new-project
cd /path/to/new-project
```

### 2. Run Setup Script

```bash
bash scripts/setup.sh
```

This will:
- Install dependencies with Bun
- Create `.env` from `.env.example`
- Generate Prisma client
- Display next steps

### 3. Configure Environment

Guide the user to update `.env` with:

**DATABASE_URL**: PostgreSQL connection string
- Docker Compose (default): `postgresql://postgres:postgres@localhost:5432/nextjs_dev`
- Or cloud providers: Supabase, Railway, Vercel Postgres

**BETTER_AUTH_SECRET**: Generate with `openssl rand -base64 32`

**BETTER_AUTH_URL**: Application URL
- Development: `http://localhost:3000`
- Production: Deployed URL

### 4. Start Database

```bash
docker compose up -d    # Starts PostgreSQL in Docker
```

### 5. Initialize Database

```bash
bun run db:push    # Creates tables from schema
bun run db:seed    # (Optional) Seeds demo data
```

### 6. Start Development

```bash
bun dev
```

Visit `http://localhost:3000/users` to see working examples of all patterns.

## Customization Guidance

### Adding Pages

Create new routes in `src/app/[route]/page.tsx`. Follow existing patterns in `src/app/page.tsx` and `src/app/admin/page.tsx`.

### Adding shadcn/ui Components

```bash
bunx shadcn@latest add [component-name]
```

Components are added to `src/components/ui/`.

### Modifying Database Schema

1. Edit `prisma/schema.prisma`
2. Run `bun run db:push` (development) or `bunx prisma migrate dev` (production)
3. Run `bun run db:generate` to update Prisma client

### Adding Authentication Providers

Update `src/lib/auth.ts` to add social providers (GitHub, Google, etc.). See references/setup-guide.md for detailed OAuth setup instructions.

## Project Structure

```
src/
├── app/              # Next.js app directory (routes)
│   ├── api/         # API routes
│   └── users/       # Example page with all patterns
├── components/
│   ├── ui/          # shadcn/ui components (Button, Form, Input, etc.)
│   └── providers.tsx # TanStack Query + nuqs providers
├── lib/
│   ├── db.ts        # Prisma client with pg adapter
│   ├── auth.ts      # Better Auth configuration
│   ├── queries.ts   # TanStack Query client setup
│   └── utils.ts     # Utilities (cn, etc.)
├── schemas/         # Zod validation schemas
├── actions/         # Server Actions
└── hooks/           # Custom React hooks (including TanStack Query)
```

See `references/project-structure.md` for architectural details and best practices.

## Troubleshooting

Common issues and solutions are documented in `references/setup-guide.md`:

- Database connection errors
- Prisma client issues
- Better Auth session problems
- Build errors

## Resources

### scripts/
- `setup.sh`: Post-creation setup automation (install deps, create .env, generate Prisma client)

### references/
- `setup-guide.md`: Detailed environment configuration, database setup, OAuth provider integration, and troubleshooting
- `project-structure.md`: Directory organization, architectural decisions, and extension patterns

### assets/
- `nextjs-boilerplate/`: Complete Next.js project template with all configuration files, components, pages, and authentication setup
