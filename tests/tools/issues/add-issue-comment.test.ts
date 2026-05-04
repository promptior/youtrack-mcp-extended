jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/add-issue-comment');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('add_issue_comment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a comment and return id (uniform with article comments), text, author, created', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'comment-1',
          text: 'Hello from test',
          author: { login: 'jdoe', name: 'John Doe' },
          created: 1700000000000,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      text: 'Hello from test',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: 'comment-1',
      text: 'Hello from test',
      author: { login: 'jdoe', name: 'John Doe' },
      created: 1700000000000,
    });
  });

  it('should POST to /issues/{issueId}/comments with fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c1', text: 'hi', author: { login: 'a', name: 'A' }, created: 1 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', text: 'hi', settings: defaultSettings });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/issues/DEMO-1/comments');
    expect(url).toContain('fields=');
  });

  it('should send text in request body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c1', text: 'hi', author: { login: 'a', name: 'A' }, created: 1 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', text: 'hi', settings: defaultSettings });

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.text).toBe('hi');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ text: 'some text', settings: defaultSettings })
    ).toThrow('ext_add_issue_comment failed: issueId parameter is required');
  });

  it('should throw when text is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings })
    ).toThrow('ext_add_issue_comment failed: text parameter is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Issue not found',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'NOTFOUND-1', text: 'hi', settings: defaultSettings })
    ).toThrow('ext_add_issue_comment failed: YouTrack API error 404');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
