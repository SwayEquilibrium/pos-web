import { supabase } from '@/lib/supabaseClient'

// ================================================
// ULTRA SIMPLE ETHERNET PRINTER REPOSITORY
// ================================================

export interface Printer {
  id: string
  name: string
  display_name: string
  brand: 'Star' | 'Epson' | 'Other'
  ip_address: string
  port: number
  paper_width: 48 | 58 | 80
  print_kitchen_receipts: boolean
  print_customer_receipts: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}

// Get all printers
export async function getPrinters(): Promise<Printer[]> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

// Get a single printer by ID
export async function getPrinter(id: string): Promise<Printer | null> {
  const { data, error } = await supabase
    .from('printers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Create a new printer
export async function createPrinter(printerData: Omit<Printer, 'id' | 'created_at' | 'updated_at'>): Promise<Printer> {
  const { data, error } = await supabase
    .from('printers')
    .insert(printerData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Update a printer
export async function updatePrinter(id: string, updates: Partial<Printer>): Promise<Printer> {
  const { data, error } = await supabase
    .from('printers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete a printer
export async function deletePrinter(id: string): Promise<void> {
  const { error } = await supabase
    .from('printers')
    .delete()
    .eq('id', id)

  if (error) throw error
}