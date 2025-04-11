#!/bin/bash

# Fix imports in feature components
echo "Fixing imports in feature components..."

# Pattern replacements to fix various imports
find src/features -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # UI components
  sed -i '' \
    -e 's|@components/ui/button|@ui/button|g' \
    -e 's|@components/ui/form/input|@ui/form/input|g' \
    -e 's|@components/ui/form/label|@ui/form/label|g' \
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
    "$file"

  # Shared components
  sed -i '' \
    -e 's|@components/common/CodeEditor|@shared/components/CodeEditor|g' \
    -e 's|@components/common/ImageEditor|@shared/components/ImageEditor|g' \
    -e 's|@components/layout/headers/LandingHeader|@shared/components/LandingHeader|g' \
    -e 's|@components/layout/headers/PremiumHeader|@shared/components/PremiumHeader|g' \
    -e 's|@components/layout/headers/UserHeader|@shared/components/UserHeader|g' \
    -e 's|@components/layout/headers/GuestHeader|@shared/components/GuestHeader|g' \
    -e 's|@components/layout/footers/LandingFooter|@shared/components/LandingFooter|g' \
    "$file"
  
  # Feature components
  sed -i '' \
    -e 's|@components/features/premium/PremiumPaymentHistory|@features/premium/components/PremiumPaymentHistory|g' \
    -e 's|@components/features/premium/PremiumRedirect|@features/premium/components/PremiumRedirect|g' \
    "$file"
done

# Same for root pages
find src/pages -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  # UI components
  sed -i '' \
    -e 's|@components/ui/button|@ui/button|g' \
    -e 's|@components/ui/form/input|@ui/form/input|g' \
    -e 's|@components/ui/form/label|@ui/form/label|g' \
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
    "$file"

  # Shared components
  sed -i '' \
    -e 's|@components/common/WaitlistForm|@shared/components/WaitlistForm|g' \
    -e 's|@components/layout/headers/LandingHeader|@shared/components/LandingHeader|g' \
    "$file"
done

# Fix specific files that might be causing issues
# IndexWithTracking.tsx
cat > src/pages/IndexWithTracking.tsx << 'EOL'
import React from 'react';
import { useAuth } from '@features/auth/AuthContext';
import { usePageTracking } from '@shared/hooks/analytics/usePageTracking';
import Index from './Index';
import WaitlistForm from '@shared/components/WaitlistForm';

const IndexWithTracking = () => {
  const { isAuthenticated } = useAuth();
  usePageTracking();
  
  return <Index />;
};

export default IndexWithTracking;
EOL

echo "Fixed feature component imports!" 