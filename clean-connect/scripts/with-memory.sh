#!/bin/bash

# This script runs a Node.js command with increased memory allocation
# Usage: ./with-memory.sh <command> [args...]

if [ $# -eq 0 ]; then
  echo "Usage: ./with-memory.sh <command> [args...]"
  echo "Example: ./with-memory.sh npm run build"
  exit 1
fi

# Set increased memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

echo "Running command with increased memory (8GB)..."
echo "$ $@"

# Execute the command with all arguments
"$@"
