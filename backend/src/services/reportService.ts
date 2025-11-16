import { prisma } from '../lib/prisma';
import { PaymentStatus } from '@prisma/client';

export class ReportService {
  static async getDailyReport(date: string) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    // 1. Get aggregate for completed orders
    const salesData = await prisma.order.aggregate({
      where: {
        pickupAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: 'COMPLETED',
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
    });

    // 2. Get payment status breakdown for all orders on that day
    const paymentBreakdown = await prisma.order.groupBy({
      by: ['paymentStatus'],
      where: {
        pickupAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
        advanceAmount: true,
      },
    });

    const totalRevenue = salesData._sum.totalAmount || 0;
    const totalOrders = salesData._count.id || 0;
    const avgTicket = totalOrders > 0 ? Number(totalRevenue) / totalOrders : 0;

    return {
      date,
      totalRevenue: totalRevenue,
      totalOrdersCompleted: totalOrders,
      avgTicketSize: avgTicket,
      paymentBreakdown: paymentBreakdown.map((item) => ({
        status: item.paymentStatus,
        count: item._count.id,
        totalValue: item._sum.totalAmount,
        totalAdvance: item._sum.advanceAmount,
      })),
    };
  }
}