// Feature flag for contextual save functionality
export const contextualSaveV1 = process.env.NEXT_PUBLIC_CONTEXTUAL_SAVE_V1 === 'true' || false

// Default to enabled in development
export const enableContextualSave = contextualSaveV1 || process.env.NODE_ENV === 'development'

export { ContextualSaveButton, useFormChanges } from '@/components/ContextualSaveButton'
export { default as BusinessSettingsFormV1 } from '@/components/BusinessSettingsForm'
