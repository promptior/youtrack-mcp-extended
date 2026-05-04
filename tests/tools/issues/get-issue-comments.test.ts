jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/get-issue-comments');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('get_issue_comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return comments for an issue', () => {
    const mockComments = [
      {
        id: 'comment-1',
        text: 'This is a comment',
        created: 1700000000000,
        updated: 1700000001000,
        author: { login: 'user1', name: 'User One' },
        deleted: false,
      },
      {
        id: 'comment-2',
        text: 'Another comment',
        created: 1700000002000,
        updated: 1700000002000,
        author: { login: 'user2', name: 'User Two' },
        deleted: false,
      },
    ];

    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockComments),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({ comments: mockComments });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.get).toHaveBeenCalled();
  });

  it('should return empty array when no comments', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({ comments: [] });
  });

  it('should apply top and skip pagination parameters', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', top: 10, skip: 20, settings: defaultSettings });

    const getCallUrl = mockConnection.get.mock.calls[0][0];
    expect(getCallUrl).toContain('%24top=10');
    expect(getCallUrl).toContain('%24skip=20');
  });

  it('should use default top=50 and skip=0 when not specified', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    const getCallUrl = mockConnection.get.mock.calls[0][0];
    expect(getCallUrl).toContain('%24top=50');
    expect(getCallUrl).toContain('%24skip=0');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ settings: defaultSettings })
    ).toThrow('ext_get_issue_comments failed: issueId is required');
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
      tool.aiTool.execute({ issueId: 'NOTFOUND-1', settings: defaultSettings })
    ).toThrow('ext_get_issue_comments failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.comments).toBeDefined();
  });
});

export {};
