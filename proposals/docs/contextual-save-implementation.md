# Contextual Save Button Implementation

## Overview
This feature addresses the issue where save buttons in settings pages are greyed out and provides a better UX with contextual save buttons that appear only when changes are made.

## Problem Solved
- **Save button greyed out**: Fixed by improving form state management and change detection
- **Poor UX**: Added floating contextual save button in bottom-right corner
- **No change indication**: Added visual feedback for pending changes and successful saves

## Implementation Details

### New Components

#### `ContextualSaveButton.v1.tsx`
- Floating save button that appears when changes are detected
- Positioned in bottom-right corner by default
- Shows success state after saving
- Includes cancel functionality to reset changes
- Fully customizable positioning and styling

#### `useFormChanges` Hook
- Tracks changes between original and current form data
- Returns list of changed fields
- Provides reset functionality
- Handles deep comparison of form state

#### `BusinessSettingsForm.v1.tsx`
- Complete rewrite of business settings form
- Integrates contextual save functionality
- Better error handling and loading states
- Improved logo upload handling
- Visual change indicators

### Integration Strategy
Following the established pattern [[memory:7281328]]:
- ✅ New code in `/proposals/` directory
- ✅ Feature flag gated (`contextualSaveV1`)
- ✅ Minimal diffs to existing files (only imports and conditional rendering)
- ✅ No file renames or deletions
- ✅ Backward compatibility maintained

### Feature Flag
**Environment Variable**: `NEXT_PUBLIC_CONTEXTUAL_SAVE_V1=true`
**Default**: `false` (auto-enabled in development)

### Affected Files
- `app/admin/business/settings/page.tsx` - Minimal integration patch
- `app/modules/business/settings/page.tsx` - Minimal integration patch
- `proposals/docs/flags.md` - Updated with new flag documentation

## Usage Instructions

### Enable Feature
Add to `.env.local`:
```env
NEXT_PUBLIC_CONTEXTUAL_SAVE_V1=true
```

### Testing
1. Navigate to `/admin/business/settings` or `/modules/business/settings`
2. Make changes to any form field
3. Observe contextual save button appears in bottom-right corner
4. Test save functionality
5. Test cancel/reset functionality
6. Test logo upload changes

## Benefits
1. **Better UX**: Save button only appears when needed
2. **Visual Feedback**: Clear indication of pending changes
3. **Smart Detection**: Tracks all form changes including logo uploads
4. **Error Handling**: Improved error states and loading feedback
5. **Accessibility**: Better form validation and user guidance

## Future Enhancements
- Extend to other settings pages
- Add keyboard shortcuts (Ctrl+S)
- Add auto-save functionality
- Add change confirmation dialogs for navigation
- Extend to other form-heavy pages in the system

## Technical Notes
- Uses React Query for data fetching and caching
- Implements proper TypeScript typing throughout
- Follows existing component patterns and styling
- Maintains translation support
- Handles edge cases (missing company data, upload errors, etc.)
