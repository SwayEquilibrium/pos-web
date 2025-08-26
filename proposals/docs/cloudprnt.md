# Star CloudPRNT Implementation Guide

Star CloudPRNT is a more reliable alternative to WebPRNT that uses a polling-based architecture where printers pull jobs from a server queue instead of receiving direct HTTP requests.

## Architecture

```
Application → Queue Job → Database → Printer Polls → Printer Prints
```

1. **Application** enqueues print jobs via `/api/cloudprnt/enqueue`
2. **Database** stores jobs in `print_jobs` table with status tracking
3. **Printer** polls `/api/cloudprnt/{printerId}/job` every 5-15 seconds
4. **Server** returns oldest queued job and marks it as delivered
5. **Printer** processes job and optionally reports status back

## Setup Instructions

### 1. Database Migration

Run the migration in Supabase SQL Editor:
```sql
-- Copy contents from proposals/migrations/010_cloudprnt.sql
```

### 2. Enable Feature Flag

Add to your `.env.local`:
```env
NEXT_PUBLIC_FLAGS=printerWebPRNTV1,printerCloudPRNTV1
```

### 3. Configure Printer

1. **Access Printer Web Interface:**
   - Open http://192.168.8.197 in browser
   - Login (usually admin/admin or no login required)

2. **Find CloudPRNT Settings:**
   Look for:
   - "CloudPRNT" or "Cloud Printing"
   - "Network Settings" → "CloudPRNT"  
   - "Advanced" → "CloudPRNT"

3. **Configure CloudPRNT:**
   - ✅ **Enable CloudPRNT:** Turn ON
   - ✅ **Server URL:** `https://your-domain.com/api/cloudprnt/tsp100-kitchen/job`
   - ✅ **Poll Interval:** 10 seconds (5-15 seconds recommended)
   - ✅ **Status Callback:** `https://your-domain.com/api/cloudprnt/tsp100-kitchen/job` (optional)
   - ✅ **Authentication:** None (for now)

4. **Save and Restart:**
   - Save settings
   - Restart printer if required

### 4. Test Setup

1. **Visit Test Page:**
   ```
   http://localhost:3000/dev/cloudprnt
   ```

2. **Enqueue Test Job:**
   - Enter printer ID: `tsp100-kitchen`
   - Enter test message
   - Click "Enqueue Job"

3. **Monitor Queue:**
   - Job should appear as "QUEUED"
   - Within 10 seconds, printer should poll and job becomes "DELIVERED"
   - Printer should print the content

## API Endpoints

### POST /api/cloudprnt/enqueue
Enqueue a new print job.

**Request:**
```json
{
  "printerId": "tsp100-kitchen",
  "payload": "Kitchen Order #123\n2x Burger\n1x Fries",
  "contentType": "text/plain",
  "orderId": "uuid-optional",
  "receiptType": "kitchen"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "job-uuid",
  "printerId": "tsp100-kitchen",
  "status": "QUEUED"
}
```

### GET /api/cloudprnt/[printerId]/job
Printer polling endpoint (called by printer).

**Response (when job available):**
- Status: 200
- Body: Job payload (text content)
- Content-Type: As specified in job

**Response (no jobs):**
- Status: 204 No Content

### POST /api/cloudprnt/[printerId]/job
Status callback from printer (optional).

**Request:**
```json
{
  "jobId": "job-uuid",
  "status": "PRINTED"
}
```

### GET /api/cloudprnt/enqueue?printerId=xxx
Monitor queue status (debugging).

## Integration with Orders

To automatically print kitchen receipts when orders are created, modify your order creation hook:

```typescript
// In hooks/useOrders.ts (after order creation)
if (flags.printerCloudPRNTV1) {
  await fetch('/api/cloudprnt/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      printerId: 'tsp100-kitchen',
      payload: buildKitchenReceipt(orderItems, tableNumber),
      contentType: 'text/plain',
      orderId: orderId,
      receiptType: 'kitchen'
    })
  })
}
```

## Printer Configuration Examples

### TSP100 CloudPRNT Settings
```
CloudPRNT: Enabled
Server URL: https://yourapp.vercel.app/api/cloudprnt/tsp100-kitchen/job
Poll Interval: 10 seconds
Status Callback: https://yourapp.vercel.app/api/cloudprnt/tsp100-kitchen/job
Authentication: None
```

### Multiple Printers
- Kitchen: `tsp100-kitchen`
- Bar: `tsp100-bar`  
- Receipt: `tsp100-receipt`

Each printer gets its own unique printer ID in the URL.

## Troubleshooting

### Printer Not Polling
1. Check CloudPRNT is enabled in printer settings
2. Verify Server URL is correct and accessible
3. Check network connectivity
4. Monitor printer logs if available

### Jobs Not Printing
1. Check job status in queue: `/api/cloudprnt/enqueue`
2. Verify printer is polling (jobs should move from QUEUED → DELIVERED)
3. Check printer paper and hardware
4. Verify content format is compatible

### Status Tracking
- **QUEUED:** Job created, waiting for printer
- **DELIVERED:** Printer received job
- **PRINTED:** Printer confirmed successful print (if callback enabled)
- **FAILED:** Printer reported error (if callback enabled)

## Production Considerations

### Security
- Add authentication tokens to printer URLs
- Use HTTPS for all endpoints
- Implement rate limiting

### Monitoring  
- Set up alerts for failed jobs
- Monitor queue depth
- Track printer polling frequency

### Cleanup
- Automatically delete old print jobs (7+ days)
- Monitor database size
- Archive important print logs

## Rollback

To disable CloudPRNT:
1. Remove `printerCloudPRNTV1` from `NEXT_PUBLIC_FLAGS`
2. Restart application
3. Disable CloudPRNT in printer settings if desired

The database table and API routes will remain but be inactive.
