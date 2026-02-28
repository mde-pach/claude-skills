# Next.js Code Style Patterns

## Core Principles

1. **Server Components First** - Default to React Server Components, only use 'use client' when necessary
2. **Functional & Concise** - Short functions, avoid classes, prefer composition over abstraction
3. **Clear Boundaries** - Separate business logic (domain components) from agnostic UI components
4. **Minimal Dependencies** - Avoid unnecessary packages, use native solutions when possible
5. **Data Fetching in Routes** - Route components fetch data, pass to presentational components

## Library Choices

### Framework & Tooling

- **Next.js** - Always use the latest stable version (Next.js 16+)
- **TypeScript** - For type safety
- **Bun** - Package manager and runtime (replaces npm/yarn/pnpm)
  - Faster installs and script execution
  - Built-in TypeScript support
  - Drop-in replacement for Node.js
- **Biome** - For linting and formatting (replaces ESLint + Prettier)
  - Faster than ESLint/Prettier combined
  - Single tool for all code quality
  - Built-in import sorting
- **Tailwind CSS** - With strong theming approach (see Theming section)

### Data & Validation

- **Prisma** - ORM for all database operations (required)
  - Type-safe database access
  - Schema-first development
  - Automatic type generation
  - Migration management

- **Zod** - For all data parsing and validation
  - Form validation
  - API request/response validation
  - Environment variables
  - Data transformation

### Authentication

- **Better Auth** - For all authentication needs
  - Session management
  - OAuth providers
  - Email/password auth
  - Role-based access control

### UI Components

- **Radix UI** or **shadcn/ui** - For headless, accessible components
  - Prefer shadcn/ui for pre-styled Radix components
  - Full control over styling with Tailwind
  - Excellent accessibility out of the box

### Tailwind Theming

Use a centralized theme configuration:

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
    },
  },
}

export default config
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 47% 11%;
    --primary: 222 47% 11%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222 47% 11%;
    --muted: 210 40% 96%;
    --muted-foreground: 215 16% 47%;
    --border: 214 32% 91%;
  }

  .dark {
    --background: 222 47% 11%;
    --foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222 47% 11%;
    --secondary: 217 33% 17%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --border: 217 33% 17%;
  }
}
```

### Zod Validation Patterns

**Form validation with Server Actions:**

```tsx
// lib/schemas/product.ts
import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.number().positive('Price must be positive'),
  categoryId: z.string().uuid('Invalid category'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
```

```tsx
// lib/actions/create-product.ts
'use server'

import { createProductSchema } from '@/lib/schemas/product'

export async function createProduct(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    price: parseFloat(formData.get('price') as string),
    categoryId: formData.get('categoryId'),
  }

  const result = createProductSchema.safeParse(raw)

  if (!result.success) {
    return { error: result.error.flatten().fieldErrors }
  }

  const product = await db.product.create({
    data: result.data,
  })

  return { success: true, product }
}
```

**Environment variables:**

```ts
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
})

export const env = envSchema.parse(process.env)
```

### Better Auth Setup

```ts
// lib/auth.ts
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { db } from '@/lib/db'

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    },
  },
})

export type Session = typeof auth.$Infer.Session
```

**Protect routes:**

```tsx
// app/dashboard/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: headers(),
  })

  if (!session) {
    redirect('/login')
  }

  return <div>Welcome, {session.user.name}</div>
}
```

### shadcn/ui Component Usage

```tsx
// Use shadcn components as base for generic UI
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${product.price}</p>
        <Button className="mt-4">Add to Cart</Button>
      </CardContent>
    </Card>
  )
}
```

## Documentation and Debugging with Context7

### When to Use Context7 MCP

Use the Context7 MCP to retrieve up-to-date documentation in these situations:

1. **Non-standard libraries** - When using libraries outside the core stack (Next.js, Zod, Better Auth, Radix/shadcn, Tailwind)
2. **Bug encountered** - When encountering errors or unexpected behavior with any library
3. **API changes** - When library behavior doesn't match expectations (likely API changes)
4. **Complex integrations** - When integrating new tools or services

### Context7 Workflow

**Before implementing with a non-standard library:**

```
1. Use Context7 to fetch latest documentation
2. Review current API patterns and best practices
3. Implement following the latest patterns
4. Avoid relying on potentially outdated knowledge
```

**When encountering a bug:**

```
1. Note the exact error message and behavior
2. Use Context7 to fetch relevant library documentation
3. Check for:
   - Breaking changes in recent versions
   - Known issues or common mistakes
   - Updated API patterns
4. Apply fixes based on current documentation
5. Verify the fix works as expected
```

**Example - Using Context7 for a new library:**

```tsx
// Before: Guessing API based on assumptions
import { someLibrary } from 'some-package'
// ...unclear how to use it

// After: Using Context7 to get current docs
// 1. Query Context7 for 'some-package' documentation
// 2. Review examples and API patterns
// 3. Implement confidently with correct API

import { someLibrary } from 'some-package'
// Now using the library correctly based on latest docs
```

**Example - Debugging with Context7:**

```
Bug: Zod validation failing unexpectedly
Error: "Expected string, received number"

Steps:
1. Use Context7 to query Zod documentation
2. Check current validation patterns
3. Discover type coercion options in latest version
4. Apply fix using updated API

Fixed:
z.string() → z.coerce.string() // Current best practice from docs
```

### Systematic Debugging Process

When encountering any bug:

1. **Reproduce** - Ensure you can consistently reproduce the issue
2. **Isolate** - Identify the minimal code causing the problem
3. **Research** - Use Context7 to get current documentation
4. **Understand** - Read relevant sections of the docs
5. **Fix** - Apply solution based on current best practices
6. **Verify** - Confirm the fix resolves the issue

Don't guess or rely on outdated patterns—always verify with current documentation through Context7.

## Prisma ORM Patterns

### Database Setup

Always use Prisma as the ORM. Never use raw SQL queries or other ORMs.

**Prisma schema structure:**

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Models follow conventions:
// - cuid() for IDs
// - createdAt/updatedAt timestamps
// - Cascade deletes where appropriate
// - Indexes on foreign keys and query fields

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  orders Order[]

  @@index([email])
}

model Order {
  id        String      @id @default(cuid())
  total     Float
  status    OrderStatus @default(PENDING)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  items  OrderItem[]

  @@index([userId])
  @@index([status])
}

model OrderItem {
  id        String   @id @default(cuid())
  quantity  Int
  price     Float

  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
}

enum OrderStatus {
  PENDING
  COMPLETED
  CANCELLED
}
```

### Type-Safe Prisma Usage

**Always use Prisma generated types:**

```tsx
// lib/data/users.ts
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// Use generated types for return values
export async function getUserById(id: string) {
  return db.user.findUnique({
    where: { id },
    include: { orders: true },
  })
}

// Infer return type from Prisma query
export type UserWithOrders = Prisma.PromiseReturnType<typeof getUserById>

// Or use Prisma's validator for complex selects
const userWithOrdersSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  orders: {
    select: {
      id: true,
      total: true,
      status: true,
    },
  },
})

export type UserWithOrdersData = Prisma.UserGetPayload<{
  select: typeof userWithOrdersSelect
}>

export async function getUserWithOrdersData(id: string): Promise<UserWithOrdersData | null> {
  return db.user.findUnique({
    where: { id },
    select: userWithOrdersSelect,
  })
}
```

**Use Prisma types for input validation:**

```tsx
// lib/schemas/product.ts
import { z } from 'zod'
import { Prisma } from '@prisma/client'

// Base schema matches Prisma model
export const createProductSchema = z.object({
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  categoryId: z.string().cuid(),
}) satisfies z.ZodType<Prisma.ProductCreateInput>

export type CreateProductInput = z.infer<typeof createProductSchema>
```

**Type-safe queries:**

```tsx
// lib/data/orders.ts
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// Use Prisma types for where conditions
export async function getOrdersByStatus(status: Prisma.EnumOrderStatusFilter) {
  return db.order.findMany({
    where: { status },
    include: { items: true },
  })
}

// Type-safe aggregations
export async function getOrderStats(userId: string) {
  const stats = await db.order.aggregate({
    where: { userId },
    _sum: { total: true },
    _count: true,
    _avg: { total: true },
  })

  return {
    totalSpent: stats._sum.total ?? 0,
    orderCount: stats._count,
    averageOrder: stats._avg.total ?? 0,
  }
}

// Use transaction for complex operations
export async function createOrderWithItems(
  userId: string,
  items: Array<{ productId: string; quantity: number; price: number }>
) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        userId,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      },
    })

    await tx.orderItem.createMany({
      data: items.map(item => ({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      })),
    })

    return tx.order.findUnique({
      where: { id: order.id },
      include: { items: true },
    })
  })
}
```

### Prisma Client Setup

```tsx
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### API Routes vs Server Actions Decision

**Use Server Actions (default):**
- All form submissions
- Data mutations from UI
- Operations triggered by user actions
- Anything that needs revalidation

```tsx
// lib/actions/create-order.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createOrder(userId: string, items: CartItem[]) {
  const order = await createOrderWithItems(userId, items)
  revalidatePath('/orders')
  return order
}
```

**Use API Routes only for:**
- Webhooks from external services
- Public APIs for third parties
- Non-browser clients
- Custom response formats (streaming, etc.)

```tsx
// app/api/webhooks/stripe/route.ts
import { db } from '@/lib/db'

export async function POST(request: Request) {
  const event = await request.json()

  // Handle webhook
  if (event.type === 'payment_intent.succeeded') {
    await db.order.update({
      where: { id: event.data.object.metadata.orderId },
      data: { status: 'COMPLETED' },
    })
  }

  return Response.json({ received: true })
}
```

## Docker Compose Setup

Always use Docker Compose for local development to ensure consistency across team and environments.

### Basic Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: myapp-postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: myapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

```bash
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
REDIS_URL="redis://localhost:6379"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth (if needed)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

### Development Workflow

```bash
# Start services
docker compose up -d

# Check services are healthy
docker compose ps

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client (after schema changes)
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio

# Stop services
docker compose down

# Reset database (careful!)
docker compose down -v
npx prisma migrate reset
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:start": "docker compose up -d",
    "db:stop": "docker compose down",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:reset": "docker compose down -v && docker compose up -d && prisma migrate reset",
    "db:seed": "prisma db seed"
  }
}
```

### Prisma Seed Script

```tsx
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()

  // Seed users
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  // Seed products
  const products = await Promise.all([
    prisma.product.create({
      data: { name: 'Product 1', price: 29.99, categoryId: 'cat1' },
    }),
    prisma.product.create({
      data: { name: 'Product 2', price: 49.99, categoryId: 'cat1' },
    }),
  ])

  console.log('Seeded:', { user, products })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

```json
// package.json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Project Management & Deployment

### Local Development Workflow

Always run these checks locally before committing:

```json
// package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check": "biome check .",
    "check:fix": "biome check --write .",
    "type-check": "tsc --noEmit",
    "db:start": "docker compose up -d",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "precommit": "bun run type-check && bun run check"
  }
}
```

**Before every commit:**
```bash
bun run precommit  # Runs type-check and Biome check (lint + format)
```

**Biome replaces both ESLint and Prettier:**
- `biome check .` - Lint and format check (for CI/precommit)
- `biome check --write .` - Lint and auto-fix + format
- `biome format .` - Format check only
- `biome format --write .` - Format only
- `biome lint .` - Lint check only

This ensures code is type-safe, linted, and formatted before pushing.

### Git Repository Setup

**Simple workflow for small projects:**

1. **Initialize repository:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/repo.git
git push -u origin main
```

2. **Regular workflow:**
```bash
# Make changes
bun run precommit  # Check before committing
git add .
git commit -m "Add feature X"
git push
```

**Commit message conventions (simple):**
- `Add X` - New feature
- `Update X` - Enhancement to existing feature
- `Fix X` - Bug fix
- `Refactor X` - Code improvements without behavior change
- `Remove X` - Delete code/feature

### Deployment Setup (Railway/Render)

Both Railway and Render support automatic deployments from GitHub with zero-config Next.js support.

#### Railway Deployment

**1. Create Railway project:**
```bash
# Install Railway CLI
bun add -g @railway/cli

# Login and initialize
railway login
railway init
```

**2. Add PostgreSQL database:**
```bash
railway add postgresql
```

Railway automatically sets `DATABASE_URL` environment variable.

**3. Configure environment variables:**

In Railway dashboard, add:
```bash
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=https://your-app.railway.app
NODE_ENV=production

# OAuth (if needed)
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
```

**4. Deploy:**
```bash
# One-time setup
railway link

# Deploy
git push origin main  # Railway auto-deploys from main branch
```

**5. Run database migrations:**
```bash
railway run npx prisma migrate deploy
```

#### Render Deployment

**1. Create new Web Service:**
- Connect GitHub repository
- Render auto-detects Next.js

**2. Configure build settings:**
```yaml
# Build Command
bun install && bunx prisma generate && bun run build

# Start Command
bun start
```

**3. Add PostgreSQL database:**
- Create new PostgreSQL instance in Render
- Copy internal database URL

**4. Environment variables:**
```bash
DATABASE_URL=your-render-postgres-url
BETTER_AUTH_SECRET=your-secret-min-32-chars
BETTER_AUTH_URL=https://your-app.onrender.com
NODE_ENV=production
```

**5. Deploy:**
```bash
git push origin main  # Render auto-deploys
```

**6. Run migrations (one-time):**

In Render dashboard, run shell command:
```bash
npx prisma migrate deploy
```

### Production Database Migrations

**When adding new migrations:**

1. **Develop locally:**
```bash
docker compose up -d
npx prisma migrate dev --name add_new_feature
```

2. **Commit migration files:**
```bash
git add prisma/migrations
git commit -m "Add migration: add_new_feature"
git push
```

3. **Deploy to production:**

After deployment, run on Railway/Render:
```bash
npx prisma migrate deploy
```

**Migration best practices:**
- Always test migrations locally first
- Never edit migration files manually
- Use `prisma migrate deploy` in production (not `dev`)
- Keep migrations small and focused

### Environment Variables Management

**Structure:**

```
.env.local          # Local development (gitignored)
.env.example        # Template for team (committed)
```

**.env.local (local development):**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/myapp"
BETTER_AUTH_SECRET="local-dev-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
```

**.env.example (committed to git):**
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Better Auth
BETTER_AUTH_SECRET="" # Generate with: openssl rand -base64 32
BETTER_AUTH_URL="" # Your production URL

# OAuth (optional)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

**Never commit:**
- `.env.local`
- `.env`
- Any file with actual secrets

**Always commit:**
- `.env.example` (template only)
- `docker-compose.yml`

### Pre-deployment Checklist

Before deploying to production:

- [ ] Run `bun run build` locally to verify build succeeds
- [ ] Test production build: `bun run build && npm start`
- [ ] Verify all environment variables are set in Railway/Render
- [ ] Database migrations applied: `npx prisma migrate deploy`
- [ ] Test authentication flow in production
- [ ] Check OAuth redirect URIs if using social login
- [ ] Verify BETTER_AUTH_URL matches production domain

### Continuous Deployment

Both Railway and Render auto-deploy on push to main:

```bash
# Make changes
bun run precommit  # Local checks
git add .
git commit -m "Add feature"
git push  # Triggers auto-deployment
```

**Deployment happens automatically:**
1. Code pushed to GitHub
2. Railway/Render detects change
3. Builds application
4. Runs migrations (if configured)
5. Deploys new version
6. Zero downtime deployment

**Monitor deployment:**
- Railway: `railway logs`
- Render: Check deployment logs in dashboard

## Architecture Patterns

### File Structure

```
app/
├── (routes)/
│   ├── page.tsx              # Server Component, fetches data
│   └── layout.tsx            # Shared layouts
├── api/                      # API routes (when needed)
lib/
├── data/                     # Data access layer
│   ├── users.ts              # User-related data functions
│   └── orders.ts             # Order-related data functions
├── actions/                  # Server Actions for mutations
│   └── create-order.ts
└── utils/                    # Shared utilities
components/
├── [domain]/                 # Domain-specific components
│   ├── OrderList.tsx         # Knows about orders
│   └── UserProfile.tsx       # Knows about users
└── ui/                       # Generic, reusable components
    ├── Card.tsx              # Generic card
    ├── Button.tsx            # Generic button
    └── Input.tsx             # Generic input
```

### Data Fetching Pattern

**Routes fetch data, pass to components:**

```tsx
// app/dashboard/orders/page.tsx (Server Component)
import { getRecentOrders } from '@/lib/data/orders'
import { OrderList } from '@/components/orders/OrderList'

export default async function OrdersPage() {
  const orders = await getRecentOrders()

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Recent Orders</h1>
      <OrderList orders={orders} />
    </div>
  )
}
```

**Data layer functions are simple and focused:**

```tsx
// lib/data/orders.ts
export async function getRecentOrders() {
  return db.order.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
  })
}

export async function getOrderById(id: string) {
  return db.order.findUnique({
    where: { id },
    include: { items: true },
  })
}
```

### Component Boundaries

**Domain components** (in `components/[domain]/`):
- Know about business logic
- Accept domain-specific objects
- Contain business rules and formatting
- Stay as Server Components unless interactivity needed

```tsx
// components/orders/OrderList.tsx (Server Component)
import { Card } from '@/components/ui/Card'

export function OrderList({ orders }: { orders: Order[] }) {
  if (orders.length === 0) {
    return <p className="text-muted">No orders yet</p>
  }

  return (
    <div className="space-y-4">
      {orders.map(order => (
        <Card key={order.id}>
          <div className="flex justify-between">
            <span>Order #{order.id}</span>
            <span className="font-medium">${order.total.toFixed(2)}</span>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

**Generic components** (in `components/ui/`):
- Fully agnostic to business logic
- Accept primitive types or generic props
- Reusable across any domain
- Stay as Server Components by default

```tsx
// components/ui/Card.tsx (Server Component)
import type { ReactNode } from 'react'

export function Card({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      {children}
    </div>
  )
}
```

### Client Component Guidelines

Only use 'use client' when you need:
- Browser APIs (localStorage, window)
- React hooks (useState, useEffect, useRef)
- Event handlers that need state
- Third-party libraries that require client

**Keep client components minimal:**

```tsx
// components/ui/SearchInput.tsx
'use client'

import { useState } from 'react'

export function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('')

  return (
    <input
      value={query}
      onChange={(e) => {
        setQuery(e.target.value)
        onSearch(e.target.value)
      }}
      placeholder="Search..."
      className="border rounded px-3 py-2"
    />
  )
}
```

### Server Actions for Mutations

Use Server Actions for data mutations, not API routes:

```tsx
// lib/actions/create-order.ts
'use server'

import { revalidatePath } from 'next/cache'

export async function createOrder(formData: FormData) {
  const items = JSON.parse(formData.get('items') as string)

  const order = await db.order.create({
    data: {
      items: { create: items },
      total: items.reduce((sum, item) => sum + item.price, 0),
    },
  })

  revalidatePath('/dashboard/orders')
  return { success: true, orderId: order.id }
}
```

**Use in client components:**

```tsx
// components/orders/OrderForm.tsx
'use client'

import { createOrder } from '@/lib/actions/create-order'

export function OrderForm() {
  return (
    <form action={createOrder}>
      {/* form fields */}
      <button type="submit">Create Order</button>
    </form>
  )
}
```

## Code Style Guidelines

### Keep Functions Short and Focused

**Good:**
```tsx
export function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <h3>{product.name}</h3>
      <p>${product.price}</p>
    </Card>
  )
}
```

**Avoid:**
```tsx
export function ProductCard({ product }: { product: Product }) {
  // Don't add unnecessary logic
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(product.price)
  }, [product.price])

  // Just use template strings directly
  return (
    <Card>
      <h3>{product.name}</h3>
      <p>{formattedPrice}</p>
    </Card>
  )
}
```

### No Over-Engineering

Don't add abstractions prematurely:

**Good:**
```tsx
// Three similar components? That's fine.
export function UserCard({ user }) {
  return <Card><h3>{user.name}</h3></Card>
}

export function ProductCard({ product }) {
  return <Card><h3>{product.name}</h3></Card>
}
```

**Avoid:**
```tsx
// Don't create generic "EntityCard" for 2-3 use cases
export function EntityCard({ entity, type }) {
  return (
    <Card>
      <h3>{entity[type === 'user' ? 'name' : 'title']}</h3>
    </Card>
  )
}
```

### Minimal Error Handling

Only validate at system boundaries:

**Good:**
```tsx
// Validate user input
export async function createUser(formData: FormData) {
  const email = formData.get('email')
  if (!email || !email.includes('@')) {
    return { error: 'Invalid email' }
  }
  return saveUser(email)
}
```

**Avoid:**
```tsx
// Don't validate internal function calls
function formatUserName(user: User) {
  if (!user) throw new Error('User required')
  if (!user.name) throw new Error('Name required')
  return user.name.trim()
}
```

### Colocation

Keep related code together:

```
app/dashboard/orders/
├── page.tsx                    # Route
├── OrdersTable.tsx             # Used only here
└── OrderFilters.tsx            # Used only here

components/orders/
├── OrderList.tsx               # Reused across routes
└── OrderCard.tsx               # Reused across routes
```

## Common Patterns

### Loading States

Use Suspense boundaries:

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { RecentOrders } from '@/components/orders/RecentOrders'

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading orders...</div>}>
        <RecentOrders />
      </Suspense>
    </div>
  )
}
```

### Error Handling

Use error boundaries:

```tsx
// app/dashboard/orders/error.tsx
'use client'

export default function Error({ error, reset }: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Failed to load orders</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

### Type Safety

Keep types simple and inline when possible:

```tsx
// Good - inline when used once
export function UserBadge({ user }: { user: { name: string; role: string } }) {
  return <span>{user.name} ({user.role})</span>
}

// Extract when reused
type User = {
  name: string
  role: string
}

export function UserBadge({ user }: { user: User }) {
  return <span>{user.name} ({user.role})</span>
}

export function UserList({ users }: { users: User[] }) {
  return <div>{users.map(u => <UserBadge key={u.name} user={u} />)}</div>
}
```

### Strict Typing Rules

**Avoid type ignores and `any` types:**

❌ **Never do this:**
```tsx
// @ts-ignore
const data = fetchData()

// @ts-expect-error
const result = processData(data)

function handleData(data: any) {
  return data.value
}
```

✅ **Do this instead:**
```tsx
// Use proper types
const data = await fetchData()

// Fix the type error properly
const result = processData(data)

// Define proper types
function handleData(data: { value: string }) {
  return data.value
}
```

**When `any` is acceptable (rare):**

Only use `any` when a function truly accepts any type of data and operates generically:

```tsx
// Acceptable - truly generic logging
function logValue(value: any) {
  console.log('Value:', value)
}

// Better - use unknown and type guards
function processValue(value: unknown) {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  throw new Error('Unsupported type')
}
```

**When type ignore is acceptable (very rare):**

Only use `@ts-expect-error` when:
1. The linter issue is not justified by your implementation
2. You've verified the code is actually safe
3. You've added a comment explaining why

```tsx
// Acceptable - library types are wrong
// @ts-expect-error - Library types incorrectly require string, but accepts number
thirdPartyLib.setValue(123)

// Not acceptable - fix the type instead
// @ts-expect-error - TODO: fix this later
const user = data.user
```

**Fix missing types instead of using `any`:**

❌ **Bad:**
```tsx
function updateUser(userId: any, data: any) {
  return db.user.update({
    where: { id: userId },
    data: data,
  })
}
```

✅ **Good:**
```tsx
import type { Prisma } from '@prisma/client'

function updateUser(userId: string, data: Prisma.UserUpdateInput) {
  return db.user.update({
    where: { id: userId },
    data,
  })
}
```

**Biome configuration enforces this:**

```json
// biome.json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "error"  // Change from "off" to "error"
      }
    }
  }
}
```

**Summary:**
- **Default:** Use proper types from Prisma, Zod schemas, or define them
- **If type is missing:** Fix it by adding the proper type
- **Never use:** `@ts-ignore` (hides errors)
- **Rarely use:** `@ts-expect-error` (only when library types are wrong)
- **Almost never use:** `any` (use `unknown` + type guards instead)
