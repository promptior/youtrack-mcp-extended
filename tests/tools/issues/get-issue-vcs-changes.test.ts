jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const getIssueVcsChanges = require('../../../src/tools/issues/get-issue-vcs-changes');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('get_issue_vcs_changes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return vcs changes for an issue', () => {
    const mockVcsChanges = [
      {
        id: 'vcs-1',
        text: 'Fix bug in login flow',
        date: 1700000000000,
        version: 'abc123def456',
        author: { login: 'dev1', name: 'Developer One' },
        processors: [
          { type: 'GitHub', url: 'https://github.com/repo/commit/abc123', webUrl: 'https://github.com/repo/commit/abc123' },
        ],
      },
    ];

    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockVcsChanges),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueVcsChanges.aiTool.execute({
      issueId: 'DEMO-1',
      settings: defaultSettings,
    });

    expect(result.issueId).toBeUndefined();
    expect(result.vcsChanges).toHaveLength(1);
    expect(result.vcsChanges[0].id).toBe('vcs-1');
    expect(result.vcsChanges[0].text).toBe('Fix bug in login flow');
    expect(result.vcsChanges[0].version).toBe('abc123def456');
    expect(result.vcsChanges[0].author).toEqual({ login: 'dev1', name: 'Developer One' });
    expect(result.vcsChanges[0].urls).toHaveLength(1);
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.get).toHaveBeenCalled();
  });

  it('should return empty vcsChanges array when none present', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({}),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueVcsChanges.aiTool.execute({
      issueId: 'DEMO-2',
      settings: defaultSettings,
    });

    expect(result).toEqual({ vcsChanges: [] });
  });

  it('should handle missing author gracefully', () => {
    const mockVcsChanges = [
      {
        id: 'vcs-2',
        text: 'Some commit',
        date: 1700000000000,
        version: 'xyz789',
        author: null,
        processors: [],
      },
    ];

    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockVcsChanges),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueVcsChanges.aiTool.execute({
      issueId: 'DEMO-1',
      settings: defaultSettings,
    });

    expect(result.vcsChanges[0].author).toBeNull();
    expect(result.vcsChanges[0].urls).toEqual([]);
  });

  it('should call the correct endpoint with fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    getIssueVcsChanges.aiTool.execute({
      issueId: 'DEMO-3',
      settings: defaultSettings,
    });

    const getCallUrl = mockConnection.get.mock.calls[0][0];
    expect(getCallUrl).toContain('/issues/DEMO-3/vcsChanges');
    expect(getCallUrl).toContain('fields=');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      getIssueVcsChanges.aiTool.execute({ settings: defaultSettings })
    ).toThrow('ext_get_issue_vcs_changes failed: issueId parameter is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Issue not found',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      getIssueVcsChanges.aiTool.execute({ issueId: 'NOTFOUND-1', settings: defaultSettings })
    ).toThrow('ext_get_issue_vcs_changes failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(getIssueVcsChanges.aiTool.annotations.readOnlyHint).toBe(true);
    expect(getIssueVcsChanges.aiTool.annotations.destructiveHint).toBe(false);
    expect(getIssueVcsChanges.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have outputSchema defined', () => {
    expect(getIssueVcsChanges.aiTool.outputSchema).toBeDefined();
    expect(getIssueVcsChanges.aiTool.outputSchema.properties.vcsChanges).toBeDefined();
    // issueId was removed from the response to align with sibling get_issue_* tools
    expect(getIssueVcsChanges.aiTool.outputSchema.properties.issueId).toBeUndefined();
  });
});

export {};
