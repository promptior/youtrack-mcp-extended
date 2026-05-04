jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/users/find-user';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('find_user', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return matching users', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'u-1', login: 'alice', name: 'Alice Smith', email: 'alice@company.com', avatarUrl: 'https://example.com/avatar/alice', online: true, banned: false },
          { id: 'u-2', login: 'alice.jones', name: 'Alice Jones', email: 'alice.jones@company.com', avatarUrl: null, online: false, banned: false },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'alice' });

    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toEqual({
      id: 'u-1',
      login: 'alice',
      name: 'Alice Smith',
      email: 'alice@company.com',
      avatarUrl: 'https://example.com/avatar/alice',
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should pass query param to API', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'bob' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('query=bob');
  });

  it('should use default top=10', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'test' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=10');
  });

  it('should use custom top value', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'test', top: 25 });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=25');
  });

  it('should handle user with null email and avatarUrl', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'u-3', login: 'noav', name: 'No Avatar', email: null, avatarUrl: undefined, online: false, banned: false },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'noav' });

    expect(result.users[0].email).toBeNull();
    expect(result.users[0].avatarUrl).toBeNull();
  });

  it('should return empty users array when no matches', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'zzznobody' });

    expect(result.users).toEqual([]);
  });

  it('should throw when query is missing', () => {
    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS })).toThrow('ext_find_user failed:');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 403,
        response: 'Forbidden',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'alice' })).toThrow(
      'ext_find_user failed: YouTrack API error 403:'
    );
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.users).toBeDefined();
  });
});

export {};
