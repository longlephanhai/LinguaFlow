import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;
  let mockAuthService: any;

  beforeEach(() => {
    mockAuthService = {
      register: vi.fn(),
      login: vi.fn(),
      refresh: vi.fn(),
      logout: vi.fn(),
      getMe: vi.fn(),
    };

    controller = new AuthController(mockAuthService as AuthService);
  });

  describe('register', () => {
    it('should call authService.register and return result', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const expected = { accessToken: 'acc', refreshToken: 'ref', user: { id: '1' } };
      mockAuthService.register.mockResolvedValue(expected);

      const result = await controller.register(dto);

      expect(mockAuthService.register).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('login', () => {
    it('should call authService.login and return result', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const expected = { accessToken: 'acc', refreshToken: 'ref', user: { id: '1' } };
      mockAuthService.login.mockResolvedValue(expected);

      const result = await controller.login(dto);

      expect(mockAuthService.login).toHaveBeenCalledWith(dto);
      expect(result).toBe(expected);
    });
  });

  describe('refresh', () => {
    it('should call authService.refresh and return accessToken', async () => {
      const dto = { refreshToken: 'ref-token' };
      const expected = { accessToken: 'new-acc' };
      mockAuthService.refresh.mockResolvedValue(expected);

      const result = await controller.refresh(dto);

      expect(mockAuthService.refresh).toHaveBeenCalledWith(dto.refreshToken);
      expect(result).toBe(expected);
    });
  });

  describe('logout', () => {
    it('should call authService.logout and return success', async () => {
      mockAuthService.logout.mockResolvedValue({ success: true });

      const result = await controller.logout('user-123');

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({ success: true });
    });
  });

  describe('getMe', () => {
    it('should call authService.getMe and return user profile', async () => {
      const expected = { id: 'user-123', email: 'test@example.com' };
      mockAuthService.getMe.mockResolvedValue(expected);

      const result = await controller.getMe('user-123');

      expect(mockAuthService.getMe).toHaveBeenCalledWith('user-123');
      expect(result).toBe(expected);
    });
  });
});
