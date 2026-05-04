jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/change-issue-assignee');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

function buildConnection(getResponseBody: any) {
  return {
    addHeader: jest.fn(),
    post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    get: jest.fn().mockReturnValue({
      isSuccess: true,
      code: 200,
      response: JSON.stringify(getResponseBody),
    }),
  };
}

describe('change_issue_assignee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should assign a user via /commands and return new assignee', () => {
    const conn = buildConnection({
      id: '2-1',
      idReadable: 'DEMO-1',
      customFields: [
        { name: 'Assignee', value: { login: 'john.doe', name: 'John Doe' } },
      ],
    });
    mockHttp.Connection.mockReturnValue(conn);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      assigneeLogin: 'john.doe',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: '2-1',
      idReadable: 'DEMO-1',
      assignee: { login: 'john.doe', name: 'John Doe' },
    });
    expect(conn.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');

    const postUrl = conn.post.mock.calls[0][0];
    expect(postUrl).toContain('/commands');
    const postBody = JSON.parse(conn.post.mock.calls[0][2]);
    expect(postBody.query).toBe('for john.doe');
    expect(postBody.issues).toEqual([{ idReadable: 'DEMO-1' }]);
  });

  it('should unassign when assigneeLogin is empty string', () => {
    const conn = buildConnection({
      id: '2-1',
      idReadable: 'DEMO-1',
      customFields: [{ name: 'Assignee', value: null }],
    });
    mockHttp.Connection.mockReturnValue(conn);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      assigneeLogin: '',
      settings: defaultSettings,
    });

    expect(result.assignee).toBeNull();
    const postBody = JSON.parse(conn.post.mock.calls[0][2]);
    expect(postBody.query).toBe('Assignee Unassigned');
  });

  it('should return null assignee when customFields lacks an Assignee entry', () => {
    const conn = buildConnection({
      id: '2-1',
      idReadable: 'DEMO-1',
      customFields: [],
    });
    mockHttp.Connection.mockReturnValue(conn);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      assigneeLogin: '',
      settings: defaultSettings,
    });

    expect(result.assignee).toBeNull();
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ assigneeLogin: 'user1', settings: defaultSettings })
    ).toThrow('ext_change_issue_assignee failed: issueId is required');
  });

  it('should throw when assigneeLogin is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings })
    ).toThrow('ext_change_issue_assignee failed: assigneeLogin is required');
  });

  it('should throw on API error from /commands', () => {
    const conn = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Access denied' }),
      get: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(conn);

    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', assigneeLogin: 'user1', settings: defaultSettings })
    ).toThrow('ext_change_issue_assignee failed: YouTrack API error 403:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.idReadable).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.assignee).toBeDefined();
  });
});

export {};
