import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthManager } from '../managers/auth.manager';
import { CustomRestInterceptor, CustomHttpEntryPoint } from '../../../common';
import { Public } from '../../../common/decorators/public.decorator';

@Controller('auth')
@UseInterceptors(CustomRestInterceptor)
export class AuthController {
  constructor(private readonly manager: AuthManager) {}

  @Public()
  @CustomHttpEntryPoint('register')
  @Post('register')
  async register(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleRegister(req, res);
  }

  @Public()
  @CustomHttpEntryPoint('login')
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleLogin(req, res);
  }
}
