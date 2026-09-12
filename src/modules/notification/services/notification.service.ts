// src/modules/notification/services/notification.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationStatus } from '../../../../generated/prisma'; // ← เปลี่ยน
import { NotificationRepository } from '../repositories/notification.repository';
import { CreateNotificationDto, NotificationMessageDto } from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private readonly notificationRepository: NotificationRepository) {}

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findByUserId(userId);
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.findUnreadByUserId(userId);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.countUnreadByUserId(userId);
  }

  async getNotificationById(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
    return notification;
  }

  async createNotification(dto: CreateNotificationDto): Promise<Notification> {
    return this.notificationRepository.create(dto);
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.markAllAsReadByUserId(userId);
  }

  async deleteNotification(id: string): Promise<void> {
    await this.getNotificationById(id);
    await this.notificationRepository.deleteById(id);
  }

  async processIncomingNotification(data: NotificationMessageDto): Promise<Notification> {
    const notification = await this.notificationRepository.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      metadata: { ...data.metadata, messageId: data.messageId, receivedAt: data.timestamp },
    });
    await this.notificationRepository.updateStatus(notification.id, NotificationStatus.SENT);
    return notification;
  }
}
