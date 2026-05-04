jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/users/find-user-groups';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

const mockGroups = [
  { id: 'g-1', name: 'Developers', description: 'Dev team', usersCount: 10 },
  { id: 'g-2', name: 'QA Team', description: 'Quality assurance', usersCount: 5 },
  { id: 'g-3', name: 'Admin Group', description: null, usersCount: 2 },
];

describe('find_user_groups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all groups when no query is given', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockGroups),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.groups).toHaveLength(3);
    expect(result.groups[0]).toEqual({
      id: 'g-1',
      name: 'Developers',
      description: 'Dev team',
      usersCount: 10,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should filter groups by query (case-insensitive)', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockGroups),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'team' });

    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].name).toBe('QA Team');
  });

  it('should handle group with null description', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([mockGroups[2]]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.groups[0].description).toBeNull();
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

    tool.aiTool.execute({ ...DEFAULT_SETTINGS });

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

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, top: 5, skip: 10 });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=5');
    expect(getCall).toContain('%24skip=10');
  });

  it('should return empty groups array when API returns empty array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.groups).toEqual([]);
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

    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS })).toThrow(
      'ext_find_user_groups failed: YouTrack API error 403:'
    );
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.groups).toBeDefined();
  });
});

export {};
