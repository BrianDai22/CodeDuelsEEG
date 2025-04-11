import * as React from 'react';
import { Button, ButtonProps } from '@@u@@u@ui/button';
import { useButtonTracking } from '@shared/hooks/analytics/useButtonTracking';

export interface TrackedButtonProps extends ButtonProps {
  trackingId: string;
  trackingData?: Record<string, any>;
}

export const TrackedButton = React.forwardRef<HTMLButtonElement, TrackedButtonProps>(
  ({ onClick, trackingId, trackingData, children, ...props }, ref) => {
    const { trackButtonClick } = useButtonTracking();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Track the button click
      trackButtonClick(
        trackingId,
        typeof children === 'string' ? children : 'Button',
        trackingData
      );

      // Call the original onClick handler if it exists
      onClick?.(event);
    };

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

TrackedButton.displayName = 'TrackedButton'; 