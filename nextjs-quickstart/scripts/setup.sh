#!/bin/bash
set -e

echo "🚀 Setting up Next.js project..."

# Install dependencies with bun
echo "📦 Installing dependencies with Bun..."
bun install

# Copy .env.example to .env if it doesn't exist
if [ ! -f .env ]; then
  echo "📝 Creating .env file from .env.example..."
  cp .env.example .env
  echo "⚠️  Please update .env with your database URL and secrets!"
else
  echo "✅ .env file already exists"
fi

# Initialize git repository if not already initialized
if [ ! -d .git ]; then
  echo "🔧 Initializing git repository..."
  git init
  git add .
  git commit -m "chore: initial commit"
fi

# Set up Husky git hooks
echo "🪝 Setting up git hooks..."
bun run prepare

# Generate Prisma client
echo "🔧 Generating Prisma client..."
bun run db:generate

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your database credentials"
echo "2. Start Docker Compose: 'docker compose up -d'"
echo "3. Run database migrations: 'bun run db:push'"
echo "4. (Optional) Seed the database: 'bun run db:seed'"
echo "5. Start development server: 'bun dev'"
echo ""
echo "📚 Learn more:"
echo "- TanStack Query examples: /users page"
echo "- React Hook Form: Check user creation form"
echo "- nuqs URL state: See search functionality"
