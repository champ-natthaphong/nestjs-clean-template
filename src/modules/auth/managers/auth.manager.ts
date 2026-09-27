import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto } from '../dto/auth.dto';
import {
  buildSuccessResponse,
  buildErrorResponse,
  ResultCodes,
  SummaryFlush,
} from '../../../common';

@Injectable()
export class AuthManager {
  constructor(
    private readonly authService: AuthService,
    private readonly summaryFlush: SummaryFlush,
  ) {}

  async handleRegister(req: Request, res: Response): Promise<void> {
    try {
      const dto: RegisterDto = req.body;
      const result = await this.authService.register(dto);
      res.status(201).json(buildSuccessResponse(result, ResultCodes.CREATED));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleLogin(req: Request, res: Response): Promise<void> {
    try {
      const dto: LoginDto = req.body;
      const result = await this.authService.login(dto);
      res.json(buildSuccessResponse(result));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }
  async handleRefresh(req: Request, res: Response): Promise<void> {
    try {
      const dto: RefreshTokenDto = req.body;
      const result = await this.authService.refresh(dto);
      res.json(buildSuccessResponse(result));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleLogout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      await this.authService.logout(userId);
      res.json(buildSuccessResponse(null));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  private sendErrorResponse(res: Response, error: any): void {
    const status = error?.status ?? 500;
    const resultCode = error?.resultCode ?? ResultCodes.INTERNAL_ERROR;
    res.status(status).json(buildErrorResponse(resultCode, error?.message, status));
  }
}
