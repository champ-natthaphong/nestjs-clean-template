import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

@Injectable()
export class UserAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const requestedUserId = request.params.id;
    const currentUser = request.user;
    if (!currentUser?.id) {
      throw new ForbiddenException('User identity is missing');
    }

    // Admin สามารถเข้าถึงข้อมูลผู้ใช้รายอื่นได้
    if (currentUser.role === 'admin') {
      return true;
    }

    // User ทั่วไปเข้าถึงได้เฉพาะข้อมูลของตัวเอง
    if (currentUser.id !== requestedUserId) {
      throw new ForbiddenException('You do not have permission to access this user');
    }

    return true;
  }
}
