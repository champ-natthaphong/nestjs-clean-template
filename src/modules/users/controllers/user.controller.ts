import { Controller, Get, Post, Put, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { UserManager } from '../managers/user.manager';
import {
  CustomRestInterceptor,
  CustomHttpEntryPoint,
  RolesGuard,
  JwtAuthGuard,
  Roles,
} from '../../../common';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CustomRestInterceptor)
export class UserController {
  constructor(private readonly manager: UserManager) {}

  @Roles('admin')
  @CustomHttpEntryPoint('getAllUsers')
  @Get()
  async getAllUsers(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetAllUsers(req, res);
  }

  @CustomHttpEntryPoint('getUserById')
  @Get(':id')
  async getUserById(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetUserById(req, res);
  }

  @CustomHttpEntryPoint('getUserWithNotifications')
  @Get(':id/notifications')
  async getUserWithNotifications(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetUserWithNotifications(req, res);
  }

  @CustomHttpEntryPoint('createUser')
  @Post()
  async createUser(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleCreateUser(req, res);
  }

  @CustomHttpEntryPoint('updateUser')
  @Put(':id')
  async updateUser(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleUpdateUser(req, res);
  }

  @CustomHttpEntryPoint('deleteUser')
  @Delete(':id')
  async deleteUser(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleDeleteUser(req, res);
  }
}
