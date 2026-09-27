import { Controller, Post, UseInterceptors, Body } from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthManager } from '../managers/auth.manager';
import { CustomRestInterceptor, CustomHttpEntryPoint } from '../../../common';
import { Public } from '../../../common/decorators/public.decorator';
import { RefreshTokenDto } from '../dto/auth.dto';

@Controller('auth')
@UseInterceptors(CustomRestInterceptor)
export class AuthController {
  constructor(private readonly authManager: AuthManager) {}

  @Public()
  @CustomHttpEntryPoint('register')
  @Post('register')
  async register(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleRegister(req, res);
  }

  @Public()
  @CustomHttpEntryPoint('login')
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleLogin(req, res);
  }

  @Public()
  @CustomHttpEntryPoint('refresh')
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleRefresh(req, res);
  }

  @CustomHttpEntryPoint('logout')
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleLogout(req, res);
  }
}
