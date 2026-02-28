# Setup Guide

This guide provides detailed setup instructions for the Next.js quickstart boilerplate.

## Prerequisites

- **Bun**: Install from [bun.sh](https://bun.sh)
- **PostgreSQL**: Running database instance (local or cloud)

## Initial Setup

### 1. Environment Configuration

The `.env.example` file contains all required environment variables. Copy it to `.env`:

```bash
cp .env.example .env
```

Configure these variables:

#### DATABASE_URL
PostgreSQL connection string format:
```
postgresql://username:password@host:port/database
```

Examples:
- Local: `postgresql://postgres:password@localhost:5432/myapp`
- Supabase: `postgresql://postgres:[password]@[project].supabase.co:5432/postgres`
- Railway: Provided in Railway dashboard
- Vercel Postgres: Provided in Vercel dashboard

#### BETTER_AUTH_SECRET
Generate a secure random secret:
```bash
openssl rand -base64 32
```

#### BETTER_AUTH_URL
Your application URL:
- Development: `http://localhost:3000`
- Production: Your deployed URL (e.g., `https://myapp.vercel.app`)

### 2. Database Setup

After configuring your DATABASE_URL:

```bash
# Generate Prisma client
bun run db:generate

# Push schema to database (creates tables)
bun run db:push
```

**Note**: `db:push` is used for development. For production, use migrations:
```bash
bunx prisma migrate dev --name init
```

### 3. Running the Application

```bash
# Development
bun dev

# Production build
bun build
bun start
```

## Better Auth Configuration

The boilerplate includes email/password authentication. To add social providers:

### Adding GitHub OAuth

1. Create a GitHub OAuth app at https://github.com/settings/developers
2. Set callback URL to `http://localhost:3000/api/auth/callback/github`
3. Add to `.env`:
```
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

4. Update `src/lib/auth.ts`:
```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
}
```

### Adding Google OAuth

Similar process - create OAuth credentials in Google Cloud Console.

## Prisma Schema Customization

The default schema includes User, Session, Account, and VerificationToken models required by Better Auth.

To add custom fields to User:

```prisma
model User {
  // ... existing fields
  role      String   @default("user")
  bio       String?
  // ... etc
}
```

After modifying schema:
```bash
bun run db:push
bun run db:generate
```

## Adding shadcn/ui Components

The boilerplate includes Button and Table components. To add more:

```bash
bunx shadcn@latest add [component-name]
```

Examples:
```bash
bunx shadcn@latest add dropdown-menu
bunx shadcn@latest add dialog
bunx shadcn@latest add form
```

## Troubleshooting

### "Can't reach database server"
- Verify DATABASE_URL is correct
- Check database is running
- Verify network access (firewalls, VPNs)

### Prisma Client errors
- Run `bun run db:generate` after schema changes
- Delete `node_modules/.prisma` and regenerate

### Better Auth session issues
- Ensure BETTER_AUTH_SECRET is set
- Check BETTER_AUTH_URL matches your actual URL
- Verify database tables exist (run db:push)
