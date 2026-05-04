jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/saved-queries/get-saved-issue-searches';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

const mockQueries = [
  {
    id: 'sq-1',
    name: 'My Open Issues',
    query: 'for: me State: Open',
    owner: { login: 'alice', name: 'Alice Smith' },
    isShareableWithProjects: false,
  },
  {
    id: 'sq-2',
    name: 'Critical Bugs',
    query: 'Type: Bug Priority: Critical',
    owner: { login: 'bob', name: 'Bob Jones' },
    isShareableWithProjects: true,
  },
  {
    id: 'sq-3',
    name: 'Unowned Query',
    query: 'State: Open',
    owner: null,
    isShareableWithProjects: false,
  },
];

describe('get_saved_issue_searches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of saved queries', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockQueries),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.savedQueries).toHaveLength(3);
    expect(result.savedQueries[0]).toEqual({
      id: 'sq-1',
      name: 'My Open Issues',
      query: 'for: me State: Open',
      owner: { login: 'alice', name: 'Alice Smith' },
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should handle query with null owner', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([mockQueries[2]]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.savedQueries[0].owner).toBeNull();
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

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, top: 20, skip: 40 });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=20');
    expect(getCall).toContain('%24skip=40');
  });

  it('should call /savedQueries endpoint', () => {
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
    expect(getCall).toContain('/savedQueries');
  });

  it('should return empty savedQueries array when none exist', () => {
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

    expect(result.savedQueries).toEqual([]);
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
      'ext_get_saved_issue_searches failed: YouTrack API error 403:'
    );
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.savedQueries).toBeDefined();
  });
});

export {};
