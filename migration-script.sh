#!/bin/bash

# Migration script to update import paths to the new feature-first architecture

echo "Starting migration of import paths..."

# Create temporary directory for file processing
mkdir -p temp

# 1. Update UI component imports
find src/features src/pages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace UI component imports
  sed -i '' \
    -e 's|@components/ui/button|@ui/button|g' \
    -e 's|@components/ui/form/input|@ui/form/input|g' \
    -e 's|@components/ui/form/label|@ui/form/label|g' \
    -e 's|@components/ui/form/checkbox|@ui/form/checkbox|g' \
    -e 's|@components/ui/data/card|@ui/data/card|g' \
    -e 's|@components/ui/data/table|@ui/data/table|g' \
    -e 's|@components/ui/data/avatar|@ui/data/avatar|g' \
    -e 's|@components/ui/data/badge|@ui/data/badge|g' \
    -e 's|@components/ui/data/progress|@ui/data/progress|g' \
    -e 's|@components/ui/feedback/alert|@ui/feedback/alert|g' \
    -e 's|@components/ui/feedback/dialog|@ui/feedback/dialog|g' \
    -e 's|@components/ui/feedback/toast|@ui/feedback/toast|g' \
    -e 's|@components/ui/feedback/use-toast|@ui/feedback/use-toast|g' \
    -e 's|@components/ui/layout/tabs|@ui/layout/tabs|g' \
    -e 's|@components/ui/tracked|@ui/tracked|g' \
    "$file"
done

echo "UI component imports updated"

# 2. Update shared components imports
find src/features src/pages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace shared component imports
  sed -i '' \
    -e 's|@components/common/CodeEditor|@shared/components/CodeEditor|g' \
    -e 's|@components/common/ImageEditor|@shared/components/ImageEditor|g' \
    -e 's|@components/common/WaitlistForm|@shared/components/WaitlistForm|g' \
    -e 's|@components/layout/headers/LandingHeader|@shared/components/LandingHeader|g' \
    -e 's|@components/layout/headers/PremiumHeader|@shared/components/PremiumHeader|g' \
    -e 's|@components/layout/headers/UserHeader|@shared/components/UserHeader|g' \
    -e 's|@components/layout/headers/GuestHeader|@shared/components/GuestHeader|g' \
    -e 's|@components/layout/footers/LandingFooter|@shared/components/LandingFooter|g' \
    "$file"
done

echo "Shared component imports updated"

# 3. Update feature-specific component imports
find src/features src/pages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace feature-specific component imports
  sed -i '' \
    -e 's|@components/features/premium/PremiumPaymentHistory|@features/premium/components/PremiumPaymentHistory|g' \
    -e 's|@components/features/premium/PremiumRedirect|@features/premium/components/PremiumRedirect|g' \
    -e 's|@components/features/auth/ProtectedRoute|@features/auth/components/ProtectedRoute|g' \
    -e 's|@components/features/admin/AdminSettings|@features/admin/components/AdminSettings|g' \
    "$file"
done

echo "Feature component imports updated"

# 4. Update context imports
find src/features src/pages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace context imports
  sed -i '' \
    -e 's|@contexts/auth/AuthContext|@features/auth/AuthContext|g' \
    -e 's|@contexts/admin/AdminContext|@shared/context/AdminContext|g' \
    "$file"
done

echo "Context imports updated"

# 5. Update utility imports
find src/features src/pages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace utility imports
  sed -i '' \
    -e 's|@utils/utils|@shared/lib/utils|g' \
    -e 's|@utils/api|@shared/lib/api|g' \
    -e 's|@utils/analytics|@shared/lib/analytics|g' \
    -e 's|@utils/stripe|@shared/lib/stripe|g' \
    -e 's|@/lib/utils|@shared/lib/utils|g' \
    -e 's|@/lib/api|@shared/lib/api|g' \
    -e 's|@/lib/analytics|@shared/lib/analytics|g' \
    -e 's|@/lib/stripe|@shared/lib/stripe|g' \
    "$file"
done

echo "Utility imports updated"

# 6. Update hook imports
find src/features src/pages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace hook imports
  sed -i '' \
    -e 's|@hooks/ui/use-mobile|@shared/hooks/ui/use-mobile|g' \
    -e 's|@hooks/ui/use-toast|@shared/hooks/ui/use-toast|g' \
    -e 's|@hooks/analytics/useButtonTracking|@shared/hooks/analytics/useButtonTracking|g' \
    -e 's|@hooks/analytics/usePageTracking|@shared/hooks/analytics/usePageTracking|g' \
    -e 's|@/hooks/use-mobile|@shared/hooks/ui/use-mobile|g' \
    -e 's|@/hooks/use-toast|@shared/hooks/ui/use-toast|g' \
    -e 's|@/hooks/useButtonTracking|@shared/hooks/analytics/useButtonTracking|g' \
    -e 's|@/hooks/usePageTracking|@shared/hooks/analytics/usePageTracking|g' \
    "$file"
done

echo "Hook imports updated"

# Also update the imports in the UI components
find src/ui -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace imports in UI components
  sed -i '' \
    -e 's|@components/ui|@ui|g' \
    -e 's|@/components/ui|@ui|g' \
    -e 's|@/lib/utils|@shared/lib/utils|g' \
    -e 's|@/utils/utils|@shared/lib/utils|g' \
    -e 's|@/hooks/use-toast|@shared/hooks/ui/use-toast|g' \
    "$file"
done

echo "UI component internal imports updated"

# Update shared hooks
find src/shared/hooks -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # Replace imports in shared hooks
  sed -i '' \
    -e 's|@/lib/analytics|@shared/lib/analytics|g' \
    -e 's|@utils/analytics|@shared/lib/analytics|g' \
    "$file"
done

echo "Migration complete! Please check the app for any remaining import issues." 