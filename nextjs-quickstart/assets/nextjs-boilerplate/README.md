# Next.js Quickstart Boilerplate

A modern Next.js 16 boilerplate with TypeScript, Tailwind CSS, Prisma, Better Auth, and shadcn/ui.

## Features

- ⚡ Next.js 16 with App Router
- 🔷 TypeScript for type safety
- 🎨 Tailwind CSS for styling
- 🧩 shadcn/ui components
- 🔐 Better Auth for authentication
- 📊 Prisma ORM with PostgreSQL
- 📦 Bun as package manager
- ✨ Biome for linting and formatting

## Getting Started

1. Install dependencies:
```bash
bun install
```

2. Set up your environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL`: Your app URL (http://localhost:3000 for development)

3. Set up the database:
```bash
bun run db:push
```

4. Run the development server:
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

```
src/
├── app/              # Next.js app directory
│   ├── admin/       # Admin dashboard
│   ├── api/         # API routes
│   └── page.tsx     # Landing page
├── components/
│   └── ui/          # shadcn/ui components
├── lib/             # Utility functions and configurations
│   ├── db.ts        # Prisma client
│   ├── auth.ts      # Better Auth configuration
│   └── utils.ts     # Helper functions
└── hooks/           # Custom React hooks
```

## Available Scripts

- `bun dev` - Start development server
- `bun build` - Build for production
- `bun start` - Start production server
- `bun lint` - Run Biome linter
- `bun lint:fix` - Fix linting issues
- `bun format` - Format code with Biome
- `bun db:push` - Push Prisma schema to database
- `bun db:studio` - Open Prisma Studio
- `bun db:generate` - Generate Prisma client

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Better Auth](https://better-auth.com)
- [Prisma](https://prisma.io)
