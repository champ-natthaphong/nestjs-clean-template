import { NotFoundException } from '@nestjs/common';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { NotificationRepository } from 'src/modules/notification/repositories/notification.repository';
import { SystemLoggerService } from 'src/common';

describe('NotificationService', () => {
  let service: NotificationService;

  const mockRepo: Pick<NotificationRepository, 'findByUserId' | 'create' | 'markAsRead'> & {
    findByUserId: jest.MockedFunction<NotificationRepository['findByUserId']>;
    create: jest.MockedFunction<NotificationRepository['create']>;
    markAsRead: jest.MockedFunction<NotificationRepository['markAsRead']>;
  } = {
    findByUserId: jest.fn<NotificationRepository['findByUserId']>(),
    create: jest.fn<NotificationRepository['create']>(),
    markAsRead: jest.fn<NotificationRepository['markAsRead']>(),
  };
  const mockLogger = { info: jest.fn(), error: jest.fn() };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: NotificationRepository, useValue: mockRepo },
        { provide: SystemLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get(NotificationService);
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should return the user notifications', async () => {
      mockRepo.findByUserId.mockResolvedValue([
        { id: '1' } as Awaited<ReturnType<NotificationRepository['findByUserId']>>[number],
      ]);

      const result = await service.getNotifications('u1');

      expect(result).toEqual([{ id: '1' }]);
    });

    it('should propagate repository errors', async () => {
      mockRepo.findByUserId.mockRejectedValue(new Error('DB error'));

      await expect(service.getNotifications('u1')).rejects.toThrow('DB error');
    });
  });

  describe('markAsRead', () => {
    it('should mark the notification as read', async () => {
      mockRepo.markAsRead.mockResolvedValue({
        id: '1',
        isRead: true,
      } as NonNullable<Awaited<ReturnType<NotificationRepository['markAsRead']>>>);

      const result = await service.markAsRead('1');

      expect(result).toEqual(expect.objectContaining({ isRead: true }));
    });

    it('should throw NotFoundException when it does not exist', async () => {
      mockRepo.markAsRead.mockResolvedValue(null);

      await expect(service.markAsRead('x')).rejects.toThrow(NotFoundException);
    });
  });
});
