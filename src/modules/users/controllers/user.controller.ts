import { Controller, Get, Post, Put, Delete, UseGuards, UseInterceptors } from '@nestjs/common';
import { Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserManager } from '../managers/user.manager';
import {
  CustomRestInterceptor,
  CustomHttpEntryPoint,
  RolesGuard,
  JwtAuthGuard,
  Roles,
  BasicAuthGuard,
} from '../../../common';
import { UserAccessGuard } from '../guards/user-access.guard';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CustomRestInterceptor)
export class UserController {
  constructor(private readonly manager: UserManager) {}

  @ApiOperation({ summary: 'Get all users (admin only)' })
  @Roles('admin')
  @CustomHttpEntryPoint('getAllUsers')
  @Get()
  async getAllUsers(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetAllUsers(req, res);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @UseGuards(BasicAuthGuard, UserAccessGuard)
  @CustomHttpEntryPoint('getUserById')
  @Get(':id')
  async getUserById(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetUserById(req, res);
  }

  @ApiOperation({ summary: 'Get user with notifications' })
  @UseGuards(UserAccessGuard)
  @CustomHttpEntryPoint('getUserWithNotifications')
  @Get(':id/notifications')
  async getUserWithNotifications(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleGetUserWithNotifications(req, res);
  }

  // @ApiOperation({ summary: 'Create user' })
  // @CustomHttpEntryPoint('createUser')
  // @Post()
  // async createUser(@Req() req: Request, @Res() res: Response) {
  //   await this.manager.handleCreateUser(req, res);
  // }

  @ApiOperation({ summary: 'Update user' })
  @CustomHttpEntryPoint('updateUser')
  @Put(':id')
  async updateUser(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleUpdateUser(req, res);
  }

  @ApiOperation({ summary: 'Delete user' })
  @CustomHttpEntryPoint('deleteUser')
  @Delete(':id')
  async deleteUser(@Req() req: Request, @Res() res: Response) {
    await this.manager.handleDeleteUser(req, res);
  }
}
