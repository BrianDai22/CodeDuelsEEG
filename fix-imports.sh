#!/bin/bash

# Fix imports in UI components

echo "Fixing imports in UI components..."

# Update imports in UI components that reference themselves or other components
find src/ui -type f -name "*.tsx" -o -name "*.ts" | while read file; do
  sed -i '' -e 's|@components/ui/|@ui/|g' "$file"
  sed -i '' -e 's|@/components/ui/|@ui/|g' "$file"
  sed -i '' -e 's|@/lib/utils|@shared/lib/utils|g' "$file"
  sed -i '' -e 's|../button|@ui/button|g' "$file"
  sed -i '' -e 's|./button|@ui/button|g' "$file"
  sed -i '' -e 's|../toggle|@ui/toggle|g' "$file"
  sed -i '' -e 's|./toggle|@ui/toggle|g' "$file"
done

echo "UI component imports fixed!"

# Ensure button.tsx has correct imports
cat > src/ui/button.tsx << 'EOL'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@shared/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
EOL

# Create a clean version of UI components index
cat > src/ui/index.ts << 'EOL'
// UI Components Exports

// Base Components
export * from './button';
export * from './toggle';
export * from './toggle-group';
export * from './calendar';

// Form Components
export * from './form/input';
export * from './form/textarea';
export * from './form/checkbox';
export * from './form/label';
export * from './form/radio-group';
export * from './form/select';
export * from './form/slider';
export * from './form/switch';
export * from './form/form';
export * from './form/input-otp';

// Layout Components
export * from './layout/tabs';
export * from './layout/accordion';
export * from './layout/separator';
export * from './layout/aspect-ratio';
export * from './layout/collapsible';
export * from './layout/sheet';
export * from './layout/scroll-area';

// Data Display Components
export * from './data/table';
export * from './data/card';
export * from './data/avatar';
export * from './data/badge';
export * from './data/progress';
export * from './data/carousel';

// Feedback Components
export * from './feedback/alert';
export * from './feedback/dialog';
export * from './feedback/toast';
export * from './feedback/tooltip';
export * from './feedback/dropdown-menu';
export * from './feedback/skeleton';
export * from './feedback/toaster';
export * from './feedback/sonner';
EOL

echo "Fixed UI component files!"

# Fix shared components
cat > src/shared/components/AnalyticsProvider.tsx << 'EOL'
import React, { ReactNode, useEffect } from 'react';
import { usePageTracking } from '@shared/hooks/analytics/usePageTracking';
import { initializeAnalytics } from '@shared/lib/analytics';

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  // Initialize Amplitude
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // Initialize page tracking
  usePageTracking();

  return <>{children}</>;
};
EOL

echo "All imports fixed!" 