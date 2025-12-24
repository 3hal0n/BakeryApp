export declare class DeviceService {
    static registerToken(userId: string, platform: string, token: string): Promise<{
        id: string;
        userId: string;
        platform: string;
        token: string;
        lastSeenAt: Date;
    }>;
}
//# sourceMappingURL=deviceService.d.ts.map