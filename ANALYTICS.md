# Button Tracking Analytics

This document explains how to set up and use the button tracking analytics system in the Code Duels application.

## Overview

The button tracking system allows you to track user interactions with buttons across your application. It supports multiple analytics services and stores events both in the browser's console (for development) and in localStorage (for persistence).

## Supported Analytics Services

The system supports the following analytics services:

1. **Google Analytics** - For general web analytics
2. **Mixpanel** - For user behavior analytics
3. **Amplitude** - For product analytics
4. **Custom Endpoint** - For sending data to your own analytics service

## Setup

### 1. Install Required Packages

```bash
bun add analytics @amplitude/analytics-browser mixpanel-browser
```

### 2. Configure Analytics

Edit the `src/lib/analytics.ts` file to configure your analytics service:

```typescript
export const analyticsConfig: AnalyticsConfig = {
  service: 'google', // 'google', 'mixpanel', 'amplitude', or 'custom'
  apiKey: 'YOUR_API_KEY', // Your API key for the selected service
  customEndpoint: 'https://your-analytics-endpoint.com/track', // Your custom endpoint
  enabled: true, // Set to false to disable analytics
};
```

### 3. Using TrackedButton Component

Replace the standard `Button` component with the `TrackedButton` component:

```tsx
import { TrackedButton } from '@/components/ui/tracked';

// Basic usage
<TrackedButton trackingId="start-game">
  Start Game
</TrackedButton>

// With additional tracking data
<TrackedButton 
  trackingId="difficulty-select"
  trackingData={{ 
    difficulty: 'easy',
    timestamp: Date.now()
  }}
>
  Easy
</TrackedButton>
```

## Viewing Analytics Data

### Development Mode

In development mode, button click events are logged to the browser console. Open your browser's developer tools (F12) and check the console to see events in real-time.

### Stored Events

All button click events are stored in localStorage. You can view them in your browser's developer tools:

1. Open Developer Tools (F12)
2. Go to the Application tab
3. Select Local Storage on the left
4. Look for the `buttonClickEvents` key

### Analytics Services

If you've configured an analytics service, events will be sent to that service according to its specific format and requirements.

## Customizing Analytics

### Adding New Analytics Services

To add a new analytics service:

1. Update the `AnalyticsService` type in `src/hooks/useButtonTracking.ts`
2. Add initialization code in the `useEffect` hook
3. Add tracking code in the `trackButtonClick` function

### Modifying Event Data

You can modify the event data structure by updating the `ButtonClickEvent` interface in `src/hooks/useButtonTracking.ts`.

## Troubleshooting

- **Events not being tracked**: Check that analytics is enabled in the configuration
- **Analytics service not receiving data**: Verify your API key and check for network errors
- **Too many events**: Consider implementing throttling or batching for high-traffic applications 