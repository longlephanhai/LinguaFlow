import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard.js';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    vi.clearAllMocks();
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
  });

  const createMockContext = (user?: any) => {
    const mockRequest = { user };
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  it('should allow access if no permissions are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user is not authenticated', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read']);
    const context = createMockContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access if user role is admin', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:write']);
    const context = createMockContext({ role: 'admin', permissions: [] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has wildcard * permission', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:write']);
    const context = createMockContext({ role: 'manager', permissions: ['*'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has all required permissions', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read', 'users:write']);
    const context = createMockContext({
      role: 'editor',
      permissions: ['users:read', 'users:write', 'roles:read'],
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks one of required permissions', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['users:read', 'users:write']);
    const context = createMockContext({
      role: 'viewer',
      permissions: ['users:read'],
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
