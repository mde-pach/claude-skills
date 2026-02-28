#!/usr/bin/env bash
# sync.sh - Manage symlinks between ~/claude-skills and ~/.claude/skills
# Usage:
#   ./sync.sh              # Sync all: create missing symlinks, report stale ones
#   ./sync.sh --clean      # Also remove stale symlinks pointing to this repo
#   ./sync.sh --migrate    # Move real dirs from ~/.claude/skills/ into repo and link them

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
CLEAN=false
MIGRATE=false

for arg in "$@"; do
  case "$arg" in
    --clean) CLEAN=true ;;
    --migrate) MIGRATE=true ;;
  esac
done

echo "Repo:   $REPO_DIR"
echo "Skills: $SKILLS_DIR"
echo ""

# 0. Migrate: move real dirs from ~/.claude/skills/ into the repo
if $MIGRATE; then
  echo "=== Migrate ==="
  for d in "$SKILLS_DIR"/*/; do
    [ -d "$d" ] || continue
    name="$(basename "$d")"
    # Skip if it's already a symlink
    [ -L "$SKILLS_DIR/$name" ] && continue
    # Skip if already exists in repo
    if [ -d "$REPO_DIR/$name" ]; then
      echo "  !!  $name exists in both places, skipping (resolve manually)"
      continue
    fi
    mv "$d" "$REPO_DIR/$name"
    ln -s "$REPO_DIR/$name" "$SKILLS_DIR/$name"
    echo "  >>  $name (migrated to repo and linked)"
  done
  echo ""
fi

# 1. Create symlinks for repo skills that aren't linked yet
echo "=== Sync ==="
for d in "$REPO_DIR"/*/; do
  name="$(basename "$d")"
  [[ "$name" == _* ]] && continue  # skip _archive, _templates, etc.
  [[ "$name" == .* ]] && continue  # skip .git, etc.

  target="$SKILLS_DIR/$name"

  if [ -L "$target" ]; then
    current="$(readlink "$target")"
    expected="$REPO_DIR/$name"
    if [ "$current" = "$expected" ]; then
      echo "  ok  $name"
    else
      echo "  !!  $name -> $current (points elsewhere, skipping)"
    fi
  elif [ -e "$target" ]; then
    echo "  !!  $name exists as a real dir/file (run --migrate to fix)"
  else
    ln -s "$REPO_DIR/$name" "$target"
    echo "  ++  $name (linked)"
  fi
done

# 2. Detect stale symlinks in ~/.claude/skills that point into this repo but no longer exist
echo ""
echo "=== Stale check ==="
found_stale=false
for link in "$SKILLS_DIR"/*; do
  [ -L "$link" ] || continue
  link_target="$(readlink "$link")"

  case "$link_target" in
    "$REPO_DIR"*)
      if [ ! -e "$link" ]; then
        found_stale=true
        if $CLEAN; then
          rm "$link"
          echo "  --  $(basename "$link") (removed stale symlink)"
        else
          echo "  ??  $(basename "$link") -> $link_target (stale, use --clean to remove)"
        fi
      fi
      ;;
  esac
done
$found_stale || echo "  (none)"

echo ""
echo "Done."
