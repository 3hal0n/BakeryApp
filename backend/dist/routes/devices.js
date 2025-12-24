"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const device_1 = require("../schemas/device");
const deviceService_1 = require("../services/deviceService");
const router = (0, express_1.Router)();
// POST /api/devices/token
router.post('/token', async (req, res) => {
    try {
        const { platform, token } = device_1.registerDeviceSchema.parse(req.body);
        await deviceService_1.DeviceService.registerToken(req.user.userId, platform, token);
        res.status(200).json({ message: 'Token registered successfully' });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to register token' });
    }
});
exports.default = router;
//# sourceMappingURL=devices.js.map