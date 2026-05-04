jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/move-issue-to-project');

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('move_issue_to_project', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should move issue and return new readable ID', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-99', idReadable: 'NEWPROJ-99' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'OLD-1',
      targetProjectId: '0-1',
      settings: defaultSettings,
    });

    expect(result).toEqual({ moved: true, issueId: 'NEWPROJ-99' });
  });

  it('should POST to /issues/{internalId} with project={id} body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-99', idReadable: 'NEWPROJ-99' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'OLD-1', targetProjectId: '0-1', settings: defaultSettings });

    // The tool resolves to internal ID before POST so post-move lookup
    // survives the issue ID change.
    const postUrl = mockConnection.post.mock.calls[0][0];
    expect(postUrl).toContain('/issues/2-99');
    expect(postUrl).not.toContain('/project');
    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody).toEqual({ project: { id: '0-1' } });
  });

  it('should GET new issue data after move', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-99', idReadable: 'NEWPROJ-99' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'OLD-1', targetProjectId: '0-1', settings: defaultSettings });

    // The tool issues two GETs — the second one (after the move) uses the
    // internal ID resolved from the first.
    const lastGetUrl = mockConnection.get.mock.calls[mockConnection.get.mock.calls.length - 1][0];
    expect(lastGetUrl).toContain('/issues/2-99');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ targetProjectId: '0-1', settings: defaultSettings })
    ).toThrow('ext_move_issue_to_project failed: issueId parameter is required');
  });

  it('should throw when targetProjectId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'OLD-1', settings: defaultSettings })
    ).toThrow('ext_move_issue_to_project failed: targetProjectId parameter is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' }),
      get: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'OLD-1', targetProjectId: '0-1', settings: defaultSettings })
    ).toThrow('ext_move_issue_to_project failed:');
  });

  it('should rewrite YouTrack workflow runtime errors with the offending rule name', () => {
    // Regression: the YouTrack server's "flatten-duplicates-structure" rule (and
    // similar workflow rules) sometimes rejects a move with a runtime error.
    // The MCP needs to surface the rule name so the caller knows it's a
    // server-side issue, not an MCP bug.
    const ytError = JSON.stringify({
      error: 'Workflow runtime error',
      error_description: 'rule X failed',
      error_rule_name: '@jetbrains/youtrack-workflow-duplicates/flatten-duplicates-structure',
      error_workflow_type: 'runtime',
    });
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-99' }),
      }),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 500, response: ytError }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'OLD-1', targetProjectId: '0-1', settings: defaultSettings })
    ).toThrow(/A YouTrack workflow rule rejected the move \(rule "@jetbrains\/youtrack-workflow-duplicates\/flatten-duplicates-structure"\)/);
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
