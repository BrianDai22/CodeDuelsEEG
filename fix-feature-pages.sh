#!/bin/bash

echo "Fixing imports in feature pages..."

# Process each feature page file individually
find src/features -type f -name "*.tsx" | while read -r file; do
  echo "Processing $file"
  
  # Update all component imports to their new paths
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
    -e 's|@components/ui/feedback/use-toast|@shared/hooks/ui/use-toast|g' \
    -e 's|@components/ui/layout/tabs|@ui/layout/tabs|g' \
    -e 's|@components/ui/tracked|@ui/tracked|g' \
    -e 's|@components/common/CodeEditor|@shared/components/CodeEditor|g' \
    -e 's|@components/common/ImageEditor|@shared/components/ImageEditor|g' \
    -e 's|@components/common/WaitlistForm|@shared/components/WaitlistForm|g' \
    -e 's|@components/layout/headers/LandingHeader|@shared/components/LandingHeader|g' \
    -e 's|@components/layout/headers/PremiumHeader|@shared/components/PremiumHeader|g' \
    -e 's|@components/layout/headers/UserHeader|@shared/components/UserHeader|g' \
    -e 's|@components/layout/headers/GuestHeader|@shared/components/GuestHeader|g' \
    -e 's|@components/layout/footers/LandingFooter|@shared/components/LandingFooter|g' \
    -e 's|@components/features/premium/PremiumPaymentHistory|@features/premium/components/PremiumPaymentHistory|g' \
    -e 's|@components/features/premium/PremiumRedirect|@features/premium/components/PremiumRedirect|g' \
    -e 's|@components/features/auth/ProtectedRoute|@features/auth/components/ProtectedRoute|g' \
    -e 's|@components/features/admin/AdminSettings|@features/admin/components/AdminSettings|g' \
    -e 's|@contexts/auth/AuthContext|@features/auth/AuthContext|g' \
    -e 's|@contexts/admin/AdminContext|@shared/context/AdminContext|g' \
    "$file"
done

# Process src/pages files as well
find src/pages -type f -name "*.tsx" | while read -r file; do
  echo "Processing $file"
  
  # Update all component imports to their new paths
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
    -e 's|@components/ui/feedback/use-toast|@shared/hooks/ui/use-toast|g' \
    -e 's|@components/ui/layout/tabs|@ui/layout/tabs|g' \
    -e 's|@components/ui/tracked|@ui/tracked|g' \
    -e 's|@components/common/CodeEditor|@shared/components/CodeEditor|g' \
    -e 's|@components/common/ImageEditor|@shared/components/ImageEditor|g' \
    -e 's|@components/common/WaitlistForm|@shared/components/WaitlistForm|g' \
    -e 's|@components/layout/headers/LandingHeader|@shared/components/LandingHeader|g' \
    -e 's|@components/layout/headers/PremiumHeader|@shared/components/PremiumHeader|g' \
    -e 's|@components/layout/headers/UserHeader|@shared/components/UserHeader|g' \
    -e 's|@components/layout/headers/GuestHeader|@shared/components/GuestHeader|g' \
    -e 's|@components/layout/footers/LandingFooter|@shared/components/LandingFooter|g' \
    -e 's|@components/features/premium/PremiumPaymentHistory|@features/premium/components/PremiumPaymentHistory|g' \
    -e 's|@components/features/premium/PremiumRedirect|@features/premium/components/PremiumRedirect|g' \
    -e 's|@components/features/auth/ProtectedRoute|@features/auth/components/ProtectedRoute|g' \
    -e 's|@components/features/admin/AdminSettings|@features/admin/components/AdminSettings|g' \
    -e 's|@contexts/auth/AuthContext|@features/auth/AuthContext|g' \
    -e 's|@contexts/admin/AdminContext|@shared/context/AdminContext|g' \
    "$file"
done

# Fix the toaster.tsx file specifically
if [ -f "src/ui/feedback/toaster.tsx" ]; then
  echo "Fixing toaster.tsx"
  sed -i '' -e 's|@components/ui/feedback/toast|@ui/feedback/toast|g' "src/ui/feedback/toaster.tsx"
fi

echo "All feature page imports fixed!" 