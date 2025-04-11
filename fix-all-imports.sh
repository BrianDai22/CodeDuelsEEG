#!/bin/bash

echo "Fixing all import paths in the codebase..."

# UI component imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/button|@ui/button|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/form/([a-zA-Z-]+)|@ui/form/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/data/([a-zA-Z-]+)|@ui/data/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/([a-zA-Z-]+)|@ui/feedback/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/layout/([a-zA-Z-]+)|@ui/layout/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/tracked/([a-zA-Z-]+)|@ui/tracked/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/([a-zA-Z-]+)|@ui/\1|g'

# Layout component imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/layout/headers/([a-zA-Z-]+)|@shared/components/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/layout/footers/([a-zA-Z-]+)|@shared/components/\1|g'

# Context imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@contexts/auth/AuthContext|@features/auth/AuthContext|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@contexts/admin/AdminContext|@shared/context/AdminContext|g'

# Common component imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/common/WaitlistForm|@shared/components/WaitlistForm|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/common/ImageEditor|@shared/components/ImageEditor|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/common/CodeEditor|@shared/components/CodeEditor|g'

# Feature component imports
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/features/premium/([a-zA-Z-]+)|@features/premium/components/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/features/auth/([a-zA-Z-]+)|@features/auth/components/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/features/arena/([a-zA-Z-]+)|@features/arena/components/\1|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/features/profile/([a-zA-Z-]+)|@features/profile/components/\1|g'

# Fix toast/feedback components
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/toast|@ui/feedback/toast|g'
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/use-toast|@shared/hooks/ui/use-toast|g'

echo "All import paths fixed!" 