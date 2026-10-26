import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import { jest, describe, beforeEach, it, expect, beforeAll, afterAll } from '@jest/globals';
import { NotificationController } from 'src/modules/notification/controllers/notification.controller';
import { NotificationManager } from 'src/modules/notification/managers/notification.manager';
import { NotificationService } from 'src/modules/notification/services/notification.service';
import {
  AuthGuard,
  buildErrorResponse,
  buildSuccessResponse,
  CustomRestInterceptor,
  ResultCodes,
  SummaryFlush,
} from 'src/common';

// ทำให้ค่าที่คาดหวังผ่าน JSON เหมือนที่ถูกส่งออกจริง
const json = (v: unknown) => JSON.parse(JSON.stringify(v));

describe('NotificationController (e2e)', () => {
  let app: INestApplication;

  const mockService = {
    getNotificationsByUserId: jest.fn(),
    getUnreadCount: jest.fn(),
    getUnreadNotifications: jest.fn(),
    createNotification: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    deleteNotification: jest.fn(),
  };
  const mockFlush = { flush: jest.fn(), flushError: jest.fn() };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        NotificationManager,
        { provide: NotificationService, useValue: mockService },
        { provide: SummaryFlush, useValue: mockFlush },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideInterceptor(CustomRestInterceptor)
      .useValue({ intercept: (_ctx: unknown, next: { handle: () => unknown }) => next.handle() })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /notifications/user/:userId', () => {
    it('should return 200 with notifications and unreadCount', async () => {
      const notifications = [{ id: '1', userId: 'u1' }];
      mockService.getNotificationsByUserId.mockResolvedValue(notifications);
      mockService.getUnreadCount.mockResolvedValue(1);

      const res = await request(app.getHttpServer()).get('/notifications/user/u1');

      expect(res.status).toBe(200);
      expect(mockService.getNotificationsByUserId).toHaveBeenCalledWith('u1');
      expect(res.body).toEqual(json(buildSuccessResponse({ notifications, unreadCount: 1 })));
    });

    it('should return the error status when the service fails', async () => {
      mockService.getNotificationsByUserId.mockRejectedValue(
        Object.assign(new Error('Not found'), { status: 404 }),
      );

      const res = await request(app.getHttpServer()).get('/notifications/user/u1');

      expect(res.status).toBe(404);
      expect(res.body).toEqual(
        json(buildErrorResponse(ResultCodes.INTERNAL_ERROR, 'Not found', 404)),
      );
    });

    it('should return 500 when the error has no status', async () => {
      mockService.getNotificationsByUserId.mockRejectedValue(new Error('boom'));

      const res = await request(app.getHttpServer()).get('/notifications/user/u1');

      expect(res.status).toBe(500);
    });
  });

  describe('GET /notifications/user/:userId/unread', () => {
    it('should return 200 with unread notifications', async () => {
      mockService.getUnreadNotifications.mockResolvedValue([{ id: '1' }]);

      const res = await request(app.getHttpServer()).get('/notifications/user/u1/unread');

      expect(res.status).toBe(200);
      expect(mockService.getUnreadNotifications).toHaveBeenCalledWith('u1');
    });
  });

  describe('POST /notifications', () => {
    it('should return 201 and pass the body to the service', async () => {
      const dto = { userId: 'u1', title: 't', message: 'm' };
      mockService.createNotification.mockResolvedValue({ id: '1', ...dto });

      const res = await request(app.getHttpServer()).post('/notifications').send(dto);

      expect(res.status).toBe(201);
      expect(mockService.createNotification).toHaveBeenCalledWith(dto);
      expect(res.body).toEqual(
        json(buildSuccessResponse({ id: '1', ...dto }, ResultCodes.CREATED)),
      );
    });
  });

  describe('PATCH /notifications/:id/read', () => {
    it('should return 200 when marked as read', async () => {
      mockService.markAsRead.mockResolvedValue({ id: '1', isRead: true });

      const res = await request(app.getHttpServer()).patch('/notifications/1/read');

      expect(res.status).toBe(200);
      expect(mockService.markAsRead).toHaveBeenCalledWith('1');
    });
  });

  describe('PATCH /notifications/user/:userId/read-all', () => {
    it('should return 200 when all are marked as read', async () => {
      mockService.markAllAsRead.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).patch('/notifications/user/u1/read-all');

      expect(res.status).toBe(200);
      expect(mockService.markAllAsRead).toHaveBeenCalledWith('u1');
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should return 200 when deleted', async () => {
      mockService.deleteNotification.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).delete('/notifications/1');

      expect(res.status).toBe(200);
      expect(mockService.deleteNotification).toHaveBeenCalledWith('1');
    });
  });
});
