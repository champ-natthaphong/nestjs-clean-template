import {
  ConflictException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { jest, describe, beforeEach, it, expect, beforeAll, afterAll } from '@jest/globals';

import request from 'supertest';
import { AuthController } from 'src/modules/auth/controllers/auth.controller';
import { AuthManager } from 'src/modules/auth/managers/auth.manager';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { buildSuccessResponse, CustomRestInterceptor, ResultCodes, SummaryFlush } from 'src/common';
import { asyncMock } from '../helpers/mock-fn';

const json = (v: unknown) => JSON.parse(JSON.stringify(v));

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockService = {
    register: asyncMock(),
    login: asyncMock(),
    refresh: asyncMock(),
    logout: asyncMock(),
  };
  const mockFlush = { flush: jest.fn(), flushError: jest.fn() };

  const authResult = {
    accessToken: 'a',
    refreshToken: 'r',
    user: { id: 'u1', firstName: 'C', lastName: 'T', email: 'c@e.com', role: 'user' },
  };

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthManager,
        { provide: AuthService, useValue: mockService },
        { provide: SummaryFlush, useValue: mockFlush },
      ],
    })
      .overrideInterceptor(CustomRestInterceptor)
      .useValue({ intercept: (_ctx: unknown, next: { handle: () => unknown }) => next.handle() })
      .compile();

    app = moduleFixture.createNestApplication();
    // จำลองผู้ใช้ที่ผ่าน JWT guard แล้ว (ใช้กับ /auth/logout)
    app.use((req: { user?: unknown }, _res: unknown, next: () => void) => {
      req.user = { id: 'u1' };
      next();
    });
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('POST /auth/register', () => {
    const body = { firstName: 'C', lastName: 'T', email: 'c@e.com', password: 'Password123!' };

    it('should return 201 with the tokens', async () => {
      mockService.register.mockResolvedValue(authResult);

      const res = await request(app.getHttpServer()).post('/auth/register').send(body);

      expect(res.status).toBe(201);
      expect(mockService.register).toHaveBeenCalledWith(body);
      expect(res.body).toEqual(json(buildSuccessResponse(authResult, ResultCodes.CREATED)));
    });

    it('should return 400 when the email is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...body, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(mockService.register).not.toHaveBeenCalled();
    });

    it('should return 400 when the password is shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...body, password: 'short' });

      expect(res.status).toBe(400);
      expect(mockService.register).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app.getHttpServer()).post('/auth/register').send({});

      expect(res.status).toBe(400);
      expect(mockService.register).not.toHaveBeenCalled();
    });

    it('should return 409 when the email already exists', async () => {
      mockService.register.mockRejectedValue(new ConflictException('Email c@e.com already exists'));

      const res = await request(app.getHttpServer()).post('/auth/register').send(body);

      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    const body = { email: 'c@e.com', password: 'Password123!' };

    it('should return 200 with the tokens', async () => {
      mockService.login.mockResolvedValue(authResult);

      const res = await request(app.getHttpServer()).post('/auth/login').send(body);

      expect(res.status).toBe(201);
      expect(mockService.login).toHaveBeenCalledWith(body);
      expect(res.body).toEqual(json(buildSuccessResponse(authResult)));
    });

    it('should return 401 when the credentials are invalid', async () => {
      mockService.login.mockRejectedValue(new UnauthorizedException('Invalid credentials'));

      const res = await request(app.getHttpServer()).post('/auth/login').send(body);

      expect(res.status).toBe(401);
    });

    it('should return 400 when the password is missing', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({ email: 'c@e.com' });

      expect(res.status).toBe(400);
      expect(mockService.login).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 200 with the new tokens', async () => {
      mockService.refresh.mockResolvedValue(authResult);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'token' });

      expect(res.status).toBe(201);
      expect(mockService.refresh).toHaveBeenCalledWith({ refreshToken: 'token' });
    });

    it('should return 401 when the refresh token is rejected', async () => {
      mockService.refresh.mockRejectedValue(new UnauthorizedException('Invalid refresh token'));

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'token' });

      expect(res.status).toBe(401);
    });

    it('should return 400 when refreshToken is missing', async () => {
      const res = await request(app.getHttpServer()).post('/auth/refresh').send({});

      expect(res.status).toBe(400);
      expect(mockService.refresh).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 200 and log out the authenticated user', async () => {
      mockService.logout.mockResolvedValue(undefined);

      const res = await request(app.getHttpServer()).post('/auth/logout');

      expect(res.status).toBe(201);
      expect(mockService.logout).toHaveBeenCalledWith('u1');
      expect(res.body).toEqual(json(buildSuccessResponse(null)));
    });
  });
});
