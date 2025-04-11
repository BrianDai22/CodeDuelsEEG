#!/bin/bash

echo "Fixing analytics imports..."

# Fix analytics imports in src directory
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@/lib/analytics|@shared/lib/analytics|g'

echo "Analytics imports fixed!" 