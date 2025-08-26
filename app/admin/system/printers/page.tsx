'use client'

import { flags } from '@/src/config/flags'
import PrinterSettings from '@/proposals/components/PrinterSettings.v1'

// Mock data - replace with actual data from your system
const mockRooms = [
  { id: 'dining-room', name: 'Dining Room' },
  { id: 'kitchen', name: 'Kitchen' },
  { id: 'bar', name: 'Bar Area' },
  { id: 'patio', name: 'Patio' }
]

const mockCategories = [
  { id: 'appetizers', name: 'Appetizers' },
  { id: 'main-courses', name: 'Main Courses' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'beverages', name: 'Beverages' }
]

const mockProductTypes = [
  { id: 'food', name: 'Food' },
  { id: 'drinks', name: 'Drinks' },
  { id: 'alcohol', name: 'Alcohol' }
]

export default function SystemPrintersPage() {
  // Show feature-flagged printer settings or placeholder
  if (flags.printerWebPRNTV1) {
    return (
      <div className="p-6">
        <PrinterSettings
          rooms={mockRooms}
          categories={mockCategories}
          productTypes={mockProductTypes}
        />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">🖨️ Printer Settings</h1>
        <p className="text-muted-foreground mb-4">
          Advanced printer configuration is available with the WebPRNT feature.
        </p>
        <div className="bg-muted p-4 rounded-lg text-sm max-w-md mx-auto">
          <p className="font-medium mb-2">To enable printer settings:</p>
          <ol className="list-decimal list-inside space-y-1 text-left">
            <li>Add <code>printerWebPRNTV1</code> to your <code>NEXT_PUBLIC_FLAGS</code></li>
            <li>Set up your Star WebPRNT printer</li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
