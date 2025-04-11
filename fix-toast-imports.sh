#!/bin/bash

echo "Fixing toast imports..."

# Fix toast imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/toast|@ui/feedback/toast|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/use-toast|@shared/hooks/ui/use-toast|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@ui/feedback/use-toast|@shared/hooks/ui/use-toast|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|from "react-hot-toast"|from "sonner"|g'

echo "Toast imports fixed!" 