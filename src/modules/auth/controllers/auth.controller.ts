import { Controller, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { Req, Res, Body } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { AuthManager } from '../managers/auth.manager';
import { CustomRestInterceptor, CustomHttpEntryPoint, BasicAuthGuard } from '../../../common';
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
  @UseGuards(BasicAuthGuard)
  @CustomHttpEntryPoint('register')
  @Post('register')
  async register(@Body() dto: RegisterDto, @Res() res: Response) {
    await this.authManager.handleRegister(dto, res);
  }
  @ApiOperation({ summary: 'Login' })
  @ApiBody({ type: LoginDto })
  @Public()
  @UseGuards(BasicAuthGuard)
  @CustomHttpEntryPoint('login')
  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    await this.authManager.handleLogin(dto, res);
  }

  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @Public()
  @CustomHttpEntryPoint('refresh')
  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto, @Res() res: Response) {
    await this.authManager.handleRefresh(dto, res);
  }

  @ApiOperation({ summary: 'Logout' })
  @ApiBearerAuth()
  @CustomHttpEntryPoint('logout')
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response) {
    await this.authManager.handleLogout(req, res);
  }
}
