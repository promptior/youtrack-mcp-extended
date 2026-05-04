jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/delete-issue-comment');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('delete_issue_comment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a comment and return success true', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'comment-1',
      settings: defaultSettings,
    });

    expect(result).toEqual({ success: true });
  });

  it('should DELETE /issues/{issueId}/comments/{commentId}', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'comment-1',
      settings: defaultSettings,
    });

    const url = mockConnection.delete.mock.calls[0][0];
    expect(url).toContain('/issues/DEMO-1/comments/comment-1');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ commentId: 'c1', settings: defaultSettings })
    ).toThrow('ext_delete_issue_comment failed: issueId parameter is required');
  });

  it('should throw when commentId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings })
    ).toThrow('ext_delete_issue_comment failed: commentId parameter is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', commentId: 'nope', settings: defaultSettings })
    ).toThrow('ext_delete_issue_comment failed: YouTrack API error 404');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.destructiveHint).toBe(true);
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
  });
});

export {};
