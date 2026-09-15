import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity, NotificationStatus } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationRepo: Repository<NotificationEntity>,
  ) {}

  async create(data: Partial<NotificationEntity>): Promise<NotificationEntity> {
    const notification = this.notificationRepo.create(data);
    return this.notificationRepo.save(notification);
  }

  async findByUserId(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<NotificationEntity | null> {
    return this.notificationRepo.findOne({ where: { id } });
  }

  async findUnreadByUserId(userId: string): Promise<NotificationEntity[]> {
    return this.notificationRepo.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<NotificationEntity | null> {
    await this.notificationRepo.update(id, { isRead: true, readAt: new Date() });
    return this.notificationRepo.findOne({ where: { id } });
  }

  async markAllAsReadByUserId(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async updateStatus(id: string, status: NotificationStatus): Promise<NotificationEntity | null> {
    await this.notificationRepo.update(id, { status });
    return this.notificationRepo.findOne({ where: { id } });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.notificationRepo.count({ where: { userId, isRead: false } });
  }

  async deleteById(id: string): Promise<void> {
    await this.notificationRepo.delete(id);
  }
}
