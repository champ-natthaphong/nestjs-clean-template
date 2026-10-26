import { NotFoundException } from '@nestjs/common';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';

import { Test } from '@nestjs/testing';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { NotificationRepository } from 'src/modules/notification/repositories/notification.repository';
import { NotificationStatus } from 'src/modules/notification/entities/notification.entity';
import { asyncMock } from '../../../../helpers/mock-fn';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockRepo = {
    findByUserId: asyncMock(),
    findUnreadByUserId: asyncMock(),
    countUnreadByUserId: asyncMock(),
    findById: asyncMock(),
    create: asyncMock(),
    markAsRead: asyncMock(),
    markAllAsReadByUserId: asyncMock(),
    deleteById: asyncMock(),
    updateStatus: asyncMock(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [NotificationService, { provide: NotificationRepository, useValue: mockRepo }],
    }).compile();

    service = module.get(NotificationService);
    jest.clearAllMocks();
  });

  describe('getNotificationsByUserId', () => {
    it('should return the user notifications', async () => {
      mockRepo.findByUserId.mockResolvedValue([{ id: '1' }]);

      const result = await service.getNotificationsByUserId('u1');

      expect(mockRepo.findByUserId).toHaveBeenCalledWith('u1');
      expect(result).toEqual([{ id: '1' }]);
    });

    it('should propagate repository errors', async () => {
      mockRepo.findByUserId.mockRejectedValue(new Error('DB error'));

      await expect(service.getNotificationsByUserId('u1')).rejects.toThrow('DB error');
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return the unread notifications', async () => {
      mockRepo.findUnreadByUserId.mockResolvedValue([{ id: '1', isRead: false }]);

      const result = await service.getUnreadNotifications('u1');

      expect(mockRepo.findUnreadByUserId).toHaveBeenCalledWith('u1');
      expect(result).toEqual([{ id: '1', isRead: false }]);
    });
  });

  describe('getUnreadCount', () => {
    it('should return the unread count', async () => {
      mockRepo.countUnreadByUserId.mockResolvedValue(3);

      const result = await service.getUnreadCount('u1');

      expect(mockRepo.countUnreadByUserId).toHaveBeenCalledWith('u1');
      expect(result).toBe(3);
    });
  });

  describe('getNotificationById', () => {
    it('should return the notification when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1' });

      const result = await service.getNotificationById('1');

      expect(result).toEqual({ id: '1' });
    });

    it('should throw NotFoundException when it does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.getNotificationById('x')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createNotification', () => {
    it('should create and return the notification', async () => {
      const dto = { userId: 'u1', title: 't', message: 'm' };
      mockRepo.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.createNotification(dto);

      expect(mockRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ id: '1', ...dto });
    });
  });

  describe('markAsRead', () => {
    it('should return the updated notification', async () => {
      mockRepo.markAsRead.mockResolvedValue({ id: '1', isRead: true });

      const result = await service.markAsRead('1');

      expect(mockRepo.markAsRead).toHaveBeenCalledWith('1');
      expect(result).toEqual({ id: '1', isRead: true });
    });

    it('should return null when the notification does not exist', async () => {
      mockRepo.markAsRead.mockResolvedValue(null);

      const result = await service.markAsRead('x');

      expect(result).toBeNull();
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications of the user as read', async () => {
      mockRepo.markAllAsReadByUserId.mockResolvedValue(undefined);

      await service.markAllAsRead('u1');

      expect(mockRepo.markAllAsReadByUserId).toHaveBeenCalledWith('u1');
    });
  });

  describe('deleteNotification', () => {
    it('should delete the notification when it exists', async () => {
      mockRepo.findById.mockResolvedValue({ id: '1' });
      mockRepo.deleteById.mockResolvedValue(undefined);

      await service.deleteNotification('1');

      expect(mockRepo.deleteById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException and not delete when it does not exist', async () => {
      mockRepo.findById.mockResolvedValue(null);

      await expect(service.deleteNotification('x')).rejects.toThrow(NotFoundException);
      expect(mockRepo.deleteById).not.toHaveBeenCalled();
    });
  });

  describe('processIncomingNotification', () => {
    const data = {
      userId: 'u1',
      title: 't',
      message: 'm',
      metadata: { source: 'kafka' },
      messageId: 'msg-1',
      timestamp: '2026-10-26T08:00:00.000Z',
    };

    it('should create the notification with message metadata and mark it SENT', async () => {
      mockRepo.create.mockResolvedValue({ id: '1' });
      mockRepo.updateStatus.mockResolvedValue({ id: '1', status: NotificationStatus.SENT });

      const result = await service.processIncomingNotification(data);

      expect(mockRepo.create).toHaveBeenCalledWith({
        userId: 'u1',
        title: 't',
        message: 'm',
        metadata: {
          source: 'kafka',
          messageId: 'msg-1',
          receivedAt: '2026-10-26T08:00:00.000Z',
        },
      });
      expect(mockRepo.updateStatus).toHaveBeenCalledWith('1', NotificationStatus.SENT);
      expect(result).toEqual({ id: '1' });
    });

    it('should not update the status when creation fails', async () => {
      mockRepo.create.mockRejectedValue(new Error('DB error'));

      await expect(service.processIncomingNotification(data)).rejects.toThrow('DB error');
      expect(mockRepo.updateStatus).not.toHaveBeenCalled();
    });
  });
});
