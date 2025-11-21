#!/bin/bash
# Helper script to compare Replit files with current frontend

REPLIT_DIR="${1:-../replit-frontend}"  # Default to ../replit-frontend if not provided

if [ ! -d "$REPLIT_DIR" ]; then
    echo "❌ Replit directory not found: $REPLIT_DIR"
    echo "Usage: ./compare-replit.sh /path/to/extracted/replit/frontend"
    exit 1
fi

echo "📋 Comparing Replit files with current frontend..."
echo "Replit directory: $REPLIT_DIR"
echo ""

# Compare package.json
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 package.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$REPLIT_DIR/package.json" ]; then
    diff -u package.json "$REPLIT_DIR/package.json" || echo "⚠️  Files differ - review manually"
else
    echo "⚠️  Replit package.json not found"
fi
echo ""

# Compare vite.config.ts
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚙️  vite.config.ts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$REPLIT_DIR/vite.config.ts" ]; then
    diff -u vite.config.ts "$REPLIT_DIR/vite.config.ts" || echo "⚠️  Files differ - review manually"
else
    echo "⚠️  Replit vite.config.ts not found"
fi
echo ""

# Compare tsconfig.json
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 tsconfig.json"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f "$REPLIT_DIR/tsconfig.json" ]; then
    diff -u tsconfig.json "$REPLIT_DIR/tsconfig.json" || echo "⚠️  Files differ - review manually"
else
    echo "⚠️  Replit tsconfig.json not found"
fi
echo ""

# List components
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧩 Components Comparison"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Our components:"
ls -1 src/components/ 2>/dev/null || echo "  (none)"
echo ""
echo "Replit components:"
ls -1 "$REPLIT_DIR/src/components/" 2>/dev/null || echo "  (none)"
echo ""

# List new files in Replit
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🆕 Files in Replit that we don't have:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -d "$REPLIT_DIR/src" ]; then
    find "$REPLIT_DIR/src" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.css" | while read file; do
        rel_path="${file#$REPLIT_DIR/}"
        if [ ! -f "$rel_path" ]; then
            echo "  + $rel_path"
        fi
    done
else
    echo "⚠️  Replit src directory not found"
fi
echo ""

echo "✅ Comparison complete!"
echo ""
echo "Next steps:"
echo "1. Review the differences above"
echo "2. Check REPLIT_INTEGRATION_GUIDE.md for detailed instructions"
echo "3. Copy only the files you need"

