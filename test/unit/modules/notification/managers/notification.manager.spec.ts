import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { NotificationManager } from 'src/modules/notification/managers/notification.manager';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import { buildErrorResponse, buildSuccessResponse, ResultCodes, SummaryFlush } from 'src/common';
import { asyncMock } from '../../../../helpers/mock-fn';

describe('NotificationManager', () => {
  let manager: NotificationManager;

  const mockService = {
    getNotificationsByUserId: asyncMock(),
    getUnreadCount: asyncMock(),
    getUnreadNotifications: asyncMock(),
    createNotification: asyncMock(),
    markAsRead: asyncMock(),
    markAllAsRead: asyncMock(),
    deleteNotification: asyncMock(),
    processIncomingNotification: asyncMock(),
  };
  const mockFlush = { flush: asyncMock(), flushError: asyncMock() };

  const makeReq = (params: Record<string, string> = {}, body: unknown = {}) =>
    ({ params, body }) as unknown as Request;

  const makeRes = () => {
    const res = {
      json: jest.fn(),
      status: jest.fn(),
    };
    res.status.mockReturnValue(res);
    return res;
  };
  const asRes = (r: ReturnType<typeof makeRes>) => r as unknown as Response;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NotificationManager,
        { provide: NotificationService, useValue: mockService },
        { provide: SummaryFlush, useValue: mockFlush },
      ],
    }).compile();

    manager = module.get(NotificationManager);
    jest.clearAllMocks();
  });

  describe('handleGetNotifications', () => {
    it('should respond with notifications and unreadCount', async () => {
      const notifications = [{ id: '1' }];
      mockService.getNotificationsByUserId.mockResolvedValue(notifications);
      mockService.getUnreadCount.mockResolvedValue(1);
      const res = makeRes();

      await manager.handleGetNotifications(makeReq({ userId: 'u1' }), asRes(res));

      expect(mockService.getNotificationsByUserId).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(
        buildSuccessResponse({ notifications, unreadCount: 1 }),
      );
      expect(mockFlush.flush).toHaveBeenCalled();
    });

    it('should respond with the error status and flush the error', async () => {
      const error = Object.assign(new Error('boom'), { status: 404 });
      mockService.getNotificationsByUserId.mockRejectedValue(error);
      const res = makeRes();

      await manager.handleGetNotifications(makeReq({ userId: 'u1' }), asRes(res));

      expect(mockFlush.flushError).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        buildErrorResponse(ResultCodes.INTERNAL_ERROR, 'boom', 404),
      );
    });

    it('should fall back to 500 when the error has no status', async () => {
      mockService.getNotificationsByUserId.mockRejectedValue(new Error('boom'));
      const res = makeRes();

      await manager.handleGetNotifications(makeReq({ userId: 'u1' }), asRes(res));

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('handleGetUnreadNotifications', () => {
    it('should respond with unread notifications', async () => {
      mockService.getUnreadNotifications.mockResolvedValue([{ id: '1' }]);
      const res = makeRes();

      await manager.handleGetUnreadNotifications(makeReq({ userId: 'u1' }), asRes(res));

      expect(mockService.getUnreadNotifications).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse([{ id: '1' }]));
    });
  });

  describe('handleCreateNotification', () => {
    it('should respond 201 with CREATED code', async () => {
      const dto = { userId: 'u1', title: 't', message: 'm' };
      mockService.createNotification.mockResolvedValue({ id: '1', ...dto });
      const res = makeRes();

      await manager.handleCreateNotification(makeReq({}, dto), asRes(res));

      expect(mockService.createNotification).toHaveBeenCalledWith(dto);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        buildSuccessResponse({ id: '1', ...dto }, ResultCodes.CREATED),
      );
    });
  });

  describe('handleMarkAsRead', () => {
    it('should mark the notification as read', async () => {
      mockService.markAsRead.mockResolvedValue({ id: '1', isRead: true });
      const res = makeRes();

      await manager.handleMarkAsRead(makeReq({ id: '1' }), asRes(res));

      expect(mockService.markAsRead).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse({ id: '1', isRead: true }));
    });
  });

  describe('handleMarkAllAsRead', () => {
    it('should respond with null data', async () => {
      mockService.markAllAsRead.mockResolvedValue(undefined);
      const res = makeRes();

      await manager.handleMarkAllAsRead(makeReq({ userId: 'u1' }), asRes(res));

      expect(mockService.markAllAsRead).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse(null));
    });
  });

  describe('handleDeleteNotification', () => {
    it('should delete and respond with null data', async () => {
      mockService.deleteNotification.mockResolvedValue(undefined);
      const res = makeRes();

      await manager.handleDeleteNotification(makeReq({ id: '1' }), asRes(res));

      expect(mockService.deleteNotification).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse(null));
    });
  });

  describe('handleIncomingNotification (Kafka)', () => {
    const data = { userId: 'u1', title: 't', message: 'm' };

    it('should process the message and flush', async () => {
      mockService.processIncomingNotification.mockResolvedValue(undefined);

      await manager.handleIncomingNotification(data);

      expect(mockService.processIncomingNotification).toHaveBeenCalledWith(data);
      expect(mockFlush.flush).toHaveBeenCalled();
    });

    it('should swallow the error and call flushError', async () => {
      const error = new Error('fail');
      mockService.processIncomingNotification.mockRejectedValue(error);

      await expect(manager.handleIncomingNotification(data)).resolves.toBeUndefined();

      expect(mockFlush.flushError).toHaveBeenCalledWith(error);
    });
  });
});
