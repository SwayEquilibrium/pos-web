# Star mC-Print2 WebPRNT Setup Guide

## Overview

This guide covers setting up Star mC-Print2 thermal printers with WebPRNT technology for your POS system. WebPRNT allows printing over HTTP/HTTPS from web browsers to network-connected printers.

## Hardware Setup

### 1. Network Connection

**Ethernet Setup:**
1. Connect the printer to your network using an Ethernet cable
2. Print a self-test page to get the current IP address:
   - Hold the FEED button while powering on
   - Release when the STATUS LED turns solid
3. Note the IP address from the printed configuration

**WiFi Setup (if supported):**
1. Access the printer's web interface at `http://[PRINTER_IP]`
2. Login with default credentials: `root` / `public`
3. Navigate to Network → Wireless Settings
4. Configure your WiFi network

### 2. Static IP Configuration

**Recommended:** Set a static IP to prevent connection issues:

1. Access printer web interface: `http://[PRINTER_IP]`
2. Login: `root` / `public`
3. Go to Network → IP Parameters
4. Set:
   - **IP Address:** `192.168.1.100` (or your preferred static IP)
   - **Subnet Mask:** `255.255.255.0`
   - **Gateway:** Your router's IP (usually `192.168.1.1`)
   - **DNS:** `8.8.8.8` or your router's IP
5. Click "Set" and restart the printer

## Software Setup

### 1. Star WebPRNT SDK

Download and install the SDK files:

1. **Download SDK:**
   - Visit: https://www.star-m.jp/products/s_print/WebPRNTSDK/
   - Download the WebPRNT SDK ZIP file

2. **Install SDK Files:**
   ```
   public/vendor/webprnt/
   ├── StarWebPrintBuilder.js
   └── StarWebPrintTrader.js
   ```

3. **Verify Installation:**
   - Files must be accessible at `/vendor/webprnt/StarWebPrintBuilder.js`
   - Check browser network tab for successful loading

### 2. Environment Configuration

Add to your `.env.local` or deployment environment:

```env
# Printer Configuration
NEXT_PUBLIC_PRINTER_URL=http://192.168.1.100/StarWebPRNT/SendMessage

# Feature Flags
NEXT_PUBLIC_FLAGS=printerWebPRNTV1

# Optional: Multiple printers (comma-separated)
# NEXT_PUBLIC_PRINTER_URLS=http://192.168.1.100/StarWebPRNT/SendMessage,http://192.168.1.101/StarWebPRNT/SendMessage
```

### 3. HTTPS Considerations

**Mixed Content Issues:**
- HTTPS websites cannot make HTTP requests to printers
- **Solutions:**
  1. **Development:** Use HTTP for local development
  2. **Production:** Configure HTTPS on printer or use proxy
  3. **Alternative:** Use HTTP subdomain for printer operations

**Enable HTTPS on Printer:**
1. Access printer web interface
2. Go to Security → HTTPS Settings
3. Generate or upload SSL certificate
4. Enable HTTPS and restart printer
5. Update URL to `https://[PRINTER_IP]/StarWebPRNT/SendMessage`

## Testing

### 1. Basic Connectivity

1. Navigate to `/dev/print-test` in your application
2. Verify the printer URL is correct
3. Click "Test Connection"
4. Check for successful test print

### 2. Print Samples

Test different receipt types:
- **Simple Test:** Basic connectivity test
- **Sample Receipt:** Customer receipt with items and total
- **Kitchen Receipt:** Kitchen order format (no prices)

### 3. Troubleshooting

**Common Issues:**

| Issue | Solution |
|-------|----------|
| "Failed to load SDK" | Verify SDK files in `public/vendor/webprnt/` |
| "Connection refused" | Check printer IP and network connectivity |
| "Mixed content blocked" | Use HTTP in dev or configure HTTPS |
| "Print timeout" | Check printer is online and has paper |

**Network Diagnostics:**
```bash
# Test printer connectivity
ping 192.168.1.100

# Test WebPRNT endpoint
curl -X POST http://192.168.1.100/StarWebPRNT/SendMessage \
  -H "Content-Type: application/json" \
  -d '{"request": ""}'
```

## Printer Configuration

### 1. Room and Category Assignment

Configure printers for specific areas:

```typescript
// Example: Kitchen printer for food items
const kitchenPrinter: PrinterConfig = {
  id: 'kitchen-main',
  name: 'Kitchen Printer',
  type: 'webprnt',
  connectionString: 'http://192.168.1.100/StarWebPRNT/SendMessage',
  assignedRooms: ['kitchen', 'prep-area'],
  assignedCategories: ['food', 'hot-dishes'],
  assignedProductTypes: ['food'],
  enabled: true,
  settings: {
    paperWidth: 48,
    autoCut: true
  }
}
```

### 2. Multiple Printer Setup

**Scenario:** Separate printers for different functions
- **Kitchen Printer:** Food items only
- **Bar Printer:** Drinks only  
- **Receipt Printer:** Customer receipts

```env
# Environment setup for multiple printers
NEXT_PUBLIC_KITCHEN_PRINTER=http://192.168.1.100/StarWebPRNT/SendMessage
NEXT_PUBLIC_BAR_PRINTER=http://192.168.1.101/StarWebPRNT/SendMessage
NEXT_PUBLIC_RECEIPT_PRINTER=http://192.168.1.102/StarWebPRNT/SendMessage
```

## Production Deployment

### 1. Network Security

- Place printers on isolated VLAN if possible
- Restrict printer web interface access
- Use strong passwords (change from default)
- Regular firmware updates

### 2. Reliability

- Use UPS for power backup
- Monitor printer status
- Implement retry logic for failed prints
- Keep spare paper rolls

### 3. Performance

- Use wired connections when possible
- Monitor network latency
- Implement print queuing for high volume

## API Integration

### 1. Print Orders Automatically

```typescript
import { printToMatchingPrinters } from '@/proposals/ext/modkit/printers/registry.v1'
import { buildKitchenReceiptByType } from '@/proposals/ext/modkit/printers/receipts/basicReceipt.v1'

// Print kitchen receipt when order is placed
const handleNewOrder = async (order: Order) => {
  // Print food items to kitchen
  const foodItems = order.items.filter(item => item.productType === 'food')
  if (foodItems.length > 0) {
    const kitchenReceipt = buildKitchenReceiptByType(
      foodItems, 
      'food', 
      `Table ${order.tableNumber}`
    )
    
    await printToMatchingPrinters(kitchenReceipt, {
      productType: 'food',
      roomId: order.roomId
    })
  }

  // Print drinks to bar
  const drinkItems = order.items.filter(item => item.productType === 'drinks')
  if (drinkItems.length > 0) {
    const barReceipt = buildKitchenReceiptByType(
      drinkItems, 
      'drinks', 
      `Table ${order.tableNumber}`
    )
    
    await printToMatchingPrinters(barReceipt, {
      productType: 'drinks',
      roomId: order.roomId
    })
  }
}
```

## Maintenance

### 1. Regular Tasks

- **Weekly:** Clean print head with cleaning card
- **Monthly:** Check and replace paper rolls
- **Quarterly:** Update printer firmware
- **Annually:** Replace print head if needed

### 2. Monitoring

Monitor these metrics:
- Print success rate
- Response times
- Paper status
- Error frequencies

### 3. Support

**Star Micronics Support:**
- Website: https://www.star-m.jp/
- Documentation: WebPRNT SDK documentation
- Community: Star developer forums

**Local Support:**
- Check for authorized Star dealers
- Consider maintenance contracts for multiple printers
