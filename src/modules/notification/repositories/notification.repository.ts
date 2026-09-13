import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../entities/notification.entity';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return this.repo.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<Notification | null> {
    await this.repo.update(id, { isRead: true, readAt: new Date() });
    return this.repo.findOne({ where: { id } });
  }

  async markAllAsReadByUserId(userId: string): Promise<void> {
    await this.repo.update({ userId, isRead: false }, { isRead: true, readAt: new Date() });
  }

  async updateStatus(id: string, status: NotificationStatus): Promise<Notification | null> {
    await this.repo.update(id, { status });
    return this.repo.findOne({ where: { id } });
  }

  async countUnreadByUserId(userId: string): Promise<number> {
    return this.repo.count({ where: { userId, isRead: false } });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
