import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto, NotificationMessageDto } from '../dto/notification.dto';
import {
  buildSuccessResponse,
  buildErrorResponse,
  ResultCodes,
  SummaryFlush,
} from './../../../common';

@Injectable()
export class NotificationManager {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly summaryFlush: SummaryFlush,
  ) {}

  // ─── REST Handlers ────────────────────────────────────────────────

  async handleGetNotifications(req: Request, res: Response): Promise<void> {
    try {
      // แก้ทุกที่ที่รับจาก req.params
      const { userId } = req.params as { userId: string };

      const notifications = await this.notificationService.getNotificationsByUserId(userId);
      const unreadCount = await this.notificationService.getUnreadCount(userId);

      res.json(buildSuccessResponse({ notifications, unreadCount }));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleGetUnreadNotifications(req: Request, res: Response): Promise<void> {
    try {
      // แก้ทุกที่ที่รับจาก req.params
      const { userId } = req.params as { userId: string };
      const notifications = await this.notificationService.getUnreadNotifications(userId);

      res.json(buildSuccessResponse(notifications));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleCreateNotification(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateNotificationDto = req.body;
      const notification = await this.notificationService.createNotification(dto);

      res.status(201).json(buildSuccessResponse(notification, ResultCodes.CREATED));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleMarkAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const notification = await this.notificationService.markAsRead(id);

      res.json(buildSuccessResponse(notification));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleMarkAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params as { userId: string };
      await this.notificationService.markAllAsRead(userId);

      res.json(buildSuccessResponse(null));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleDeleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await this.notificationService.deleteNotification(id);

      res.json(buildSuccessResponse(null));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  // ─── Kafka Consumer Handler ────────────────────────────────────────

  async handleIncomingNotification(data: NotificationMessageDto): Promise<void> {
    try {
      await this.notificationService.processIncomingNotification(data);
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
    }
  }

  // ─── Private ──────────────────────────────────────────────────────

  private sendErrorResponse(res: Response, error: any): void {
    const status = error?.status ?? 500;
    const resultCode = error?.resultCode ?? ResultCodes.INTERNAL_ERROR;
    res.status(status).json(buildErrorResponse(resultCode, error?.message, status));
  }
}
