# Quick Setup Instructions

## Your Printer Configuration

Based on your printer settings:
- **IP Address:** 192.168.8.196
- **Subnet:** 255.255.255.0
- **Gateway:** 192.168.8.1

## Environment Setup

Create a `.env.local` file in your project root with:

```env
# Printer Configuration
NEXT_PUBLIC_PRINTER_URL=http://192.168.8.196/StarWebPRNT/SendMessage

# Feature Flags
NEXT_PUBLIC_FLAGS=printerWebPRNTV1

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Testing Steps

1. **Create the .env.local file** in your project root with the content above
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Visit the test page:**
   ```
   http://localhost:3001/dev/print-test
   ```
4. **Test your printer connection** - the URL should already be pre-filled with your printer's IP

## Printer Settings Page

Once testing works, configure your printers at:
```
http://localhost:3001/admin/system/printers
```

## Next Steps

- Test basic connectivity first
- Configure room and product type assignments
- Integrate with your order system
