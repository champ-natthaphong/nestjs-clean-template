import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!this.isValidCredentials(username, password)) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Attach user info to request for downstream use
    (request as any).user = { username };
    return true;
  }

  private isValidCredentials(username: string, password: string): boolean {
    const validUsername = process.env.BASIC_AUTH_USERNAME ?? 'admin';
    const validPassword = process.env.BASIC_AUTH_PASSWORD ?? 'secret';
    return username === validUsername && password === validPassword;
  }
}
