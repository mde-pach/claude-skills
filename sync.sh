#!/usr/bin/env bash
# sync.sh - Manage symlinks between ~/claude-skills and ~/.claude/skills
# Usage:
#   ./sync.sh          # Sync all: create missing symlinks, report stale ones
#   ./sync.sh --clean  # Also remove stale symlinks pointing to this repo

set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$HOME/.claude/skills"
CLEAN=false

[[ "${1:-}" == "--clean" ]] && CLEAN=true

echo "Repo:   $REPO_DIR"
echo "Skills: $SKILLS_DIR"
echo ""

# 1. Create symlinks for repo skills that aren't linked yet
for d in "$REPO_DIR"/*/; do
  name="$(basename "$d")"
  [[ "$name" == _* ]] && continue  # skip _archive, _templates, etc.

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
    echo "  !!  $name exists as a real dir/file (not a symlink), skipping"
  else
    ln -s "$REPO_DIR/$name" "$target"
    echo "  ++  $name (linked)"
  fi
done

# 2. Detect stale symlinks in ~/.claude/skills that point into this repo but no longer exist
echo ""
for link in "$SKILLS_DIR"/*; do
  [ -L "$link" ] || continue
  link_target="$(readlink "$link")"

  # Only check links pointing to our repo
  case "$link_target" in
    "$REPO_DIR"*)
      if [ ! -e "$link" ]; then
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

echo ""
echo "Done."
