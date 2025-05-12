#!/bin/bash
echo "Cleaning up previous build artifacts..."
rm -rf dist/
rm -rf node_modules/.vite
rm -rf .turbo

echo "Environment information:"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
