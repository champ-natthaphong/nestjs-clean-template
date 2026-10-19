import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto } from '../dto/user.dto';
import {
  buildSuccessResponse,
  buildErrorResponse,
  ResultCodes,
  SummaryFlush,
} from '../../../common';

@Injectable()
export class UserManager {
  constructor(
    private readonly userService: UserService,
    private readonly summaryFlush: SummaryFlush,
  ) {}

  async handleGetAllUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.json(buildSuccessResponse(users));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleGetUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const user = await this.userService.getUserById(id);
      console.log({ user });

      res.json(buildSuccessResponse(user));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleGetUserWithNotifications(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const user = await this.userService.getUserWithNotifications(id);
      res.json(buildSuccessResponse(user));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleCreateUser(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateUserDto = req.body;
      const user = await this.userService.createUser(dto);
      res.status(201).json(buildSuccessResponse(user, ResultCodes.CREATED));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleUpdateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const dto: UpdateUserDto = req.body;
      const user = await this.userService.updateUser(id, dto);
      res.json(buildSuccessResponse(user));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  async handleDeleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      await this.userService.deleteUser(id);
      res.json(buildSuccessResponse(null));
      this.summaryFlush.flush();
    } catch (error) {
      this.summaryFlush.flushError(error);
      this.sendErrorResponse(res, error);
    }
  }

  // ─── Private ──────────────────────────────────────────────────────

  private sendErrorResponse(res: Response, error: any): void {
    const status = error?.status ?? 500;
    const resultCode = error?.resultCode ?? ResultCodes.INTERNAL_ERROR;
    res.status(status).json(buildErrorResponse(resultCode, error?.message, status));
  }
}
