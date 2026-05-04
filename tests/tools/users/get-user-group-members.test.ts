jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/users/get-user-group-members';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('get_user_group_members', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return group members', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'u-1', login: 'alice', name: 'Alice Smith', email: 'alice@company.com' },
          { id: 'u-2', login: 'bob', name: 'Bob Jones', email: 'bob@company.com' },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, groupId: 'g-devs' });

    expect(result.members).toHaveLength(2);
    expect(result.members[0]).toEqual({
      id: 'u-1',
      login: 'alice',
      name: 'Alice Smith',
      email: 'alice@company.com',
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should call the correct endpoint with groupId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, groupId: 'my-group-id' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('/groups/my-group-id/users');
  });

  it('should handle member with null email', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'u-3', login: 'noemail', name: 'No Email', email: null },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, groupId: 'g-1' });

    expect(result.members[0].email).toBeNull();
  });

  it('should use default top=50 and skip=0', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, groupId: 'g-1' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=50');
    expect(getCall).toContain('%24skip=0');
  });

  it('should use custom top and skip values', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, groupId: 'g-1', top: 10, skip: 5 });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=10');
    expect(getCall).toContain('%24skip=5');
  });

  it('should return empty members array when group has no users', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, groupId: 'g-empty' });

    expect(result.members).toEqual([]);
  });

  it('should throw when groupId is missing', () => {
    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS })).toThrow(
      'ext_get_user_group_members failed:'
    );
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Group not found',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS, groupId: 'unknown' })).toThrow(
      'ext_get_user_group_members failed: YouTrack API error 404:'
    );
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.members).toBeDefined();
  });
});

export {};
