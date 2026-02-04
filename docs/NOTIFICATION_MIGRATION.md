# Notification System Migration Guide

## Overview

The BakeryApp notification system has been migrated from Redis/BullMQ to a **database-backed queue** using Prisma/Postgres. This change:

- ✅ Eliminates the need for Redis/Upstash infrastructure
- ✅ Reduces external dependencies and costs
- ✅ Provides better reliability with transactional guarantees
- ✅ Simplifies deployment and local development

## What Changed

### Before (Redis/BullMQ)
- Used BullMQ library with Redis as the backing store
- Required `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` environment variables
- Dependencies: `bullmq`, `ioredis`, `redis` packages
- Notification jobs stored in Redis queues

### After (Prisma/Postgres)
- Uses Prisma `Notification` model directly in Postgres
- No Redis environment variables needed
- No Redis dependencies in `package.json`
- Worker polls database every 15 seconds for due notifications
- Uses Postgres row-level locking (`FOR UPDATE SKIP LOCKED`) to prevent duplicate processing

## Architecture

### Database Schema
The notification system uses the existing `Notification` model:

```prisma
model Notification {
  id           String             @id @default(uuid())
  orderId      String             @map("order_id")
  targetUserId String             @map("target_user_id")
  kind         NotificationKind   // DAY_BEFORE, SAME_DAY, OVERDUE
  scheduledFor DateTime           @map("scheduled_for")
  sentAt       DateTime?          @map("sent_at")
  status       NotificationStatus // SCHEDULED, SENT, SKIPPED, FAILED
  attemptCount Int                @default(0) @map("attempt_count")
  error        String?
}
```

### Worker Process
- **File**: `backend/src/queues/notificationQueue.ts`
- **Polling interval**: Every 15 seconds
- **Batch size**: Up to 20 notifications per cycle
- **Retry logic**: Up to 3 attempts, then marks as FAILED
- **Claiming**: Uses atomic Postgres row locking to prevent race conditions

### Flow
1. When an order is created → `scheduleOrderNotifications(orderId)` creates `Notification` rows
2. Worker polls database for `status = SCHEDULED` and `scheduledFor <= NOW()`
3. Claims notifications using row-level lock
4. For each notification:
   - Creates `UserNotification` for in-app display
   - Sends push notification if user has device token
   - Updates status to SENT/FAILED
5. On order completion/cancellation → `cancelOrderNotifications(orderId)` marks as SKIPPED

## Migration Steps

### 1. Update Dependencies
Remove Redis packages from your backend:
```bash
cd backend
npm uninstall bullmq ioredis redis
```

### 2. Update Environment Variables
Remove from `.env`:
```
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
REDIS_URL=...
```

Keep only:
```
DATABASE_URL=postgres://...
JWT_SECRET=...
PORT=5000
NODE_ENV=development
EXPO_PUSH_ENDPOINT=https://exp.host/--/api/v2/push/send
```

### 3. Database Migration
No new migrations needed - the `Notification` model already exists. If starting fresh:
```bash
npx prisma migrate dev
```

### 4. Code Changes
The notification API remains the same:

```typescript
// Schedule notifications for a new order
import { scheduleOrderNotifications } from './queues/notificationQueue';
await scheduleOrderNotifications(orderId);

// Cancel notifications when order is completed/cancelled
import { cancelOrderNotifications } from './queues/notificationQueue';
await cancelOrderNotifications(orderId);
```

### 5. Start Server
The worker auto-starts when `notificationQueue.ts` is imported:
```bash
npm run dev
```

You should see:
```
📬 Starting DB-backed notification worker...
✅ Notification worker started (polling every 15s)
```

## Testing

### 1. Create a test order with near-future pickup
```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customerName": "Test User",
    "customerPhone": "1234567890",
    "pickupAt": "2026-02-05T10:00:00Z",
    "items": [{"itemName": "Cake", "qty": 1, "unitPrice": 25}]
  }'
```

### 2. Check scheduled notifications
```sql
SELECT id, kind, scheduled_for, status, attempt_count 
FROM notifications 
WHERE order_id = 'YOUR_ORDER_ID'
ORDER BY scheduled_for;
```

### 3. Monitor worker logs
Watch for processing logs:
```
📬 Processing 2 due notifications
✅ Push notification sent to John Doe for order #1001 (DAY_BEFORE)
✅ Notification processed for order #1001 (DAY_BEFORE)
```

### 4. Manual trigger (for testing)
To test immediately, temporarily modify `scheduledFor` in the database:
```sql
UPDATE notifications 
SET scheduled_for = NOW() 
WHERE status = 'SCHEDULED' 
LIMIT 1;
```
The worker will process it in the next 15-second cycle.

## Performance Considerations

### Polling Interval
Default is 15 seconds. Adjust in `notificationQueue.ts`:
```typescript
workerInterval = setInterval(() => {
  processDueNotifications().catch(...);
}, 15000); // Change this value
```

**Recommendations**:
- **15-30s**: Good for most use cases, minimal database load
- **5-10s**: For time-sensitive notifications
- **60s+**: For low-traffic apps

### Database Load
- With default settings and <1000 notifications/day, impact is negligible
- Index on `(status, scheduled_for)` ensures fast queries
- Row-level locking prevents lock contention

### Scaling
For high-volume scenarios (>10k notifications/day):
1. Consider running multiple worker instances (row locking prevents duplicates)
2. Increase batch size from 20 to 50-100
3. Add separate notification database read replica
4. Consider using `pg_cron` for Postgres-native scheduling

## Troubleshooting

### Notifications not sending
1. Check worker is running: Look for startup log
2. Query pending notifications:
   ```sql
   SELECT * FROM notifications 
   WHERE status = 'SCHEDULED' AND scheduled_for <= NOW();
   ```
3. Check for errors:
   ```sql
   SELECT * FROM notifications 
   WHERE status = 'FAILED' 
   ORDER BY scheduled_for DESC LIMIT 10;
   ```

### Duplicate notifications
- Should not happen due to row locking
- If observed, check Postgres transaction isolation level
- Verify only one worker instance per database

### Worker not starting
- Ensure `./queues/notificationQueue` is imported in `server.ts`
- Check for startup errors in console
- Verify `DATABASE_URL` is correct

## Rollback (if needed)

To revert to Redis/BullMQ:
1. Restore `package.json` dependencies
2. Restore original `notificationQueue.ts` from git history
3. Restore Redis env vars
4. Restart server

## Future Enhancements

Potential improvements:
- [ ] Add `pg_cron` extension for native Postgres scheduling
- [ ] Implement notification retry backoff strategies
- [ ] Add dashboard for monitoring notification status
- [ ] Support for user notification preferences (quiet hours)
- [ ] Batch push notifications for better efficiency

## Support

For issues or questions, refer to:
- [README.md](../README.md)
- [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- Notification model: `backend/prisma/schema.prisma`
- Worker code: `backend/src/queues/notificationQueue.ts`
