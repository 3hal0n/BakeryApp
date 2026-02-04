import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../services/pushNotificationService';
import { NotificationKind, NotificationStatus } from '@prisma/client';

// DB-backed notification worker using Prisma/Postgres
let workerInterval: NodeJS.Timeout | null = null;
let isProcessing = false;

/**
 * Process a batch of due notifications from the database
 * Uses Postgres row-level locking to prevent duplicate processing
 */
async function processDueNotifications(): Promise<void> {
  if (isProcessing) {
    return; // Skip if already processing
  }

  isProcessing = true;

  try {
    // Claim up to 20 scheduled notifications that are due
    // Using raw SQL with FOR UPDATE SKIP LOCKED for atomic claiming
    const claimedNotifications: any[] = await prisma.$queryRaw`
      WITH claimed AS (
        SELECT id
        FROM notifications
        WHERE status = 'SCHEDULED'
          AND scheduled_for <= NOW()
        ORDER BY scheduled_for
        LIMIT 20
        FOR UPDATE SKIP LOCKED
      )
      UPDATE notifications
      SET status = 'SCHEDULED'::notification_status,
          attempt_count = attempt_count + 1
      FROM claimed
      WHERE notifications.id = claimed.id
      RETURNING 
        notifications.id,
        notifications.order_id,
        notifications.target_user_id,
        notifications.kind,
        notifications.scheduled_for,
        notifications.attempt_count
    `;

    if (claimedNotifications.length === 0) {
      return; // No due notifications
    }

    console.log(`📬 Processing ${claimedNotifications.length} due notifications`);

    // Process each claimed notification
    for (const notification of claimedNotifications) {
      try {
        await processNotification(notification);
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);
        
        // Update notification status based on attempt count
        const maxAttempts = 3;
        const newStatus = notification.attempt_count >= maxAttempts 
          ? NotificationStatus.FAILED 
          : NotificationStatus.SCHEDULED;

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            status: newStatus,
            error: String(error),
          },
        });
      }
    }
  } catch (error) {
    console.error('Error processing notification batch:', error);
  } finally {
    isProcessing = false;
  }
}

/**
 * Process a single notification
 */
async function processNotification(notification: any): Promise<void> {
  const { id, order_id, target_user_id, kind } = notification;

  // Get order and user details
  const [order, user] = await Promise.all([
    prisma.order.findUnique({
      where: { id: order_id },
      select: {
        id: true,
        orderNo: true,
        status: true,
        pickupAt: true,
        customerName: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: target_user_id },
      select: {
        id: true,
        name: true,
        deviceTokens: {
          select: { token: true, platform: true },
          orderBy: { lastSeenAt: 'desc' },
          take: 1,
        },
      },
    }),
  ]);

  if (!order) {
    throw new Error(`Order ${order_id} not found`);
  }

  if (!user) {
    throw new Error(`User ${target_user_id} not found`);
  }

  // Skip if order is already completed or cancelled
  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    console.log(`⏭️  Skipping notification for ${order.status} order ${order_id}`);
    await prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.SKIPPED },
    });
    return;
  }

  // Build notification message
  const { title, message } = buildNotificationMessage(kind, order);

  // Create user notification record
  await prisma.userNotification.create({
    data: {
      userId: target_user_id,
      orderId: order_id,
      type: kind,
      title,
      message,
      isRead: false,
    },
  });

  // Send push notification if user has device tokens
  if (user.deviceTokens.length > 0) {
    const deviceToken = user.deviceTokens[0];
    try {
      await sendPushNotification({
        to: deviceToken.token,
        title,
        body: message,
        data: {
          orderId: order_id,
          orderNumber: order.orderNo,
          type: kind,
        },
      });
      console.log(`✅ Push notification sent to ${user.name} for order ${order.orderNo}`);
    } catch (pushError) {
      console.error(`Failed to send push notification:`, pushError);
      // Continue - we still created the in-app notification
    }
  }

  // Mark notification as sent
  await prisma.notification.update({
    where: { id },
    data: {
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    },
  });

  console.log(`✅ Notification processed for order ${order.orderNo} (${kind})`);
}

/**
 * Build notification title and message based on notification kind
 */
function buildNotificationMessage(
  kind: NotificationKind,
  order: { orderNo: string; pickupAt: Date; customerName: string }
): { title: string; message: string } {
  const pickupTime = new Date(order.pickupAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  switch (kind) {
    case NotificationKind.DAY_BEFORE:
      return {
        title: '📅 Order Pickup Reminder',
        message: `Your order #${order.orderNo} is ready for pickup tomorrow at ${pickupTime}`,
      };
    case NotificationKind.SAME_DAY:
      return {
        title: '🔔 Pickup Today!',
        message: `Today is pickup day! Order #${order.orderNo} is ready at ${pickupTime}`,
      };
    case NotificationKind.OVERDUE:
      return {
        title: '⚠️ Overdue Order',
        message: `Order #${order.orderNo} was scheduled for pickup and is now overdue`,
      };
    default:
      return {
        title: 'Order Notification',
        message: `Notification for order #${order.orderNo}`,
      };
  }
}

/**
 * Schedule notifications for an order based on pickup time
 */
export async function scheduleOrderNotifications(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      orderNo: true,
      createdBy: true,
      pickupAt: true,
      status: true,
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Skip if order is already completed or cancelled
  if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
    console.log(`Skipping notification scheduling for ${order.status} order`);
    return;
  }

  const pickupDate = new Date(order.pickupAt);
  const now = new Date();

  // Calculate notification times
  const dayBefore = new Date(pickupDate.getTime() - 24 * 60 * 60 * 1000);
  const sameDay = new Date(pickupDate);
  sameDay.setHours(9, 0, 0, 0); // 9 AM on pickup day

  const notificationsToCreate: Array<{
    orderId: string;
    targetUserId: string;
    kind: NotificationKind;
    scheduledFor: Date;
  }> = [];

  // Schedule day-before reminder
  if (dayBefore > now) {
    notificationsToCreate.push({
      orderId: order.id,
      targetUserId: order.createdBy,
      kind: NotificationKind.DAY_BEFORE,
      scheduledFor: dayBefore,
    });
  }

  // Schedule same-day reminder
  if (sameDay > now && sameDay < pickupDate) {
    notificationsToCreate.push({
      orderId: order.id,
      targetUserId: order.createdBy,
      kind: NotificationKind.SAME_DAY,
      scheduledFor: sameDay,
    });
  }

  // Create all notifications in a single transaction
  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToCreate.map((n) => ({
        ...n,
        status: NotificationStatus.SCHEDULED,
        attemptCount: 0,
      })),
      skipDuplicates: true, // Skip if notification already exists
    });

    console.log(`📅 Scheduled ${notificationsToCreate.length} notifications for order ${order.orderNo}`);
  } else {
    console.log(`⏭️  No future notifications to schedule for order ${order.orderNo}`);
  }
}

/**
 * Cancel all scheduled notifications for an order
 */
export async function cancelOrderNotifications(orderId: string): Promise<void> {
  const result = await prisma.notification.updateMany({
    where: {
      orderId,
      status: NotificationStatus.SCHEDULED,
    },
    data: {
      status: NotificationStatus.SKIPPED,
    },
  });

  console.log(`🚫 Cancelled ${result.count} scheduled notifications for order ${orderId}`);
}

/**
 * Start the notification worker
 * Processes due notifications every 15 seconds
 */
export function startNotificationWorker(): void {
  if (workerInterval) {
    console.warn('Notification worker is already running');
    return;
  }

  console.log('📬 Starting DB-backed notification worker...');
  
  // Process immediately on startup
  processDueNotifications().catch((err) => {
    console.error('Initial notification processing failed:', err);
  });

  // Then process every 15 seconds
  workerInterval = setInterval(() => {
    processDueNotifications().catch((err) => {
      console.error('Scheduled notification processing failed:', err);
    });
  }, 15000); // 15 seconds

  console.log('✅ Notification worker started (polling every 15s)');
}

/**
 * Stop the notification worker
 */
export async function stopNotificationWorker(): Promise<void> {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('📭 Notification worker stopped');
  }
}

// Auto-start the worker when this module is imported
startNotificationWorker();
