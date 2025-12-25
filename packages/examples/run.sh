#!/bin/bash

# This script runs all the TypeScript example files in this directory with various command line parameters.

# Change to the directory where the script is located, so it can be run from anywhere.
cd "$(dirname "$0")"

echo "======================================================================"
echo "Running CLI examples with different command line parameters"
echo "======================================================================"

# Run cliapp.run.ts with various commands and options
if [ -f "cliapp.run.ts" ]; then
  echo ""
  echo ">>> cliapp.run.ts --help"
  deno run -A cliapp.run.ts --help
  
  echo ""
  echo ">>> cliapp.run.ts process --help"
  deno run -A cliapp.run.ts process --help
  
  echo ""
  echo ">>> cliapp.run.ts process file1.txt file2.txt --verbose"
  deno run -A cliapp.run.ts process file1.txt file2.txt --verbose
  
  echo ""
  echo ">>> cliapp.run.ts clean --help"
  deno run -A cliapp.run.ts clean --help
  
  echo ""
  echo ">>> cliapp.run.ts clean --dry-run"
  deno run -A cliapp.run.ts clean --dry-run
  
  echo ""
  echo ">>> cliapp.run.ts --config myconfig.json --quiet"
  deno run -A cliapp.run.ts --config myconfig.json --quiet
fi

# Run other examples with basic execution
for f in *.ts; do
  if [ -f "$f" ] && [ "$f" != "cliapp.run.ts" ]; then
    echo ""
    echo "======================================================================"
    echo "Running example: $f"
    echo "======================================================================"
    deno run -A "$f"
  fi
done

echo ""
echo "======================================================================"
echo "All examples completed"
echo "======================================================================"