import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { describe, jest, beforeEach, it, expect } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService } from 'src/modules/auth/services/auth.service';
import { UserRepository } from 'src/modules/users/repositories/user.repository';
import { ConfigService } from 'src/common';

import { asyncMock, syncMock } from '../../../../helpers/mock-fn';
jest.mock('bcrypt', () => ({ hash: jest.fn(), compare: jest.fn() }));

const bcryptMock = jest.requireMock<{
  hash: ReturnType<typeof asyncMock>;
  compare: ReturnType<typeof asyncMock>;
}>('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;

  const mockRepo = {
    existsByEmail: asyncMock(),
    create: asyncMock(),
    findByEmailWithPassword: asyncMock(),
    findByIdWithRefreshToken: asyncMock(),
    updateRefreshToken: asyncMock(),
  };
  const mockJwt = { sign: syncMock(), verify: syncMock() };
  const mockConfig = { getOrThrow: syncMock() };

  const registerDto = {
    firstName: 'Champ',
    lastName: 'T',
    email: 'champ@example.com',
    password: 'Password123!',
  };
  const user = {
    id: 'u1',
    firstName: 'Champ',
    lastName: 'T',
    email: 'champ@example.com',
    role: 'user',
    isActive: true,
    password: 'hashed-password',
    refreshToken: 'hashed-refresh',
  };
  const publicUser = {
    id: 'u1',
    firstName: 'Champ',
    lastName: 'T',
    email: 'champ@example.com',
    role: 'user',
  };
  const expectedResponse = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: publicUser,
  };

  // buildAuthResponse เรียก sign 2 ครั้ง: access แล้วตามด้วย refresh
  const primeTokens = () => {
    mockJwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockRepo },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    authService = module.get(AuthService);

    // ใช้ reset (ไม่ใช่ clear) เพื่อล้างคิว mockReturnValueOnce ที่อาจเหลือจากเทสต์ก่อนหน้า
    jest.resetAllMocks();
    mockConfig.getOrThrow.mockImplementation((key: unknown) => `value-of-${String(key)}`);
    mockRepo.updateRefreshToken.mockResolvedValue(undefined);
  });

  describe('register', () => {
    it('should hash the password, create the user and return tokens', async () => {
      mockRepo.existsByEmail.mockResolvedValue(false);
      bcryptMock.hash
        .mockResolvedValueOnce('hashed-password')
        .mockResolvedValueOnce('hashed-refresh');
      mockRepo.create.mockResolvedValue(user);
      primeTokens();

      const result = await authService.register(registerDto);

      expect(bcryptMock.hash).toHaveBeenNthCalledWith(1, 'Password123!', 10);
      expect(mockRepo.create).toHaveBeenCalledWith({ ...registerDto, password: 'hashed-password' });
      expect(bcryptMock.hash).toHaveBeenNthCalledWith(2, 'refresh-token', 10);
      expect(mockRepo.updateRefreshToken).toHaveBeenCalledWith('u1', 'hashed-refresh');
      expect(result).toEqual(expectedResponse);
    });

    it('should sign the tokens with the configured secrets and expiry', async () => {
      mockRepo.existsByEmail.mockResolvedValue(false);
      bcryptMock.hash.mockResolvedValue('hashed');
      mockRepo.create.mockResolvedValue(user);
      primeTokens();

      await authService.register(registerDto);

      const payload = { sub: 'u1', email: 'champ@example.com', role: 'user' };
      expect(mockJwt.sign).toHaveBeenNthCalledWith(1, payload, {
        secret: 'value-of-JWT_SECRET',
        expiresIn: 86400,
      });
      expect(mockJwt.sign).toHaveBeenNthCalledWith(2, payload, {
        secret: 'value-of-JWT_REFRESH_SECRET',
        expiresIn: 604800,
        jwtid: expect.any(String),
      });
    });

    it('should throw ConflictException when the email already exists', async () => {
      mockRepo.existsByEmail.mockResolvedValue(true);

      await expect(authService.register(registerDto)).rejects.toThrow(ConflictException);
      expect(mockRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = { email: 'champ@example.com', password: 'Password123!' };

    it('should return tokens when the credentials are valid', async () => {
      mockRepo.findByEmailWithPassword.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true);
      bcryptMock.hash.mockResolvedValue('hashed-refresh');
      primeTokens();

      const result = await authService.login(loginDto);

      expect(bcryptMock.compare).toHaveBeenCalledWith('Password123!', 'hashed-password');
      expect(mockRepo.updateRefreshToken).toHaveBeenCalledWith('u1', 'hashed-refresh');
      expect(result).toEqual(expectedResponse);
    });

    it('should throw UnauthorizedException when the user does not exist', async () => {
      mockRepo.findByEmailWithPassword.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when the password is wrong', async () => {
      mockRepo.findByEmailWithPassword.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when the account is inactive', async () => {
      mockRepo.findByEmailWithPassword.mockResolvedValue({ ...user, isActive: false });
      bcryptMock.compare.mockResolvedValue(true);

      await expect(authService.login(loginDto)).rejects.toThrow('Account is inactive');
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const dto = { refreshToken: 'old-refresh-token' };
    const payload = { sub: 'u1', email: 'champ@example.com', role: 'user' };

    it('should issue new tokens when the refresh token is valid', async () => {
      mockJwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');
      mockJwt.verify.mockReturnValue(payload);
      mockRepo.findByIdWithRefreshToken.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(true);
      bcryptMock.hash.mockResolvedValue('new-hashed-refresh');

      const result = await authService.refresh(dto);

      expect(mockJwt.verify).toHaveBeenCalledWith('old-refresh-token', {
        secret: 'value-of-JWT_REFRESH_SECRET',
      });
      expect(bcryptMock.compare).toHaveBeenCalledWith('old-refresh-token', 'hashed-refresh');
      expect(mockRepo.updateRefreshToken).toHaveBeenCalledWith('u1', 'new-hashed-refresh');
      expect(result).toEqual(expectedResponse);
    });

    it('should throw UnauthorizedException when the JWT is invalid or expired', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refresh(dto)).rejects.toThrow('Invalid or expired refresh token');
      expect(mockRepo.findByIdWithRefreshToken).not.toHaveBeenCalled();
    });

    it.each([
      ['the user does not exist', null],
      ['the user is inactive', { ...user, isActive: false }],
      ['the user has no stored refresh token', { ...user, refreshToken: null }],
    ])('should throw UnauthorizedException when %s', async (_label, found) => {
      mockJwt.verify.mockReturnValue(payload);
      mockRepo.findByIdWithRefreshToken.mockResolvedValue(found);

      await expect(authService.refresh(dto)).rejects.toThrow('Invalid refresh token');
      expect(bcryptMock.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when the token does not match the stored hash', async () => {
      mockJwt.verify.mockReturnValue(payload);
      mockRepo.findByIdWithRefreshToken.mockResolvedValue(user);
      bcryptMock.compare.mockResolvedValue(false);

      await expect(authService.refresh(dto)).rejects.toThrow('Invalid refresh token');
      expect(mockJwt.sign).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear the stored refresh token', async () => {
      await authService.logout('u1');

      expect(mockRepo.updateRefreshToken).toHaveBeenCalledWith('u1', null);
    });
  });
});
