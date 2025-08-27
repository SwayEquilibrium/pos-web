// Feature flag for enhanced menu data synchronization
export const menuDataSyncV1 = process.env.NEXT_PUBLIC_MENU_DATA_SYNC_V1 === 'true' || false

// Default to enabled in development
export const enableMenuDataSync = menuDataSyncV1 || process.env.NODE_ENV === 'development'

export { 
  useCategoriesEnhanced, 
  useProductsByCategoryEnhanced, 
  useAllProductsDebug,
  useDatabaseVerification,
  useRefreshCatalogData
} from '../hooks/useCatalogEnhanced.v1'

export { default as MenuDataDebugger } from '../components/MenuDataDebugger.v1'
