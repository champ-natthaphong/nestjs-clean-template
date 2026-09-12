import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { NotificationManager } from '../managers/notification.manager';
import { AuthGuard, CustomHttpEntryPoint, CustomRestInterceptor } from '../../../common';

@Controller('notifications')
@UseGuards(AuthGuard)
@UseInterceptors(CustomRestInterceptor)
export class NotificationController {
  constructor(private readonly manager: NotificationManager) {}

  @CustomHttpEntryPoint('getNotifications')
  @Get('user/:userId')
  async getNotifications(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetNotifications(req, res);
  }

  @CustomHttpEntryPoint('getUnreadNotifications')
  @Get('user/:userId/unread')
  async getUnreadNotifications(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetUnreadNotifications(req, res);
  }

  @CustomHttpEntryPoint('createNotification')
  @Post()
  async createNotification(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleCreateNotification(req, res);
  }

  @CustomHttpEntryPoint('markAsRead')
  @Patch(':id/read')
  async markAsRead(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleMarkAsRead(req, res);
  }

  @CustomHttpEntryPoint('markAllAsRead')
  @Patch('user/:userId/read-all')
  async markAllAsRead(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleMarkAllAsRead(req, res);
  }

  @CustomHttpEntryPoint('deleteNotification')
  @Delete(':id')
  async deleteNotification(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleDeleteNotification(req, res);
  }
}
