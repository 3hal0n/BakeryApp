"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeviceSchema = void 0;
const zod_1 = require("zod");
exports.registerDeviceSchema = zod_1.z.object({
    platform: zod_1.z.enum(['ios', 'android']),
    token: zod_1.z.string().min(1, 'Token is required'),
});
//# sourceMappingURL=device.js.map