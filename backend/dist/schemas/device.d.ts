import { z } from 'zod';
export declare const registerDeviceSchema: z.ZodObject<{
    platform: z.ZodEnum<{
        ios: "ios";
        android: "android";
    }>;
    token: z.ZodString;
}, z.core.$strip>;
//# sourceMappingURL=device.d.ts.map