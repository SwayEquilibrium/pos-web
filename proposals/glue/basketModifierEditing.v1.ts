// Feature flag for enhanced basket modifier editing
export const basketModifierEditingV1 = process.env.NEXT_PUBLIC_BASKET_MODIFIER_EDITING_V1 === 'true' || false

// Default to enabled in development
export const enableBasketModifierEditing = basketModifierEditingV1 || process.env.NODE_ENV === 'development'

export { default as BasketItemModifierEditor } from '../components/BasketItemModifierEditor.v1'
