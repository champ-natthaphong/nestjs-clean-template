import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Notification, NotificationStatus } from '../../../../generated/prisma';
@Injectable()
export class NotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    metadata?: any;
  }): Promise<Notification> {
    return this.prisma.notification.create({ data });
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsReadByUserId(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async updateStatus(id: string, status: NotificationStatus): Promise<Notification> {
    return this.prisma.notification.update({
      where: { id },
      data: { status },
    });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.notification.delete({ where: { id } });
  }
}
