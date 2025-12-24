export declare class ReportService {
    static getDailyReport(date: string): Promise<{
        date: string;
        totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
        totalOrdersCompleted: number;
        avgTicketSize: number;
        paymentBreakdown: {
            status: import(".prisma/client").$Enums.PaymentStatus;
            count: number;
            totalValue: import("@prisma/client/runtime/library").Decimal | null;
            totalAdvance: import("@prisma/client/runtime/library").Decimal | null;
        }[];
    }>;
}
//# sourceMappingURL=reportService.d.ts.map