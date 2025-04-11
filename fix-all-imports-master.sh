#!/bin/bash

echo "Starting comprehensive import path fix across src/..."

# Define the target directory
TARGET_DIR="src"

# Find all relevant files
FILES=$(find "$TARGET_DIR" -type f \( -name "*.ts" -o -name "*.tsx" \))

# Check if any files were found
if [ -z "$FILES" ]; then
  echo "No .ts or .tsx files found in $TARGET_DIR"
  exit 1
fi

# Process each file
echo "$FILES" | while read -r file; do
  echo "Processing: $file"
  sed -i '' \
    -e 's|@components/ui/button|@ui/button|g' \
    -e 's|@components/ui/form/input|@ui/form/input|g' \
    -e 's|@components/ui/form/label|@ui/form/label|g' \
    -e 's|@components/ui/form/checkbox|@ui/form/checkbox|g' \
    -e 's|@components/ui/form/slider|@ui/form/slider|g' \
    -e 's|@components/ui/form/switch|@ui/form/switch|g' \
    -e 's|@components/ui/form/radio-group|@ui/form/radio-group|g' \
    -e 's|@components/ui/form/select|@ui/form/select|g' \
    -e 's|@components/ui/form/textarea|@ui/form/textarea|g' \
    -e 's|@components/ui/form/form|@ui/form/form|g' \
    -e 's|@components/ui/data/card|@ui/data/card|g' \
    -e 's|@components/ui/data/table|@ui/data/table|g' \
    -e 's|@components/ui/data/avatar|@ui/data/avatar|g' \
    -e 's|@components/ui/data/badge|@ui/data/badge|g' \
    -e 's|@components/ui/data/progress|@ui/data/progress|g' \
    -e 's|@components/ui/data/pagination|@ui/data/pagination|g' \
    -e 's|@components/ui/data/chart|@ui/data/chart|g' \
    -e 's|@components/ui/data/carousel|@ui/data/carousel|g' \
    -e 's|@components/ui/feedback/alert|@ui/feedback/alert|g' \
    -e 's|@components/ui/feedback/dialog|@ui/feedback/dialog|g' \
    -e 's|@components/ui/feedback/toast|@ui/feedback/toast|g' \
    -e 's|@components/ui/feedback/use-toast|@shared/hooks/ui/use-toast|g' \
    -e 's|@ui/feedback/use-toast|@shared/hooks/ui/use-toast|g' \
    -e 's|@components/ui/feedback/alert-dialog|@ui/feedback/alert-dialog|g' \
    -e 's|@components/ui/feedback/popover|@ui/feedback/popover|g' \
    -e 's|@components/ui/feedback/sonner|@ui/feedback/sonner|g' \
    -e 's|@components/ui/feedback/drawer|@ui/feedback/drawer|g' \
    -e 's|@components/ui/feedback/tooltip|@ui/feedback/tooltip|g' \
    -e 's|@components/ui/feedback/command|@ui/feedback/command|g' \
    -e 's|@components/ui/feedback/dropdown-menu|@ui/feedback/dropdown-menu|g' \
    -e 's|@components/ui/feedback/skeleton|@ui/feedback/skeleton|g' \
    -e 's|@components/ui/feedback/context-menu|@ui/feedback/context-menu|g' \
    -e 's|@components/ui/layout/tabs|@ui/layout/tabs|g' \
    -e 's|@components/ui/layout/aspect-ratio|@ui/layout/aspect-ratio|g' \
    -e 's|@components/ui/layout/hover-card|@ui/layout/hover-card|g' \
    -e 's|@components/ui/layout/sheet|@ui/layout/sheet|g' \
    -e 's|@components/ui/layout/scroll-area|@ui/layout/scroll-area|g' \
    -e 's|@components/ui/layout/resizable|@ui/layout/resizable|g' \
    -e 's|@components/ui/layout/navigation-menu|@ui/layout/navigation-menu|g' \
    -e 's|@components/ui/layout/accordion|@ui/layout/accordion|g' \
    -e 's|@components/ui/layout/breadcrumb|@ui/layout/breadcrumb|g' \
    -e 's|@components/ui/layout/menubar|@ui/layout/menubar|g' \
    -e 's|@components/ui/layout/separator|@ui/layout/separator|g' \
    -e 's|@components/ui/layout/collapsible|@ui/layout/collapsible|g' \
    -e 's|@components/ui/calendar|@ui/calendar|g' \
    -e 's|@components/ui/toggle-group|@ui/toggle-group|g' \
    -e 's|@components/ui/toggle|@ui/toggle|g' \
    -e 's|@components/ui/tracked/TrackedButton|@ui/tracked/TrackedButton|g' \
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
    -e 's|@components/features/analytics/AnalyticsProvider|@shared/components/AnalyticsProvider|g' \
    -e 's|@contexts/auth/AuthContext|@features/auth/AuthContext|g' \
    -e 's|@contexts/admin/AdminContext|@shared/context/AdminContext|g' \
    -e 's|@hooks/ui/use-mobile|@shared/hooks/ui/use-mobile|g' \
    -e 's|@hooks/ui/use-toast|@shared/hooks/ui/use-toast|g' \
    -e 's|@hooks/analytics/useButtonTracking|@shared/hooks/analytics/useButtonTracking|g' \
    -e 's|@hooks/analytics/usePageTracking|@shared/hooks/analytics/usePageTracking|g' \
    -e 's|@utils/analytics|@shared/lib/analytics|g' \
    -e 's|@utils/api|@shared/lib/api|g' \
    -e 's|@utils/stripe|@shared/lib/stripe|g' \
    -e 's|@utils/utils|@shared/lib/utils|g' \
    -e 's|@/lib/utils|@shared/lib/utils|g' \
    -e 's|@/lib/analytics|@shared/lib/analytics|g' \
    -e 's|from "react-hot-toast"|from "sonner"|g' \
    "$file"
done

echo "Comprehensive import fix complete." 