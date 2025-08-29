/**
 * Simple toggle component for printer receipt configuration
 * Can be integrated into existing printer settings
 */

'use client'

import { useState } from 'react'
import { usePrinters, useUpdatePrinter } from '@/hooks/usePrinters'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PrinterReceiptToggle() {
  const { data: printers, isLoading } = usePrinters()
  const updatePrinter = useUpdatePrinter()
  const [updating, setUpdating] = useState<string | null>(null)

  const toggleCustomerReceipts = async (printer: any) => {
    setUpdating(printer.id)
    try {
      await updatePrinter.mutateAsync({
        id: printer.id,
        updates: {
          print_customer_receipts: !printer.print_customer_receipts
        }
      })
    } catch (error) {
      alert(`Failed to update printer: ${error}`)
    } finally {
      setUpdating(null)
    }
  }

  const toggleKitchenReceipts = async (printer: any) => {
    setUpdating(printer.id)
    try {
      await updatePrinter.mutateAsync({
        id: printer.id,
        updates: {
          print_kitchen_receipts: !printer.print_kitchen_receipts
        }
      })
    } catch (error) {
      alert(`Failed to update printer: ${error}`)
    } finally {
      setUpdating(null)
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading printers...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>🖨️ Quick Receipt Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {printers?.map((printer) => (
            <div key={printer.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium">{printer.display_name}</h4>
                <p className="text-sm text-muted-foreground">{printer.connection_string}</p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={printer.print_kitchen_receipts ? "default" : "outline"}
                  onClick={() => toggleKitchenReceipts(printer)}
                  disabled={updating === printer.id}
                  className="text-xs"
                >
                  {printer.print_kitchen_receipts ? '✅' : '❌'} Kitchen
                </Button>
                
                <Button
                  size="sm"
                  variant={printer.print_customer_receipts ? "default" : "outline"}
                  onClick={() => toggleCustomerReceipts(printer)}
                  disabled={updating === printer.id}
                  className="text-xs"
                >
                  {printer.print_customer_receipts ? '✅' : '❌'} Customer
                </Button>
              </div>
            </div>
          ))}
          
          {(!printers || printers.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No printers configured yet.</p>
              <p className="text-sm">Go to Settings → Printers to add printers.</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm">
          <p className="font-medium text-blue-800">💡 Quick Setup:</p>
          <ul className="text-blue-700 mt-1 space-y-1">
            <li>• <strong>Kitchen:</strong> Prints when orders are placed (for cooking)</li>
            <li>• <strong>Customer:</strong> Prints when payments are completed (for customers)</li>
            <li>• You can enable both on the same printer for dual printing</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
