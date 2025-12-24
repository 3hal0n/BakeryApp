"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// Daily Sales Report
router.get('/daily-sales', async (req, res) => {
    try {
        const { from, to } = req.query;
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = to ? new Date(to) : new Date();
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        const orders = await prisma_1.prisma.order.findMany({
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                },
                status: {
                    not: 'CANCELLED',
                },
            },
            select: {
                id: true,
                orderNo: true,
                totalAmount: true,
                paymentStatus: true,
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        const dailySales = {};
        orders.forEach((order) => {
            const date = order.createdAt.toISOString().split('T')[0];
            if (!dailySales[date]) {
                dailySales[date] = {
                    date,
                    totalSales: 0,
                    orderCount: 0,
                    paidAmount: 0,
                    unpaidAmount: 0,
                };
            }
            const amount = parseFloat(order.totalAmount.toString());
            dailySales[date].totalSales += amount;
            dailySales[date].orderCount += 1;
            if (order.paymentStatus === 'PAID') {
                dailySales[date].paidAmount += amount;
            }
            else {
                dailySales[date].unpaidAmount += amount;
            }
        });
        const result = Object.values(dailySales);
        const summary = {
            totalRevenue: result.reduce((sum, day) => sum + day.totalSales, 0),
            totalOrders: result.reduce((sum, day) => sum + day.orderCount, 0),
            totalPaid: result.reduce((sum, day) => sum + day.paidAmount, 0),
            totalUnpaid: result.reduce((sum, day) => sum + day.unpaidAmount, 0),
            averageDailySales: result.length > 0 ? result.reduce((sum, day) => sum + day.totalSales, 0) / result.length : 0,
            dateRange: {
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
            },
        };
        res.json({
            summary,
            dailyData: result,
        });
    }
    catch (error) {
        console.error('Daily sales report error:', error);
        res.status(500).json({ error: 'Failed to generate daily sales report' });
    }
});
// Popular Items Report
router.get('/popular-items', async (req, res) => {
    try {
        const { from, to, limit = '10' } = req.query;
        const fromDate = from ? new Date(from) : new Date(new Date().setDate(new Date().getDate() - 30));
        const toDate = to ? new Date(to) : new Date();
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);
        const orders = await prisma_1.prisma.order.findMany({
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                },
                status: {
                    not: 'CANCELLED',
                },
            },
            include: {
                items: true,
            },
        });
        const itemStats = {};
        orders.forEach((order) => {
            order.items.forEach((item) => {
                if (!itemStats[item.itemName]) {
                    itemStats[item.itemName] = {
                        itemName: item.itemName,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        orderCount: 0,
                    };
                }
                itemStats[item.itemName].totalQuantity += parseFloat(item.qty.toString());
                itemStats[item.itemName].totalRevenue += parseFloat(item.unitPrice.toString()) * parseFloat(item.qty.toString());
                itemStats[item.itemName].orderCount += 1;
            });
        });
        const popularItems = Object.values(itemStats)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, parseInt(limit));
        const summary = {
            totalItems: Object.keys(itemStats).length,
            totalQuantitySold: popularItems.reduce((sum, item) => sum + item.totalQuantity, 0),
            totalRevenue: popularItems.reduce((sum, item) => sum + item.totalRevenue, 0),
            dateRange: {
                from: fromDate.toISOString(),
                to: toDate.toISOString(),
            },
        };
        res.json({
            summary,
            items: popularItems,
        });
    }
    catch (error) {
        console.error('Popular items report error:', error);
        res.status(500).json({ error: 'Failed to generate popular items report' });
    }
});
// Pending Orders Report
router.get('/pending-orders', async (req, res) => {
    try {
        const pendingOrders = await prisma_1.prisma.order.findMany({
            where: {
                status: {
                    in: ['PENDING', 'READY'],
                },
            },
            include: {
                items: true,
                creator: {
                    select: {
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                pickupAt: 'asc',
            },
        });
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const overdue = pendingOrders.filter((o) => new Date(o.pickupAt) < now && o.status === 'PENDING');
        const todayOrders = pendingOrders.filter((o) => {
            const pickup = new Date(o.pickupAt);
            return pickup >= today && pickup < tomorrow;
        });
        const upcomingOrders = pendingOrders.filter((o) => new Date(o.pickupAt) >= tomorrow);
        const paymentSummary = {
            paid: pendingOrders.filter((o) => o.paymentStatus === 'PAID').length,
            advance: pendingOrders.filter((o) => o.paymentStatus === 'ADVANCE').length,
            unpaid: pendingOrders.filter((o) => o.paymentStatus === 'UNPAID').length,
        };
        const statusSummary = {
            pending: pendingOrders.filter((o) => o.status === 'PENDING').length,
            ready: pendingOrders.filter((o) => o.status === 'READY').length,
        };
        const totalPendingRevenue = pendingOrders.reduce((sum, order) => {
            return sum + parseFloat(order.totalAmount.toString());
        }, 0);
        const totalAdvanceReceived = pendingOrders
            .filter((o) => o.paymentStatus === 'ADVANCE')
            .reduce((sum, order) => sum + parseFloat(order.advanceAmount.toString()), 0);
        const summary = {
            totalPendingOrders: pendingOrders.length,
            overdueCount: overdue.length,
            todayCount: todayOrders.length,
            upcomingCount: upcomingOrders.length,
            totalPendingRevenue,
            totalAdvanceReceived,
            expectedBalance: totalPendingRevenue - totalAdvanceReceived,
            paymentSummary,
            statusSummary,
        };
        res.json({
            summary,
            overdue,
            today: todayOrders,
            upcoming: upcomingOrders,
        });
    }
    catch (error) {
        console.error('Pending orders report error:', error);
        res.status(500).json({ error: 'Failed to generate pending orders report' });
    }
});
// Dashboard Summary
router.get('/dashboard-summary', async (req, res) => {
    try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const todayOrders = await prisma_1.prisma.order.count({
            where: {
                createdAt: { gte: today },
                status: { not: 'CANCELLED' },
            },
        });
        const todayRevenue = await prisma_1.prisma.order.aggregate({
            where: {
                createdAt: { gte: today },
                status: { not: 'CANCELLED' },
            },
            _sum: { totalAmount: true },
        });
        const yesterdayOrders = await prisma_1.prisma.order.count({
            where: {
                createdAt: { gte: yesterday, lt: today },
                status: { not: 'CANCELLED' },
            },
        });
        const yesterdayRevenue = await prisma_1.prisma.order.aggregate({
            where: {
                createdAt: { gte: yesterday, lt: today },
                status: { not: 'CANCELLED' },
            },
            _sum: { totalAmount: true },
        });
        const thisMonthOrders = await prisma_1.prisma.order.count({
            where: {
                createdAt: { gte: thisMonth },
                status: { not: 'CANCELLED' },
            },
        });
        const thisMonthRevenue = await prisma_1.prisma.order.aggregate({
            where: {
                createdAt: { gte: thisMonth },
                status: { not: 'CANCELLED' },
            },
            _sum: { totalAmount: true },
        });
        const lastMonthOrders = await prisma_1.prisma.order.count({
            where: {
                createdAt: { gte: lastMonth, lt: thisMonth },
                status: { not: 'CANCELLED' },
            },
        });
        const lastMonthRevenue = await prisma_1.prisma.order.aggregate({
            where: {
                createdAt: { gte: lastMonth, lt: thisMonth },
                status: { not: 'CANCELLED' },
            },
            _sum: { totalAmount: true },
        });
        const pendingOrdersCount = await prisma_1.prisma.order.count({
            where: { status: { in: ['PENDING', 'READY'] } },
        });
        const statusBreakdown = await prisma_1.prisma.order.groupBy({
            by: ['status'],
            where: {
                createdAt: { gte: thisMonth },
            },
            _count: { status: true },
        });
        res.json({
            today: {
                orders: todayOrders,
                revenue: parseFloat(todayRevenue._sum.totalAmount?.toString() || '0'),
                ordersChange: yesterdayOrders > 0 ? ((todayOrders - yesterdayOrders) / yesterdayOrders * 100) : 0,
                revenueChange: parseFloat(yesterdayRevenue._sum.totalAmount?.toString() || '0') > 0
                    ? ((parseFloat(todayRevenue._sum.totalAmount?.toString() || '0') - parseFloat(yesterdayRevenue._sum.totalAmount?.toString() || '0')) / parseFloat(yesterdayRevenue._sum.totalAmount?.toString() || '0') * 100)
                    : 0,
            },
            month: {
                orders: thisMonthOrders,
                revenue: parseFloat(thisMonthRevenue._sum.totalAmount?.toString() || '0'),
                ordersChange: lastMonthOrders > 0 ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders * 100) : 0,
                revenueChange: parseFloat(lastMonthRevenue._sum.totalAmount?.toString() || '0') > 0
                    ? ((parseFloat(thisMonthRevenue._sum.totalAmount?.toString() || '0') - parseFloat(lastMonthRevenue._sum.totalAmount?.toString() || '0')) / parseFloat(lastMonthRevenue._sum.totalAmount?.toString() || '0') * 100)
                    : 0,
            },
            pending: {
                count: pendingOrdersCount,
            },
            statusBreakdown: statusBreakdown.map((s) => ({
                status: s.status,
                count: s._count.status,
            })),
        });
    }
    catch (error) {
        console.error('Dashboard summary error:', error);
        res.status(500).json({ error: 'Failed to generate dashboard summary' });
    }
});
exports.default = router;
//# sourceMappingURL=reports.js.map