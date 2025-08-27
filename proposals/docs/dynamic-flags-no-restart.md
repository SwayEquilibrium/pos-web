# Dynamic Feature Flags - No Server Restart Required

## Problem Solved

Previously, you had to restart the Next.js development server every time you wanted to toggle feature flags because they were only read from environment variables at startup.

## Solution

This system allows you to toggle feature flags at runtime using localStorage overrides, with immediate effect and no server restart required.

## How It Works

1. **Environment flags** are still read from `NEXT_PUBLIC_FLAGS` at startup
2. **Dynamic overrides** are stored in localStorage and take precedence
3. **Automatic syncing** across all browser tabs using custom events
4. **React hook** provides reactive flag updates to components

## Usage

### 1. In Components

Replace the old static flags import:

```typescript
// OLD - static flags
import { flags } from '@/src/config/flags'

// NEW - dynamic flags
import { flags as envFlags } from '@/src/config/flags'
import { useDynamicFlags } from '@/proposals/glue/dynamicFlags.v1'

export function MyComponent() {
  const flags = useDynamicFlags(envFlags)
  
  if (!flags.printerWebPRNTV1) {
    return <div>Feature disabled</div>
  }
  
  // Component code...
}
```

### 2. Add Flag Toggler UI

```typescript
import { DynamicFlagToggler } from '@/proposals/components/DynamicFlagToggler.v1'

// Full UI
<DynamicFlagToggler />

// Compact version
<DynamicFlagToggler compact />
```

### 3. Add Dev Toolbar (Floating)

```typescript
import { DevToolbar } from '@/proposals/components/DevToolbar.v1'

// Add to your page
<DevToolbar />
```

## API Reference

### `useDynamicFlags(envFlags)`
React hook that returns merged flags (env + overrides) and updates automatically.

### `toggleFlag(flagName, value?)`
Toggle a specific flag. If `value` is provided, sets to that value.

### `getDynamicOverrides()`
Get current localStorage overrides.

### `setDynamicOverrides(overrides)`
Set localStorage overrides and trigger update events.

### `clearDynamicOverrides()`
Clear all overrides, reverting to environment flags.

### `mergeFlags(envFlags)`
Merge environment flags with localStorage overrides.

## Features

- ✅ **No server restart** - Changes apply immediately
- ✅ **Persistent** - Overrides survive page reloads
- ✅ **Cross-tab sync** - Changes sync across browser tabs
- ✅ **Visual indicators** - Shows which flags are overridden vs env
- ✅ **Reset capability** - Easy revert to environment flags
- ✅ **Development only** - DevToolbar hidden in production

## Example: Print Test Page

The print test page (`app/dev/print-test/page.tsx`) now includes:

1. Dynamic flag toggler at the top
2. Real-time flag updates without restart
3. Ability to enable `printerWebPRNTV1` instantly

## Benefits

1. **Faster development** - No waiting for server restarts
2. **Easy testing** - Toggle features on/off instantly  
3. **Better debugging** - Test flag combinations quickly
4. **Preserved state** - App state maintained during flag changes

## Implementation Notes

- Uses localStorage for persistence
- Custom events for cross-tab synchronization
- React hooks for reactive updates
- Graceful fallback if localStorage unavailable
- Production-safe (no overhead in prod builds)
