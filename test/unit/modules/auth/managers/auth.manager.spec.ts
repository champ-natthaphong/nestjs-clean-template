import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import { AuthManager } from 'src/modules/auth/managers/auth.manager';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { buildErrorResponse, buildSuccessResponse, ResultCodes, SummaryFlush } from 'src/common';
import { asyncMock } from '../../../../helpers/mock-fn';

describe('AuthManager', () => {
  let manager: AuthManager;

  const mockService = {
    register: asyncMock(),
    login: asyncMock(),
    refresh: asyncMock(),
    logout: asyncMock(),
  };
  const mockFlush = { flush: jest.fn(), flushError: jest.fn() };

  const makeRes = () => {
    const res = {
      json: jest.fn<(body: unknown) => unknown>(),
      status: jest.fn<(code: number) => unknown>(),
    };
    res.status.mockReturnValue(res);
    return res;
  };
  const asRes = (r: ReturnType<typeof makeRes>) => r as unknown as Response;

  const authResult = {
    accessToken: 'a',
    refreshToken: 'r',
    user: {
      id: 'u1',
      firstName: 'natthaphong',
      lastName: 'thammabut',
      email: 'champ@example.com',
      role: 'user',
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthManager,
        { provide: AuthService, useValue: mockService },
        { provide: SummaryFlush, useValue: mockFlush },
      ],
    }).compile();

    manager = module.get(AuthManager);
    jest.resetAllMocks();
  });

  describe('handleRegister', () => {
    const dto = {
      firstName: 'natthaphong',
      lastName: 'thammabut',
      email: 'champ@exaple.com',
      password: 'Password123!',
    };

    it('should respond 201 with the CREATED code', async () => {
      mockService.register.mockResolvedValue(authResult);
      const res = makeRes();
      await manager.handleRegister(dto, asRes(res));

      expect(mockService.register).toHaveBeenCalledWith(dto);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse(authResult, ResultCodes.CREATED));
      expect(mockFlush.flush).toHaveBeenCalled();
    });

    it('should respond 409 when the email already exists', async () => {
      const error = new ConflictException('Email c@e.com already exists');
      mockService.register.mockRejectedValue(error);
      const res = makeRes();
      await manager.handleRegister(dto, asRes(res));

      expect(mockFlush.flushError).toHaveBeenCalledWith(error);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        buildErrorResponse(ResultCodes.INTERNAL_ERROR, error.message, 409),
      );
    });
  });

  describe('handleLogin', () => {
    const dto = { email: 'champ@example.com', password: 'Password123!' };

    it('should respond with the auth result', async () => {
      mockService.login.mockResolvedValue(authResult);
      const res = makeRes();
      await manager.handleLogin(dto, asRes(res));

      expect(mockService.login).toHaveBeenCalledWith(dto);
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse(authResult));
      expect(mockFlush.flush).toHaveBeenCalled();
    });

    it('should respond 401 when the credentials are invalid', async () => {
      mockService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));
      const res = makeRes();
      await manager.handleLogin(dto, asRes(res));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(mockFlush.flushError).toHaveBeenCalled();
    });
  });

  describe('handleRefresh', () => {
    const dto = { refreshToken: 'token' };

    it('should respond with the new tokens', async () => {
      mockService.refresh.mockResolvedValue(authResult);
      const res = makeRes();
      await manager.handleRefresh(dto, asRes(res));

      expect(mockService.refresh).toHaveBeenCalledWith(dto);
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse(authResult));
    });

    it('should respond 401 when the refresh token is rejected', async () => {
      mockService.refresh.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));
      const res = makeRes();
      await manager.handleRefresh(dto, asRes(res));

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('handleLogout', () => {
    it('should log out the user from req.user.id and respond with null data', async () => {
      mockService.logout.mockResolvedValue(undefined);
      const res = makeRes();
      const req = { user: { id: 'u1' } } as unknown as Request;
      await manager.handleLogout(req, asRes(res));

      expect(mockService.logout).toHaveBeenCalledWith('u1');
      expect(res.json).toHaveBeenCalledWith(buildSuccessResponse(null));
      expect(mockFlush.flush).toHaveBeenCalled();
    });

    it('should respond with the error status when logout fails', async () => {
      mockService.logout.mockRejectedValue(new Error('DB error'));
      const res = makeRes();
      const req = { user: { id: 'u1' } } as unknown as Request;
      await manager.handleLogout(req, asRes(res));

      expect(res.status).toHaveBeenCalledWith(500);
      expect(mockFlush.flushError).toHaveBeenCalled();
    });
  });
});
