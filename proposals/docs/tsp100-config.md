# TSP100 Printer Configuration

## Updated Environment Settings

Update your `.env.local` file with the new TSP100 printer:

```env
# TSP100 Printer Configuration
NEXT_PUBLIC_PRINTER_URL=http://192.168.8.197/StarWebPRNT/SendMessage

# Feature Flags
NEXT_PUBLIC_FLAGS=printerWebPRNTV1

# Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## TSP100 vs mC-Print2 Differences

The TSP100 is actually better for WebPRNT than the mC-Print2:

### ✅ **TSP100 Advantages:**
- **Better WebPRNT support** - More reliable printing
- **Faster response times** - Usually prints immediately
- **Better CORS headers** - Notice `Access-Control-Allow-Private-Network: true`
- **More consistent paper handling**

### **Expected Behavior:**
- **Connection tests should work immediately**
- **Paper should feed and print reliably**
- **Cut commands should work properly**

## Testing Steps

1. **Update your .env.local** with the new IP: `192.168.8.197`
2. **Restart your development server**
3. **Visit:** `http://localhost:3000/dev/print-test`
4. **The URL should auto-populate** with the new TSP100 IP
5. **Try "Raw Test"** - TSP100 usually prints immediately

## TSP100 Web Interface

Access the printer at: `http://192.168.8.197`
- **Default login:** `root` / `public`
- **WebPRNT should be enabled by default**
- **Check paper width settings** (58mm or 80mm)
