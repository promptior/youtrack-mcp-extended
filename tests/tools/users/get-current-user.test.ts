jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/users/get-current-user';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('get_current_user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return current user details', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'u-42',
          login: 'john.doe',
          name: 'John Doe',
          email: 'john@company.com',
          avatarUrl: 'https://test.youtrack.cloud/avatar/john',
          online: true,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result).toEqual({
      id: 'u-42',
      login: 'john.doe',
      name: 'John Doe',
      email: 'john@company.com',
      avatarUrl: 'https://test.youtrack.cloud/avatar/john',
      online: true,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should call /users/me endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'u-1',
          login: 'me',
          name: 'Me User',
          email: 'me@test.com',
          avatarUrl: null,
          online: false,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('/users/me');
  });

  it('should handle null email and avatarUrl', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'u-2',
          login: 'noav',
          name: 'No Avatar',
          email: null,
          avatarUrl: null,
          online: false,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.email).toBeNull();
    expect(result.avatarUrl).toBeNull();
    expect(result.online).toBe(false);
  });

  it('should work with no input parameters besides settings', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'u-3',
          login: 'tokenowner',
          name: 'Token Owner',
          email: 'owner@test.com',
          avatarUrl: '',
          online: true,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    // No extra params beyond settings
    const result = tool.aiTool.execute({ settings: DEFAULT_SETTINGS.settings });

    expect(result.login).toBe('tokenowner');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 401,
        response: 'Unauthorized',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS })).toThrow(
      'ext_get_current_user failed: YouTrack API error 401:'
    );
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema with all expected fields', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.login).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.name).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.email).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.online).toBeDefined();
  });

  it('should have empty required array in inputSchema', () => {
    expect(tool.aiTool.inputSchema.required).toEqual([]);
  });
});

export {};
