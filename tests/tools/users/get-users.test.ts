jest.mock('@jetbrains/youtrack-scripting-api/http');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as getUsers from '../../../src/tools/users/get-users';

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return users with default pagination', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'user-1', login: 'john.doe', name: 'John Doe', email: 'john@test.com' },
          { id: 'user-2', login: 'jane.smith', name: 'Jane Smith', email: 'jane@test.com' },
        ]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getUsers.aiTool.execute({ settings: defaultSettings });

    expect(result.users).toHaveLength(2);
    expect(result.users[0].login).toBe('john.doe');
    expect(result.returnedCount).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('should set hasMore=true when more than top results are returned (top+1 sentinel)', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'u-1', login: 'a' },
          { id: 'u-2', login: 'b' },
          { id: 'u-3', login: 'c' },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getUsers.aiTool.execute({ top: 2, settings: defaultSettings });

    expect(result.users).toHaveLength(2);
    expect(result.returnedCount).toBe(2);
    expect(result.hasMore).toBe(true);
    const url = mockConnection.get.mock.calls[0][0];
    // top+1 sentinel: top=2 → API request top=3
    expect(url).toContain('%24top=3');
  });

  it('should filter by query parameter', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: 'user-1', login: 'john', name: 'John' }]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    getUsers.aiTool.execute({ query: 'john', settings: defaultSettings });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('query=john');
  });

  it('should handle pagination', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    getUsers.aiTool.execute({ top: 100, skip: 50, settings: defaultSettings });

    const getCall = mockConnection.get.mock.calls[0][0];
    // top+1 sentinel: top=100 → API request top=101
    expect(getCall).toMatch(/\$*top.*101/);
    expect(getCall).toMatch(/\$*skip.*50/);
  });

  it('should have correct annotations', () => {
    expect(getUsers.aiTool.annotations.readOnlyHint).toBe(true);
  });
});

export {};
