/**
 * Utility functions for gift card operations
 */

/**
 * Format gift card code for display (adds dashes)
 */
export function formatGiftCardCode(code: string): string {
  const cleanCode = code.replace(/[^A-Z0-9]/g, '')
  return cleanCode.replace(/(.{4})/g, '$1-').slice(0, -1)
}

/**
 * Clean gift card code (removes spaces, dashes, converts to uppercase)
 */
export function cleanGiftCardCode(code: string): string {
  return code.replace(/[^A-Z0-9]/gi, '').toUpperCase()
}

/**
 * Validate gift card code format
 */
export function validateGiftCardCode(code: string): boolean {
  const cleanCode = cleanGiftCardCode(code)
  return /^[A-Z0-9]{16}$/.test(cleanCode)
}

/**
 * Generate a random gift card code (client-side only, server generates the real one)
 */
export function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return formatGiftCardCode(result)
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number, currency = 'DKK'): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Format date only (no time)
 */
export function formatDateOnly(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('da-DK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  } catch {
    return 'Invalid date'
  }
}

/**
 * Check if gift card is expired
 */
export function isGiftCardExpired(expiryDate: string | null | undefined): boolean {
  if (!expiryDate) return false
  
  try {
    const expiry = new Date(expiryDate)
    const now = new Date()
    return expiry < now
  } catch {
    return false
  }
}

/**
 * Get days until expiry
 */
export function getDaysUntilExpiry(expiryDate: string | null | undefined): number | null {
  if (!expiryDate) return null
  
  try {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  } catch {
    return null
  }
}

/**
 * Get gift card status display info
 */
export function getGiftCardStatusInfo(status: string, expiryDate?: string | null) {
  const isExpired = expiryDate ? isGiftCardExpired(expiryDate) : false
  const daysUntilExpiry = expiryDate ? getDaysUntilExpiry(expiryDate) : null
  
  switch (status) {
    case 'active':
      if (isExpired) {
        return {
          label: 'Udløbet',
          color: 'bg-red-100 text-red-800',
          icon: '⚠️'
        }
      }
      if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
        return {
          label: 'Aktiv (udløber snart)',
          color: 'bg-yellow-100 text-yellow-800',
          icon: '⚠️'
        }
      }
      return {
        label: 'Aktiv',
        color: 'bg-green-100 text-green-800',
        icon: '✅'
      }
    case 'used':
      return {
        label: 'Brugt',
        color: 'bg-gray-100 text-gray-800',
        icon: '✓'
      }
    case 'expired':
      return {
        label: 'Udløbet',
        color: 'bg-red-100 text-red-800',
        icon: '⚠️'
      }
    case 'cancelled':
      return {
        label: 'Annulleret',
        color: 'bg-red-100 text-red-800',
        icon: '❌'
      }
    default:
      return {
        label: status,
        color: 'bg-gray-100 text-gray-800',
        icon: '?'
      }
  }
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate gift card amount
 */
export function validateAmount(amount: number, min = 50, max = 10000): { valid: boolean; message?: string } {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, message: 'Beløbet skal være større end 0' }
  }
  
  if (amount < min) {
    return { valid: false, message: `Minimum beløb er ${formatCurrency(min)}` }
  }
  
  if (amount > max) {
    return { valid: false, message: `Maksimum beløb er ${formatCurrency(max)}` }
  }
  
  return { valid: true }
}

/**
 * Generate gift card email content
 */
export function generateGiftCardEmailContent(giftCard: {
  code: string
  amount: number
  recipientName?: string
  senderName?: string
  message?: string
  expiryDate?: string
}): { subject: string; html: string; text: string } {
  const formattedCode = formatGiftCardCode(giftCard.code)
  const formattedAmount = formatCurrency(giftCard.amount)
  const formattedExpiry = giftCard.expiryDate ? formatDateOnly(giftCard.expiryDate) : 'Ingen udløbsdato'
  
  const subject = `Dit gavekort på ${formattedAmount} fra ${giftCard.senderName || 'Payper Steak House'}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dit Gavekort</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 40px 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f8f9fa; padding: 40px 20px; border-radius: 0 0 10px 10px; }
        .gift-card { background: white; border: 2px solid #007bff; border-radius: 10px; padding: 30px; margin: 20px 0; text-align: center; }
        .code { font-size: 24px; font-weight: bold; color: #007bff; font-family: monospace; letter-spacing: 2px; margin: 15px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #28a745; margin: 15px 0; }
        .message { background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0; font-style: italic; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎁 Dit Gavekort</h1>
        <p>Fra ${giftCard.senderName || 'Payper Steak House'}</p>
      </div>
      
      <div class="content">
        ${giftCard.recipientName ? `<p>Kære ${giftCard.recipientName},</p>` : '<p>Hej!</p>'}
        
        <p>Du har modtaget et gavekort! Her er detaljerne:</p>
        
        <div class="gift-card">
          <div class="amount">${formattedAmount}</div>
          <p><strong>Gavekort kode:</strong></p>
          <div class="code">${formattedCode}</div>
          <p><small>Udløber: ${formattedExpiry}</small></p>
        </div>
        
        ${giftCard.message ? `<div class="message">"${giftCard.message}"</div>` : ''}
        
        <p><strong>Sådan bruger du dit gavekort:</strong></p>
        <ol>
          <li>Vis denne kode når du bestiller</li>
          <li>Koden kan bruges online eller i restauranten</li>
          <li>Restbeløbet gemmes automatisk til næste gang</li>
        </ol>
        
        <div class="footer">
          <p>Dette gavekort er udstedt af Payper Steak House</p>
          <p>Har du spørgsmål? Kontakt os på info@paypersteak.dk</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  const text = `
Dit Gavekort fra ${giftCard.senderName || 'Payper Steak House'}

${giftCard.recipientName ? `Kære ${giftCard.recipientName},` : 'Hej!'}

Du har modtaget et gavekort på ${formattedAmount}!

Gavekort kode: ${formattedCode}
Udløber: ${formattedExpiry}

${giftCard.message ? `Besked: "${giftCard.message}"` : ''}

Sådan bruger du dit gavekort:
1. Vis denne kode når du bestiller
2. Koden kan bruges online eller i restauranten  
3. Restbeløbet gemmes automatisk til næste gang

Dette gavekort er udstedt af Payper Steak House
Har du spørgsmål? Kontakt os på info@paypersteak.dk
  `
  
  return { subject, html, text }
}

/**
 * Export gift cards to CSV
 */
export function exportGiftCardsToCSV(giftCards: any[]): string {
  const headers = [
    'Kode',
    'Status',
    'Oprindeligt beløb',
    'Nuværende saldo',
    'Modtager navn',
    'Modtager email',
    'Afsender navn',
    'Udstedt dato',
    'Udløbsdato',
    'Brugt dato'
  ]
  
  const csvContent = [
    headers.join(','),
    ...giftCards.map(gc => [
      `"${formatGiftCardCode(gc.code)}"`,
      `"${gc.status}"`,
      gc.initial_amount,
      gc.current_balance,
      `"${gc.recipient_name || ''}"`,
      `"${gc.recipient_email || ''}"`,
      `"${gc.sender_name || ''}"`,
      `"${formatDate(gc.issued_date)}"`,
      `"${formatDate(gc.expiry_date)}"`,
      `"${formatDate(gc.used_date)}"`
    ].join(','))
  ].join('\n')
  
  return csvContent
}
