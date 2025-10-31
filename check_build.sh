#!/bin/bash
echo "=== CallVia Dashboard Build Diagnostic ==="
echo ""
echo "1. Checking Node version..."
node --version
echo ""
echo "2. Checking npm version..."
npm --version
echo ""
echo "3. Checking dependencies..."
npm list --depth=0 2>/dev/null | head -20
echo ""
echo "4. Attempting build..."
npm run build 2>&1 | tail -100
echo ""
echo "=== Diagnostic Complete ==="
