import {
  BadRequestException,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { ConfigService } from '../config/config.service';
export interface IRequestContext {
  language: string;
  protocol: string;
  host: string;
}

type RequestWithContext = Request & { appContext?: IRequestContext };

const sha256 = (value: string) => createHash('sha256').update(value).digest();
const safeEqual = (a: string, b: string) => timingSafeEqual(sha256(a), sha256(b));

function parseBasicAuth(header?: string): { name: string; pass: string } | null {
  if (!header?.startsWith('Basic ')) return null;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const index = decoded.indexOf(':');
  if (index < 0) return null;
  return { name: decoded.slice(0, index), pass: decoded.slice(index + 1) };
}

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestWithContext>();
    const res = http.getResponse<Response>();

    const acceptLanguage = req.headers['accept-language'];
    if (!acceptLanguage) {
      throw new BadRequestException('Missing required header: accept-language');
    }

    const credentials = parseBasicAuth(req.headers.authorization);
    const username = this.configService.getOrThrow<string>('BASIC_AUTH_USERNAME');
    const password = this.configService.getOrThrow<string>('BASIC_AUTH_PASSWORD');
    console.log({ credentials, username, password });

    if (
      !credentials ||
      !safeEqual(credentials.name, username) ||
      !safeEqual(credentials.pass, password)
    ) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
      throw new UnauthorizedException('BASIC_AUTH_FAIL');
    }

    req.appContext = {
      language: acceptLanguage.split(',')[0].trim(),
      protocol: (req.headers['x-forwarded-proto'] as string) ?? req.protocol,
      host: req.headers.host ?? '',
    };
    return true;
  }
}

export const AppContext = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): IRequestContext | undefined =>
    ctx.switchToHttp().getRequest<RequestWithContext>().appContext,
);
