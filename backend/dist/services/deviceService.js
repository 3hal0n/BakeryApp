"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceService = void 0;
const prisma_1 = require("../lib/prisma");
class DeviceService {
    static async registerToken(userId, platform, token) {
        // Find if this token already exists in the database
        const existingToken = await prisma_1.prisma.deviceToken.findFirst({
            where: { token: token },
        });
        if (existingToken) {
            // Token exists, update its user and lastSeenAt
            return prisma_1.prisma.deviceToken.update({
                where: {
                    id: existingToken.id, // Use the unique 'id' to update
                },
                data: {
                    userId,
                    platform,
                    lastSeenAt: new Date(),
                },
            });
        }
        else {
            // Token doesn't exist, create a new record
            return prisma_1.prisma.deviceToken.create({
                data: {
                    userId,
                    platform,
                    token,
                    lastSeenAt: new Date(),
                },
            });
        }
    }
}
exports.DeviceService = DeviceService;
//# sourceMappingURL=deviceService.js.map