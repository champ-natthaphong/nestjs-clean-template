// src/modules/notification/dto/notification.dto.ts
import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { NotificationType } from '../../../../generated/prisma';

export class CreateNotificationDto {
  @IsString()
  userId!: string;

  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateNotificationDto {
  @IsOptional()
  isRead?: boolean;
}

export class NotificationMessageDto {
  userId!: string;
  title!: string;
  message!: string;
  type?: NotificationType;
  metadata?: Record<string, any>;
  messageId?: string;
  timestamp?: string;
}
