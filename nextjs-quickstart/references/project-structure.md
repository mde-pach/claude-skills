# Project Structure

This document explains the organization and architectural decisions of the Next.js boilerplate.

## Directory Overview

```
project-root/
├── .husky/                   # Git hooks
│   ├── pre-commit           # Runs lint-staged
│   └── commit-msg           # Validates commit messages
├── prisma/
│   ├── schema.prisma        # Database schema
│   ├── prisma.config.ts     # Prisma 7 config (datasource URL)
│   └── seed.ts              # Database seeding script
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API routes
│   │   ├── users/          # Example: TanStack Query + nuqs + Forms
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout (with providers)
│   │   └── page.tsx        # Landing page
│   ├── components/
│   │   ├── ui/             # shadcn/ui components
│   │   └── providers.tsx   # TanStack Query + nuqs providers
│   ├── schemas/            # Zod validation schemas
│   │   └── user.ts         # Example user schema
│   ├── actions/            # Server Actions
│   │   └── user.ts         # Example user actions
│   ├── hooks/              # Custom React hooks
│   │   └── use-users.ts    # Example TanStack Query hooks
│   └── lib/                # Core utilities
│       ├── auth.ts         # Better Auth config
│       ├── db.ts           # Prisma client with pg adapter
│       ├── queries.ts      # TanStack Query client setup
│       └── utils.ts        # Helper functions
├── .env.example            # Environment template
├── .gitignore              # Git ignore rules
├── biome.json              # Biome config
├── commitlint.config.js    # Commit message linting
├── docker-compose.yml      # PostgreSQL container
├── next.config.ts          # Next.js config
├── package.json            # Dependencies
├── postcss.config.mjs      # PostCSS config
├── tailwind.config.ts      # Tailwind config
└── tsconfig.json           # TypeScript config
```

## Key Design Decisions

### App Router over Pages Router

Using Next.js App Router (introduced in Next.js 13) for:
- Server Components by default (better performance)
- Improved layouts and nested routing
- Built-in loading and error states
- Streaming and Suspense support

### TypeScript Configuration

- Strict mode enabled for type safety
- Path aliases (`@/*` → `./src/*`) for clean imports
- Modern target (ES2020) for latest features

### Styling Approach

**Tailwind CSS** with shadcn/ui:
- Utility-first CSS for rapid development
- shadcn/ui provides accessible, customizable components
- CSS variables for theming (light/dark mode ready)
- `cn()` utility (clsx + tailwind-merge) for conditional classes

### Authentication Architecture

**Better Auth** chosen for:
- Modern, type-safe API
- Database-backed sessions (more secure than JWT for many use cases)
- Easy social provider integration
- Built-in CSRF protection

Session flow:
1. User authenticates → Better Auth creates session in database
2. Session token stored in cookie
3. Middleware validates token on protected routes

### Database Layer

**Prisma 7** with PostgreSQL adapter:
- Type-safe database queries
- Auto-generated TypeScript types
- Schema migrations
- Prisma Studio for data browsing
- Direct connection with `@prisma/adapter-pg` for better performance

**Configuration split**:
- `prisma.config.ts`: Datasource URL (Prisma 7 requirement)
- `schema.prisma`: Models and relations

**Singleton pattern** in `src/lib/db.ts`:
- Prevents multiple Prisma instances in development
- Reuses connection pool across hot reloads
- Uses pg adapter for direct PostgreSQL connection

### State Management

**No global store** - Prefer React state and proper data flow:
- **Server state**: TanStack Query (data from API/database)
- **URL state**: nuqs (search, filters, pagination)
- **Local state**: useState (UI state, form state)
- **Form state**: React Hook Form (complex forms)
- **Context**: Only for cross-cutting concerns (theme, rarely needed)

**TanStack Query** for server state:
- Automatic caching and refetching
- Loading and error states
- Optimistic updates
- Mutations with rollback
- No need for Redux/Zustand for server data

**nuqs** for URL state:
- Type-safe URL parameters
- Perfect for search, filters, sorting
- Shareable URLs
- Browser back/forward works automatically

### Form Handling

**React Hook Form + Zod** pattern:
- Type-safe forms with validation
- Zod schemas in `src/schemas/`
- `@hookform/resolvers/zod` for integration
- Server-side validation with same schemas
- Reusable form components in `src/components/ui/form.tsx`

Example flow:
1. Define schema in `src/schemas/user.ts`
2. Create Server Action in `src/actions/user.ts` (validates with same schema)
3. Use React Hook Form in component with `zodResolver`
4. Get full type safety from schema to server

### Code Organization Patterns

#### `src/lib/` - Core Utilities
- `db.ts`: Prisma client with pg adapter (single source of truth)
- `auth.ts`: Better Auth configuration
- `queries.ts`: TanStack Query client setup
- `utils.ts`: Generic helpers (cn, formatters, etc.)

Keep business logic in Server Actions (`src/actions/`) or API routes.

#### `src/schemas/` - Validation Schemas
Zod schemas for data validation:
- Shared between client and server
- Type inference for TypeScript
- Reusable across forms and Server Actions

#### `src/actions/` - Server Actions
Server-side mutations and operations:
- Validate input with Zod schemas
- Use Prisma for database operations
- Call `revalidatePath()` to update caches
- Return typed results

#### `src/components/ui/` - UI Primitives
Only shadcn/ui components. Custom business components go in `src/components/` root.

#### `src/hooks/` - Custom Hooks
Reusable React hooks:
- TanStack Query hooks (e.g., `useUsers`, `useCreateUser`)
- Custom state hooks (e.g., `useDebounce`)
- Keep hooks client-side only

### Linting and Formatting

**Biome** instead of ESLint + Prettier:
- Single tool (faster)
- Better performance
- Simpler configuration
- Includes formatter and linter

## Extending the Boilerplate

### Adding a New Page with Data

1. Create Server Component in `src/app/[route]/page.tsx`:
```typescript
import { prisma } from '@/lib/db';

export default async function MyPage() {
  const data = await prisma.myModel.findMany();
  return <MyClientComponent initialData={data} />;
}
```

2. Create Client Component for interactivity:
```typescript
'use client';

import { useQueryState } from 'nuqs';

export function MyClientComponent({ initialData }) {
  const [search] = useQueryState('search');
  // Use TanStack Query if data needs refetching
}
```

### Adding a Form

1. Create Zod schema in `src/schemas/`:
```typescript
export const mySchema = z.object({
  name: z.string().min(1),
});
```

2. Create Server Action in `src/actions/`:
```typescript
'use server';

export async function createItem(data: z.infer<typeof mySchema>) {
  const validated = mySchema.parse(data);
  return await prisma.myModel.create({ data: validated });
}
```

3. Use React Hook Form in component:
```typescript
const form = useForm({
  resolver: zodResolver(mySchema),
});
```

### Adding API Routes

Create `src/app/api/[route]/route.ts`:

```typescript
export async function GET() {
  const data = await prisma.myModel.findMany();
  return Response.json(data);
}
```

### Adding Database Models

1. Update `prisma/schema.prisma`
2. Run `bun run db:push` (dev) or `bun run db:migrate` (prod)
3. Run `bun run db:generate`
4. Create schemas in `src/schemas/` and actions in `src/actions/`

### Adding Authentication Guards

Create middleware in `middleware.ts`:

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check authentication
  // Redirect if not authenticated
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

## Performance Considerations

- **Server Components**: Used by default, fetch data server-side
- **Client Components**: Use `'use client'` only when needed (interactivity, hooks)
- **Image Optimization**: Use `next/image` for automatic optimization
- **Code Splitting**: Automatic with App Router
- **Database**: Add indexes to Prisma schema for frequently queried fields
