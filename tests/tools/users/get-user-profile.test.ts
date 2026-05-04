jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/users/get-user-profile';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('get_user_profile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user profile with all fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: '2-7',
          login: 'john.doe',
          name: 'john.doe',
          fullName: 'John Doe',
          email: 'john@company.com',
          avatarUrl: 'https://test.youtrack.cloud/avatar/john',
          banned: false,
          online: true,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, userId: 'john.doe' });

    expect(result).toEqual({
      user: {
        id: '2-7',
        login: 'john.doe',
        name: 'john.doe',
        fullName: 'John Doe',
        email: 'john@company.com',
        avatarUrl: 'https://test.youtrack.cloud/avatar/john',
        banned: false,
        online: true,
      },
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should call /users/{id} (no /profiles/general suffix)', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1', login: 'user42', name: 'User 42' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, userId: 'user42' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('/users/user42');
    expect(getCall).not.toContain('/profiles/general');
  });

  it('should default fullName to name when fullName is missing', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: '2-2',
          login: 'short',
          name: 'short',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, userId: 'short' });

    expect(result.user.fullName).toBe('short');
    expect(result.user.email).toBeNull();
    expect(result.user.banned).toBe(false);
    expect(result.user.online).toBe(false);
  });

  it('should work with an internal user ID', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '1-42', login: 'jane', name: 'jane' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, userId: '1-42' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('/users/1-42');
    expect(result.user.login).toBe('jane');
  });

  it('should throw when userId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS })
    ).toThrow('ext_get_user_profile failed:');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'User not found',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, userId: 'nonexistent' })
    ).toThrow('ext_get_user_profile failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.user).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.user.properties.login).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.user.properties.email).toBeDefined();
  });
});

export {};
