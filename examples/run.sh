#!/bin/bash

# This script runs all the TypeScript example files in this directory.

# Change to the directory where the script is located, so it can be run from anywhere.
cd "$(dirname "$0")"

for f in *.ts; do
  if [ -f "$f" ]; then
    echo "======================================================================"
    echo "Running example: $f"
    echo "======================================================================"
    deno run -A "$f"
    echo ""
  fi
done