jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/update-issue-comment');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('update_issue_comment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a comment and return id (uniform with article comments), text, updated', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'comment-1',
          text: 'Updated text',
          updated: 1700000001000,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'comment-1',
      text: 'Updated text',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: 'comment-1',
      text: 'Updated text',
      updated: 1700000001000,
    });
  });

  it('should POST to /issues/{issueId}/comments/{commentId}', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c1', text: 'new', updated: 1 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'comment-1',
      text: 'new',
      settings: defaultSettings,
    });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/issues/DEMO-1/comments/comment-1');
  });

  it('should send text in request body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c1', text: 'updated', updated: 1 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'c1',
      text: 'updated',
      settings: defaultSettings,
    });

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.text).toBe('updated');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ commentId: 'c1', text: 'x', settings: defaultSettings })
    ).toThrow('ext_update_issue_comment failed: issueId parameter is required');
  });

  it('should throw when commentId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', text: 'x', settings: defaultSettings })
    ).toThrow('ext_update_issue_comment failed: commentId parameter is required');
  });

  it('should throw when text is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', commentId: 'c1', settings: defaultSettings })
    ).toThrow('ext_update_issue_comment failed: text parameter is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Comment not found',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({
        issueId: 'DEMO-1',
        commentId: 'nonexistent',
        text: 'x',
        settings: defaultSettings,
      })
    ).toThrow('ext_update_issue_comment failed: YouTrack API error 404');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
