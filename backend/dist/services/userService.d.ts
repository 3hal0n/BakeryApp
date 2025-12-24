import { User } from '@prisma/client';
export declare class UserService {
    static createUser(data: any): Promise<Omit<User, 'passwordHash'>>;
    static getMe(userId: string): Promise<Omit<User, 'passwordHash'> | null>;
}
//# sourceMappingURL=userService.d.ts.map