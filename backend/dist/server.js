"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const prisma_1 = require("./lib/prisma");
const auth_1 = require("./lib/auth");
// Import all your routes
const auth_2 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const orders_1 = __importDefault(require("./routes/orders"));
const reports_1 = __importDefault(require("./routes/reports"));
const devices_1 = __importDefault(require("./routes/devices"));
const notifications_1 = __importDefault(require("./routes/notifications"));
// Initialize notification queue and worker
require("./queues/notificationQueue");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// --- Public Routes ---
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Auth routes are public (login/refresh)
app.use('/api/auth', auth_2.default);
// --- Authenticated Routes ---
// All routes below this line require a valid token
app.use(auth_1.authenticate);
app.use('/api/users', users_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/reports', reports_1.default);
app.use('/api/devices', devices_1.default);
app.use('/api/notifications', notifications_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
    });
});
// Start server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    server.close(async () => {
        const { notificationQueue, notificationWorker } = await Promise.resolve().then(() => __importStar(require('./queues/notificationQueue')));
        const { redisConnection } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
        await notificationWorker.close();
        await notificationQueue.close();
        await redisConnection.quit();
        await prisma_1.prisma.$disconnect();
        console.log('Server closed');
        process.exit(0);
    });
});
process.on('SIGINT', async () => {
    console.log('SIGINT received, closing server...');
    server.close(async () => {
        const { notificationQueue, notificationWorker } = await Promise.resolve().then(() => __importStar(require('./queues/notificationQueue')));
        const { redisConnection } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
        await notificationWorker.close();
        await notificationQueue.close();
        await redisConnection.quit();
        await prisma_1.prisma.$disconnect();
        console.log('Server closed');
        process.exit(0);
    });
});
exports.default = app;
//# sourceMappingURL=server.js.map