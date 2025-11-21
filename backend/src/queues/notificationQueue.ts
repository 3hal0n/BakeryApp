import { Queue, Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import { prisma } from '../lib/prisma';
import { sendPushNotification } from '../services/pushNotificationService';

export interface NotificationJobData {
  orderId: string;
  customerId: string;
  type: 'reminder-24h' | 'reminder-12h' | 'same-day' | 'overdue';
  message: string;
}

// Create notification queue
export const notificationQueue = new Queue<NotificationJobData>('notifications', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Worker to process notification jobs
export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    const { orderId, customerId, type, message } = job.data;

    try {
      console.log(`Processing ${type} notification for order ${orderId}`);

      // Get customer and order details
      const customer = await prisma.user.findUnique({
        where: { id: customerId },
        select: { id: true, name: true, pushToken: true },
      });

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          orderNo: true,
          status: true,
          pickupAt: true,
          totalAmount: true,
        },
      });

      if (!customer) {
        throw new Error(`Customer ${customerId} not found`);
      }

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      // Skip if order is already completed or cancelled
      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        console.log(`Skipping notification for ${order.status} order ${orderId}`);
        return { skipped: true, reason: `Order is ${order.status}` };
      }

      // Create notification record in database
      await prisma.userNotification.create({
        data: {
          userId: customerId,
          orderId,
          type,
          title: getNotificationTitle(type),
          message,
          isRead: false,
        },
      });

      // Send push notification if customer has a push token
      if (customer.pushToken) {
        await sendPushNotification({
          to: customer.pushToken,
          title: getNotificationTitle(type),
          body: message,
          data: {
            orderId,
            orderNumber: order.orderNo,
            type,
          },
        });
      }

      console.log(`✅ ${type} notification sent for order ${orderId}`);
      return { success: true, orderId, type };
    } catch (error) {
      console.error(`Failed to process notification job:`, error);
      throw error; // Will trigger retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 notifications simultaneously
  }
);

// Helper function to get notification titles
function getNotificationTitle(type: NotificationJobData['type']): string {
  switch (type) {
    case 'reminder-24h':
      return '📅 Order Pickup Reminder';
    case 'reminder-12h':
      return '⏰ Pickup Soon!';
    case 'same-day':
      return '🔔 Pickup Today!';
    case 'overdue':
      return '⚠️ Overdue Order';
    default:
      return 'Order Notification';
  }
}

// Schedule notification for an order
export async function scheduleOrderNotifications(orderId: string) {
  try {
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

    const pickupDate = new Date(order.pickupAt);
    const now = new Date();

    // Calculate notification times
    const reminder24h = new Date(pickupDate.getTime() - 24 * 60 * 60 * 1000);
    const reminder12h = new Date(pickupDate.getTime() - 12 * 60 * 60 * 1000);
    const sameDay = new Date(pickupDate);
    sameDay.setHours(9, 0, 0, 0); // 9 AM on pickup day

    // Schedule 24-hour reminder
    if (reminder24h > now) {
      await notificationQueue.add(
        'reminder-24h',
        {
          orderId: order.id,
          customerId: order.createdBy,
          type: 'reminder-24h',
          message: `Your order #${order.orderNo} is ready for pickup tomorrow at ${pickupDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        },
        {
          delay: reminder24h.getTime() - now.getTime(),
          jobId: `${orderId}-reminder-24h`,
        }
      );
      console.log(`Scheduled 24h reminder for order ${orderId} at ${reminder24h}`);
    }

    // Schedule 12-hour reminder
    if (reminder12h > now) {
      await notificationQueue.add(
        'reminder-12h',
        {
          orderId: order.id,
          customerId: order.createdBy,
          type: 'reminder-12h',
          message: `Don't forget! Your order #${order.orderNo} is ready for pickup in 12 hours`,
        },
        {
          delay: reminder12h.getTime() - now.getTime(),
          jobId: `${orderId}-reminder-12h`,
        }
      );
      console.log(`Scheduled 12h reminder for order ${orderId} at ${reminder12h}`);
    }

    // Schedule same-day reminder
    if (sameDay > now && sameDay < pickupDate) {
      await notificationQueue.add(
        'same-day',
        {
          orderId: order.id,
          customerId: order.createdBy,
          type: 'same-day',
          message: `Today is pickup day! Order #${order.orderNo} is ready at ${pickupDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        },
        {
          delay: sameDay.getTime() - now.getTime(),
          jobId: `${orderId}-same-day`,
        }
      );
      console.log(`Scheduled same-day reminder for order ${orderId} at ${sameDay}`);
    }

    return { success: true, orderId, scheduledCount: 3 };
  } catch (error) {
    console.error(`Failed to schedule notifications for order ${orderId}:`, error);
    throw error;
  }
}

// Cancel all scheduled notifications for an order
export async function cancelOrderNotifications(orderId: string) {
  try {
    const jobIds = [
      `${orderId}-reminder-24h`,
      `${orderId}-reminder-12h`,
      `${orderId}-same-day`,
    ];

    for (const jobId of jobIds) {
      const job = await notificationQueue.getJob(jobId);
      if (job) {
        await job.remove();
        console.log(`Removed notification job ${jobId}`);
      }
    }

    return { success: true, orderId, removedCount: jobIds.length };
  } catch (error) {
    console.error(`Failed to cancel notifications for order ${orderId}:`, error);
    throw error;
  }
}

// Event listeners for monitoring
notificationWorker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed successfully`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job?.id} failed:`, err.message);
});

console.log('📬 Notification queue and worker initialized');
