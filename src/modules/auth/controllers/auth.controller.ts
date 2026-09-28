import { Controller, Post, UseInterceptors } from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthManager } from '../managers/auth.manager';
import { CustomRestInterceptor, CustomHttpEntryPoint } from '../../../common';
import { Public } from '../../../common/decorators/public.decorator';
import { LoginDto, RegisterDto, RefreshTokenDto } from '../dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
@UseInterceptors(CustomRestInterceptor)
export class AuthController {
  constructor(private readonly authManager: AuthManager) {}

  @ApiOperation({ summary: 'Register new user' })
  @ApiBody({ type: RegisterDto })
  @Public()
  @CustomHttpEntryPoint('register')
  @Post('register')
  async register(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleRegister(req, res);
  }

  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @Public()
  @CustomHttpEntryPoint('login')
  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleLogin(req, res);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @Public()
  @CustomHttpEntryPoint('refresh')
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleRefresh(req, res);
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @CustomHttpEntryPoint('logout')
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleLogout(req, res);
  }
}
