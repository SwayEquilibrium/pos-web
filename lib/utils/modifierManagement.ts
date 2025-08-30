/**
 * Feature flag and integration for enhanced modifier management
 * with contextual save functionality and real database operations
 */

// Feature flag
export const enableModifierManagementV1 = 
  process.env.NEXT_PUBLIC_MODIFIER_MANAGEMENT_V1 === 'true' || 
  process.env.NODE_ENV === 'development'

// Export the enhanced component
export { default as ModifierManagementV1 } from '@/components/ModifierManagementV1'
