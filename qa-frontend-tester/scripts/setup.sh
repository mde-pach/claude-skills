#!/bin/bash

# Visual Layout Tester - Setup Script
# Copies screenshot.js to project root

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(pwd)"

echo "📦 Setting up Visual Layout Tester..."
echo "   Project: $PROJECT_ROOT"
echo "   Skill: $SCRIPT_DIR"

# Check if screenshot.js already exists
if [ -f "$PROJECT_ROOT/screenshot.js" ]; then
  echo "⚠️  screenshot.js already exists"
  read -p "   Overwrite? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
  fi
fi

# Copy screenshot.js
echo "📋 Copying screenshot.js..."
cp "$SCRIPT_DIR/screenshot.js" "$PROJECT_ROOT/screenshot.js"
chmod +x "$PROJECT_ROOT/screenshot.js"

# Create .visual-testing directory
echo "📁 Creating .visual-testing directory..."
mkdir -p "$PROJECT_ROOT/.visual-testing/actions"
mkdir -p "$PROJECT_ROOT/.visual-testing/pages"

# Copy config example if not exists
if [ ! -f "$PROJECT_ROOT/.visual-testing/config.json" ]; then
  echo "📋 Creating config example..."
  cp "$SCRIPT_DIR/../config.example.json" "$PROJECT_ROOT/.visual-testing/config.example.json"
fi

# Add to .gitignore if exists
if [ -f "$PROJECT_ROOT/.gitignore" ]; then
  echo "📝 Updating .gitignore..."
  if ! grep -q ".visual-testing/" "$PROJECT_ROOT/.gitignore"; then
    echo "" >> "$PROJECT_ROOT/.gitignore"
    echo "# Visual testing" >> "$PROJECT_ROOT/.gitignore"
    echo ".visual-testing/actions/" >> "$PROJECT_ROOT/.gitignore"
    echo ".visual-testing/pages/" >> "$PROJECT_ROOT/.gitignore"
    echo ".screenshots/" >> "$PROJECT_ROOT/.gitignore"
    echo "" >> "$PROJECT_ROOT/.gitignore"
    echo "# Keep config template" >> "$PROJECT_ROOT/.gitignore"
    echo "!.visual-testing/config.example.json" >> "$PROJECT_ROOT/.gitignore"
  fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Set up credentials (optional):"
echo "     cp .visual-testing/config.example.json .visual-testing/config.json"
echo "     # Edit config.json with your credentials"
echo ""
echo "  2. Take your first screenshot:"
echo "     node screenshot.js http://localhost:3000/login"
echo ""
echo "  3. Test a protected page:"
echo "     node screenshot.js http://localhost:3000/dashboard"
echo ""
