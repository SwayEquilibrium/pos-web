// Compact translation system for Danish/English
export type Language = 'da' | 'en'

// Translation keys mapped to both languages
export const translations = {
  // Common UI elements
  save: { da: 'Gem', en: 'Save' },
  cancel: { da: 'Annuller', en: 'Cancel' },
  delete: { da: 'Slet', en: 'Delete' },
  edit: { da: 'Rediger', en: 'Edit' },
  create: { da: 'Opret', en: 'Create' },
  update: { da: 'Opdater', en: 'Update' },
  close: { da: 'Luk', en: 'Close' },
  back: { da: 'Tilbage', en: 'Back' },
  next: { da: 'Næste', en: 'Next' },
  previous: { da: 'Forrige', en: 'Previous' },
  loading: { da: 'Indlæser...', en: 'Loading...' },
  search: { da: 'Søg', en: 'Search' },
  filter: { da: 'Filter', en: 'Filter' },
  clear: { da: 'Ryd', en: 'Clear' },
  yes: { da: 'Ja', en: 'Yes' },
  no: { da: 'Nej', en: 'No' },
  
  // Navigation & Layout
  dashboard: { da: 'Dashboard', en: 'Dashboard' },
  settings: { da: 'Indstillinger', en: 'Settings' },
  backToOverview: { da: 'Tilbage til Oversigt', en: 'Back to Overview' },
  takeaway: { da: 'Takeaway', en: 'Takeaway' },
  modules: { da: 'Moduler', en: 'Modules' },
  tables: { da: 'Borde', en: 'Tables' },
  
  // Admin Navigation
  business: { da: 'Virksomhed', en: 'Business' },
  economy: { da: 'Økonomi', en: 'Economy' },
  sales: { da: 'Salg', en: 'Sales' },
  giftCards: { da: 'Gavekort', en: 'Gift Cards' },
  menuManagement: { da: 'Menukort', en: 'Menu' },
  operations: { da: 'Drift', en: 'Operations' },
  system: { da: 'System', en: 'System' },
  shifts: { da: 'Vagter', en: 'Shifts' },
  booking: { da: 'Booking', en: 'Booking' },
  companySettings: { da: 'Virksomhedsindstillinger', en: 'Company Settings' },
  reports: { da: 'Rapport', en: 'Reports' },
  accounting: { da: 'Kasseopstelling', en: 'Cash Register' },
  smartCategories: { da: 'Smart Kategorier', en: 'Smart Categories' },
  categoriesProducts: { da: 'Kategorier & Produkter', en: 'Categories & Products' },
  modifiers: { da: 'Tilvalg & Varianter', en: 'Options & Variants' },
  productModifiers: { da: 'Produkt Tilvalg', en: 'Product Options' },
  tablesRooms: { da: 'Borde & Lokaler', en: 'Tables & Rooms' },
  printers: { da: 'Printere', en: 'Printers' },
  paymentMethods: { da: 'Betalingsmetoder', en: 'Payment Methods' },
  screenLayout: { da: 'Skærm Layout', en: 'Screen Layout' },
  users: { da: 'Brugere', en: 'Users' },
  customerGroups: { da: 'Kundegrupper', en: 'Customer Groups' },
  company: { da: 'Virksomhed', en: 'Company' },
  activityLog: { da: 'Aktivitetslog', en: 'Activity Log' },
  testPayments: { da: 'Test Betalinger', en: 'Test Payments' },
  vatAccounting: { da: 'Moms & Regnskab', en: 'VAT & Accounting' },
  
  // Settings sections
  myProfile: { da: 'Min Profil', en: 'My Profile' },
  companyInfo: { da: 'Virksomhedsoplysninger', en: 'Company Information' },
  saftReport: { da: 'SAF-T Rapport', en: 'SAF-T Report' },
  logActivity: { da: 'Log Aktivitet', en: 'Log Activity' },
  systemSettings: { da: 'Systemindstillinger', en: 'System Settings' },
  language: { da: 'Sprog', en: 'Language' },
  languageSettings: { da: 'Sprogindstillinger', en: 'Language Settings' },
  selectLanguage: { da: 'Vælg sprog', en: 'Select language' },
  danish: { da: 'Dansk', en: 'Danish' },
  english: { da: 'Engelsk', en: 'English' },
  
  // Form fields
  firstName: { da: 'Fornavn', en: 'First Name' },
  lastName: { da: 'Efternavn', en: 'Last Name' },
  email: { da: 'Email', en: 'Email' },
  phone: { da: 'Telefon', en: 'Phone' },
  address: { da: 'Adresse', en: 'Address' },
  city: { da: 'By', en: 'City' },
  postalCode: { da: 'Postnummer', en: 'Postal Code' },
  country: { da: 'Land', en: 'Country' },
  name: { da: 'Navn', en: 'Name' },
  description: { da: 'Beskrivelse', en: 'Description' },
  price: { da: 'Pris', en: 'Price' },
  
  // Company settings
  companyLogo: { da: 'Virksomhedslogo', en: 'Company Logo' },
  uploadLogo: { da: 'Upload Logo', en: 'Upload Logo' },
  removeLogo: { da: 'Fjern Logo', en: 'Remove Logo' },
  logoUploadHint: { da: 'Anbefalet størrelse: 200x200px, maksimalt 2MB', en: 'Recommended size: 200x200px, max 2MB' },
  businessInformation: { da: 'Virksomhedsoplysninger', en: 'Business Information' },
  businessSettings: { da: 'Virksomhedsindstillinger', en: 'Business Settings' },
  
  // Smart Category Hierarchy
  masterCategories: { da: 'Masterkategorier', en: 'Master Categories' },
  level: { da: 'Niveau', en: 'Level' },
  subcategories: { da: 'underkategorier', en: 'subcategories' },
  createCategory: { da: 'Opret Kategori', en: 'Create Category' },
  createNewCategory: { da: 'Opret Ny Kategori', en: 'Create New Category' },
  editCategory: { da: 'Rediger Kategori', en: 'Edit Category' },
  categoryNamePlaceholder: { da: 'Indtast kategorinavn', en: 'Enter category name' },
  emoji: { da: 'Emoji', en: 'Emoji' },
  color: { da: 'Farve', en: 'Color' },
  sortOrder: { da: 'Sorteringsrækkefølge', en: 'Sort Order' },
  creating: { da: 'Opretter...', en: 'Creating...' },
  noCategoriesFound: { da: 'Ingen kategorier fundet', en: 'No categories found' },
  createFirstCategory: { da: 'Opret din første kategori for at komme i gang', en: 'Create your first category to get started' },
  createSubcategory: { da: 'Opret en underkategori under {{parent}}', en: 'Create a subcategory under {{parent}}' },
  confirmDeleteCategory: { da: 'Er du sikker på, at du vil slette "{{name}}"?', en: 'Are you sure you want to delete "{{name}}"?' },
  
  // Smart Categories Page
  smartCategoryManagement: { da: 'Smart Kategori Styring', en: 'Smart Category Management' },
  manageCategoriesDescription: { da: 'Organiser dine kategorier i lag som Wine Card → Rødvine → Flasker', en: 'Organize your categories in layers like Wine Card → Red Wines → Bottles' },
  manageProductsDescription: { da: 'Administrer produkter i {{category}}', en: 'Manage products in {{category}}' },
  noProductsFound: { da: 'Ingen produkter fundet', en: 'No products found' },
  noProductsInCategory: { da: 'Ingen produkter i {{category}}', en: 'No products in {{category}}' },
  noProductsMessage: { da: 'Der er ingen produkter at vise', en: 'There are no products to display' },
  createFirstProduct: { da: 'Opret første produkt', en: 'Create first product' },
  totalProducts: { da: 'Produkter i alt', en: 'Total Products' },
  activeProducts: { da: 'Aktive produkter', en: 'Active Products' },
  inactiveProducts: { da: 'Inaktive produkter', en: 'Inactive Products' },
  averagePrice: { da: 'Gennemsnitspris', en: 'Average Price' },
  openPrice: { da: 'Åben pris', en: 'Open Price' },
  active: { da: 'Aktiv', en: 'Active' },
  inactive: { da: 'Inaktiv', en: 'Inactive' },
  copy: { da: 'Kopier', en: 'Copy' },
  
  // Messages
  saveSuccess: { da: 'Gemt succesfuldt!', en: 'Saved successfully!' },
  saveError: { da: 'Fejl ved gemning', en: 'Error saving' },
  deleteConfirm: { da: 'Er du sikker på, at du vil slette?', en: 'Are you sure you want to delete?' },
  requiredField: { da: 'Dette felt er påkrævet', en: 'This field is required' },
  
  // Status messages
  updating: { da: 'Opdaterer...', en: 'Updating...' },
  saving: { da: 'Gemmer...', en: 'Saving...' },
  deleting: { da: 'Sletter...', en: 'Deleting...' },

  // Display settings
  displaySettings: { da: 'Skærm Indstillinger', en: 'Display Settings' },
  screenPresets: { da: 'Skærm Presets', en: 'Screen Presets' },
  manualConfiguration: { da: 'Manuel Konfiguration', en: 'Manual Configuration' },
  gridSize: { da: 'Grid Størrelse', en: 'Grid Size' },
  columns: { da: 'Kolonner', en: 'Columns' },
  rows: { da: 'Rækker', en: 'Rows' },
  buttonSize: { da: 'Knap Størrelse', en: 'Button Size' },
  displayOptions: { da: 'Visnings Indstillinger', en: 'Display Options' },
  showImages: { da: 'Vis produkt billeder', en: 'Show product images' },
  showPrices: { da: 'Vis priser på knapper', en: 'Show prices on buttons' },
  compactMode: { da: 'Kompakt mode (mindre mellemrum)', en: 'Compact mode (less spacing)' },
  preview: { da: 'Forhåndsvisning', en: 'Preview' },
  applyPreset: { da: 'Anvend Preset', en: 'Apply Preset' },
  
  // Size options
  small: { da: 'Lille', en: 'Small' },
  medium: { da: 'Mellem', en: 'Medium' },
  large: { da: 'Stor', en: 'Large' },
  
  // Common phrases
  optional: { da: '(valgfri)', en: '(optional)' },
  required: { da: '(påkrævet)', en: '(required)' },
  recommended: { da: 'Anbefalet', en: 'Recommended' },
  
  // Error messages
  unknownError: { da: 'Ukendt fejl', en: 'Unknown error' },
  networkError: { da: 'Netværksfejl', en: 'Network error' },
  permissionDenied: { da: 'Adgang nægtet', en: 'Permission denied' },
} as const

export type TranslationKey = keyof typeof translations

// Helper function to get translated text
export function t(key: TranslationKey, language: Language): string {
  return translations[key][language] || translations[key]['da'] // fallback to Danish
}

// Helper function to get all translations for a specific language
export function getTranslations(language: Language) {
  const result: Record<string, string> = {}
  Object.entries(translations).forEach(([key, value]) => {
    result[key] = value[language] || value['da']
  })
  return result
}
