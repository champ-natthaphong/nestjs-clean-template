import {
  BadRequestException,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { IRequestContext } from './basic-auth.guard';

export const PLATFORMS = ['WEB', 'MOBILE', 'SOCKET'] as const;
export const ALLOWED_PLATFORMS_KEY = 'allowedPlatforms';
export type TPlatform = (typeof PLATFORMS)[number];

export const AllowedPlatforms = (...platforms: TPlatform[]) =>
  SetMetadata(ALLOWED_PLATFORMS_KEY, platforms);

type TRequestWithContext = Request & {
  appContext?: IRequestContext & { platform?: TPlatform };
};

@Injectable()
export class XPlatformGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<TRequestWithContext>();

    const header = req.headers['x-platform'];
    const raw = Array.isArray(header) ? header[0] : header;
    const platform = raw?.trim().toUpperCase();

    if (!platform) {
      throw new BadRequestException('HEADER_REQUIRED_PLATFORM');
    }

    const allowed = this.reflector.getAllAndOverride<TPlatform[] | undefined>(
      ALLOWED_PLATFORMS_KEY,
      [context.getHandler(), context.getClass()],
    ) ?? [...PLATFORMS];

    if (!allowed.includes(platform as TPlatform)) {
      throw new BadRequestException(`INVALID_VALUES: x-platform = [${allowed.join(', ')}]`);
    }

    // แทนที่ Object.assign(store, { platform })
    req.appContext = {
      ...(req.appContext ?? {
        language: 'EN',
        protocol: req.protocol,
        host: req.headers.host ?? '',
      }),
      platform: platform as TPlatform,
    };
    return true;
  }
}

export const CurrentPlatform = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TPlatform | undefined =>
    ctx.switchToHttp().getRequest<TRequestWithContext>().appContext?.platform,
);
