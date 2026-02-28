# Project Name

Brief description of what this project does.

## Tech Stack

- **Framework:** Next.js 16+ (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Auth:** Better Auth
- **UI:** Tailwind CSS + shadcn/ui
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 18+
- Docker and Docker Compose

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/username/repo.git
cd repo
```

2. **Install dependencies:**
```bash
bun install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. **Start database:**
```bash
bun run db:start
```

5. **Run migrations:**
```bash
bun run db:migrate
```

6. **Start development server:**
```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Database

**Useful commands:**
```bash
bun run db:start     # Start PostgreSQL
bun run db:stop      # Stop PostgreSQL
bun run db:migrate   # Run migrations
bun run db:studio    # Open Prisma Studio
bun run db:generate  # Regenerate Prisma Client
bun run db:reset     # Reset database (careful!)
```

## Development Workflow

**Before committing:**
```bash
bun run precommit    # Type-check, lint, format check
```

**Creating a new migration:**
```bash
bun run db:migrate   # Creates migration and applies it
```

## Deployment

This project is deployed on [Railway/Render].

**Environment variables needed in production:**
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth secret (min 32 chars)
- `BETTER_AUTH_URL` - Production URL
- Additional OAuth credentials if using social login

**Deploy:**
```bash
git push origin main  # Auto-deploys to production
```

## Project Structure

```
app/                 # Next.js App Router
├── (routes)/        # Route groups
├── api/             # API routes (minimal, prefer Server Actions)
lib/
├── actions/         # Server Actions
├── data/            # Database queries (Prisma)
├── schemas/         # Zod validation schemas
├── auth.ts          # Better Auth config
└── db.ts            # Prisma client
components/
├── [domain]/        # Domain-specific components
└── ui/              # Generic UI components (shadcn)
prisma/
├── schema.prisma    # Database schema
└── migrations/      # Migration history
```

## License

MIT
