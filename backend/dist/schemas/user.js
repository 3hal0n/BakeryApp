"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    email: zod_1.z.string().email('Invalid email address'),
    phone: zod_1.z.string().optional(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    role: zod_1.z.nativeEnum(client_1.UserRole),
});
//# sourceMappingURL=user.js.map