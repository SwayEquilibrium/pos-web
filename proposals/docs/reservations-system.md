# Reservation System v1.0

## Overview

Complete table reservation and online booking system with conflict detection, table availability management, and event-driven architecture.

## Features

### ✅ Core Functionality
- **Table Reservations**: Create, update, and manage table bookings
- **Conflict Detection**: Prevents double-booking using PostgreSQL time ranges
- **Online Booking Ready**: API endpoints for external booking systems
- **Table Availability Control**: Per-table online booking enable/disable
- **Buffer Time Management**: Configurable cleanup time between bookings
- **Status Tracking**: Full reservation lifecycle management
- **Event Integration**: Emits domain events for side effects

### ✅ UI Components
- **Booking Management**: Full admin interface at `/admin/booking`
- **Table Settings**: Configure which tables accept online bookings
- **Real-time Stats**: Live reservation counts on main dashboard
- **Mobile Responsive**: Works on all device sizes

### ✅ Database Schema
- **Reservations Table**: Core booking data with generated time ranges
- **Reservation Tables**: Many-to-many table assignments
- **Table Booking Flags**: Per-table online booking availability
- **Conflict Prevention**: GiST indexes for efficient time overlap queries

## File Structure

```
src/config/flags.ts                           # Feature flags configuration
app/admin/booking/page.tsx                    # Main booking management UI
app/api/reservations/route.ts                 # Flag-gated API endpoint
proposals/
├── hooks/useReservations.v1.ts              # React Query hooks
├── api/reservations/handlers.v1.ts          # API request handlers
├── components/TableBookingSettings.v1.tsx   # Table availability management
├── migrations/
│   ├── 003_reservations.sql                 # Core reservation tables
│   └── 004_table_booking_availability.sql   # Table booking flags
└── docs/reservations-system.md              # This documentation
```

## Database Tables

### `reservations`
- Stores all reservation data with generated time ranges
- Automatic conflict detection via `tstzrange` and GiST indexes
- Status tracking from `confirmed` → `seated` → `completed`
- Customer information and special requests

### `reservation_tables`
- Many-to-many relationship between reservations and tables
- Supports multi-table reservations for large parties
- Tracks assignment timestamps and responsible users

### `tables` (extended)
- Added `available_for_booking` flag
- `booking_buffer_minutes` for cleanup time
- `max_advance_booking_days` for booking window limits

## API Endpoints

### `GET /api/reservations`
Query parameters:
- `date`: Filter by reservation date (YYYY-MM-DD)
- `status`: Filter by reservation status
- `customer_phone`: Search by phone number

### `POST /api/reservations`
Create new reservation:
```json
{
  "customer_name": "Lars Hansen",
  "customer_phone": "+45 12 34 56 78",
  "customer_email": "lars@example.com",
  "party_size": 4,
  "reservation_date": "2024-12-15",
  "reservation_time": "18:00",
  "duration_minutes": 120,
  "special_requests": "Window table preferred"
}
```

## React Hooks

### `useReservations(filters)`
- Fetches reservations with optional filtering
- Real-time updates via React Query
- Supports date, status, and phone number filters

### `useCreateReservation()`
- Creates new reservations with conflict checking
- Automatic table assignment if not specified
- Emits `ReservationCreated` domain event

### `useUpdateReservationStatus()`
- Updates reservation status with timeline tracking
- Emits `ReservationStatusChanged` events
- Handles state transitions (confirmed → seated → completed)

### `useTableAvailability(params)`
- Finds available tables for specific time slots
- Real-time availability checking
- Considers party size and table capacity

## Configuration

### Environment Variables
```env
# Enable reservation system
NEXT_PUBLIC_FLAGS=reservationsV1

# Enable with event outbox for reliability
NEXT_PUBLIC_FLAGS=reservationsV1,outboxV1
```

### Feature Flag Usage
```typescript
import { flags } from '@/src/config/flags'

if (flags.reservationsV1) {
  // Use new reservation system
  const reservations = useReservations({ date: today })
} else {
  // Show legacy/coming soon message
  const reservations = mockReservations
}
```

## Database Functions

### `create_reservation()`
- Creates reservation with automatic table assignment
- Validates time conflicts and availability
- Generates unique reservation numbers
- Emits domain events to outbox

### `find_available_tables()`
- Finds tables available for specific time range
- Considers party size and table capacity
- Filters by location and booking availability
- Optimized with GiST indexes

### `check_table_availability()`
- Fast availability check for single table
- Used for conflict prevention
- Considers booking buffer times

## Event Integration

When `outboxV1` flag is also enabled:

### Domain Events Emitted
- `ReservationCreated`: New reservation made
- `ReservationStatusChanged`: Status updated
- `TableBookingToggled`: Online booking enabled/disabled

### Event Data
```json
{
  "event_type": "ReservationCreated",
  "aggregate_type": "reservation",
  "aggregate_id": "uuid",
  "data": {
    "reservation_number": "RES-20241201-0001",
    "customer_name": "Lars Hansen",
    "party_size": 4,
    "reservation_date": "2024-12-01",
    "reservation_time": "18:00"
  }
}
```

## Security & Tenant Isolation

- All tables include `tenant_id` for multi-tenant support
- RLS policies prevent cross-tenant data access
- User activity logging for audit trails
- Input validation and sanitization

## Performance Optimizations

### Indexes
- `idx_reservations_time_range_gist`: Fast time conflict detection
- `idx_reservations_tenant_date_time`: Efficient date queries
- `idx_tables_booking_availability`: Quick availability lookups

### Caching
- React Query caches reservation data
- Automatic cache invalidation on mutations
- Optimistic updates for better UX

## Online Booking Integration

### External Booking Platforms
The API is designed to integrate with:
- Restaurant booking platforms
- Website booking widgets
- Mobile apps
- Third-party reservation systems

### Webhook Support
When combined with `outboxV1`:
- Real-time notifications to external systems
- Booking confirmations and updates
- Automated email/SMS notifications

## Migration Guide

### Phase 1: Database Setup
```sql
-- Run migrations in order
\i proposals/migrations/003_reservations.sql
\i proposals/migrations/004_table_booking_availability.sql
```

### Phase 2: Enable Feature Flag
```env
NEXT_PUBLIC_FLAGS=reservationsV1
```

### Phase 3: Configure Tables
1. Go to `/admin/booking`
2. Click "Bordindstillinger" 
3. Enable online booking for desired tables
4. Set appropriate buffer times

### Phase 4: Test Integration
- Create test reservations via UI
- Verify conflict detection works
- Test API endpoints with external tools
- Confirm event emission (if outbox enabled)

## Troubleshooting

### Common Issues

**Reservations not showing:**
- Check `reservationsV1` flag is enabled
- Verify database migrations ran successfully
- Check browser console for hook loading errors

**Conflict detection not working:**
- Ensure GiST indexes are created
- Verify time ranges are properly generated
- Check table `available_for_booking` flags

**API endpoints returning 404:**
- Confirm flag is enabled in environment
- Restart application after flag changes
- Check API route file exists and is valid

### Debug Commands

```sql
-- Check reservation time ranges
SELECT id, customer_name, time_range 
FROM reservations 
WHERE reservation_date = CURRENT_DATE;

-- Verify table availability
SELECT * FROM table_booking_status;

-- Check for time conflicts
SELECT r1.id, r1.customer_name, r2.id, r2.customer_name
FROM reservations r1, reservations r2
WHERE r1.id < r2.id 
  AND r1.time_range && r2.time_range
  AND r1.status IN ('confirmed', 'seated')
  AND r2.status IN ('confirmed', 'seated');
```

## Roadmap

### Future Enhancements
- [ ] Recurring reservations (weekly/monthly)
- [ ] Waitlist management for full periods  
- [ ] Dynamic pricing based on demand
- [ ] Integration with payment systems
- [ ] Customer loyalty program integration
- [ ] Advanced reporting and analytics
- [ ] Multi-location support
- [ ] Staff scheduling integration
