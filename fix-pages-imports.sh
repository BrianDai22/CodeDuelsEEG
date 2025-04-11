#!/bin/bash

echo "Fixing imports in feature pages..."

# Fix feature pages imports
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/button|@ui/button|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/form/([a-zA-Z-]+)|@ui/form/\1|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/data/([a-zA-Z-]+)|@ui/data/\1|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/([a-zA-Z-]+)|@ui/feedback/\1|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/layout/([a-zA-Z-]+)|@ui/layout/\1|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/([a-zA-Z-]+)|@ui/\1|g'

# Fix header imports in feature pages
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/layout/headers/([a-zA-Z-]+)|@shared/components/\1|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/layout/footers/([a-zA-Z-]+)|@shared/components/\1|g'

# Fix common component imports in feature pages
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/common/WaitlistForm|@shared/components/WaitlistForm|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/common/ImageEditor|@shared/components/ImageEditor|g'
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/common/CodeEditor|@shared/components/CodeEditor|g'

# Fix premium component imports
find src/features -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/features/premium/PremiumPaymentHistory|@features/premium/components/PremiumPaymentHistory|g'

# Fix imports in pages directory
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/button|@ui/button|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/form/([a-zA-Z-]+)|@ui/form/\1|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/data/([a-zA-Z-]+)|@ui/data/\1|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/([a-zA-Z-]+)|@ui/feedback/\1|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/layout/([a-zA-Z-]+)|@ui/layout/\1|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/([a-zA-Z-]+)|@ui/\1|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/layout/headers/([a-zA-Z-]+)|@shared/components/\1|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/layout/footers/([a-zA-Z-]+)|@shared/components/\1|g'
find src/pages -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/common/WaitlistForm|@shared/components/WaitlistForm|g'

# Fix specific toaster imports
find src/ui/feedback -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i '' -E 's|@components/ui/feedback/toast|@ui/feedback/toast|g'

echo "Feature pages imports fixed!" 