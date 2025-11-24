/**
 * Notification Testing Utility
 * 
 * Use this script to test push notifications by sending test notifications
 * to all registered devices or specific users.
 */

import { prisma } from '../src/lib/prisma';
import { notificationQueue } from '../src/queues/notificationQueue';

async function sendTestNotification() {
  try {
    // Get all users with push tokens
    const users = await prisma.user.findMany({
      where: {
        pushToken: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        pushToken: true,
      },
    });

    if (users.length === 0) {
      console.log('❌ No users with push tokens found');
      return;
    }

    console.log(`📱 Found ${users.length} user(s) with push tokens`);

    // Send test notification to each user
    for (const user of users) {
      console.log(`\n📤 Sending test notification to ${user.name}...`);
      
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          title: '🧁 Test Notification',
          message: 'This is a test notification from BakeryApp! If you see this, push notifications are working correctly.',
          type: 'TEST',
          read: false,
        },
      });

      // Queue immediate push notification
      await notificationQueue.add('send-push', {
        userId: user.id,
        title: notification.title,
        message: notification.message,
        data: {
          notificationId: notification.id,
          type: 'TEST',
        },
      });

      console.log(`✅ Test notification queued for ${user.name}`);
    }

    console.log('\n✨ All test notifications sent successfully!');
    console.log('💡 Check your mobile device for notifications.');
    
  } catch (error) {
    console.error('❌ Error sending test notification:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

// Run the test
sendTestNotification();
