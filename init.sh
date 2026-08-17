#!/usr/bin/env bash
# Verification for the web app (Angular 21.x + TypeScript ES2025).
set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "MISS Node.js not found on PATH"
  exit 1
fi
echo "OK   Node $(node --version)"

if ! command -v npm >/dev/null 2>&1; then
  echo "MISS npm not found on PATH"
  exit 1
fi
echo "OK   npm $(npm --version)"

if [ -f "package.json" ]; then
  echo "OK   package.json detected"
  if [ ! -d "node_modules" ]; then
    echo "..   installing dependencies (npm ci)"
    npm ci
  fi
  npm test -- --watch=false --code-coverage
else
  echo "----  No package.json yet — feat-001 not started."
  echo "     See feature_list.json for the next step."
  exit 1
fi

echo "web verification passed."
