"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const authService_1 = require("../services/authService");
const auth_1 = require("../schemas/auth");
const router = (0, express_1.Router)();
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = auth_1.loginSchema.parse(req.body);
        const tokens = await authService_1.AuthService.login(email, password);
        res.json(tokens);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        if (error instanceof Error && error.message.includes('Invalid')) {
            return res.status(401).json({ error: error.message });
        }
        res.status(500).json({ error: 'Login failed' });
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = auth_1.refreshTokenSchema.parse(req.body);
        const tokens = await authService_1.AuthService.refresh(refreshToken);
        res.json(tokens);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.issues });
        }
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map