jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const addCommentReaction = require('../../../src/tools/issues/add-comment-reaction');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('add_comment_reaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a reaction and return reaction data', () => {
    const mockReaction = {
      id: 'reaction-1',
      reaction: 'thumbs-up',
      author: { login: 'user1' },
    };

    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockReaction),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = addCommentReaction.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'comment-1',
      reaction: 'thumbs-up',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: 'reaction-1',
      reaction: 'thumbs-up',
      author: 'user1',
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.post).toHaveBeenCalled();
  });

  it('should return "unknown" when author is missing', () => {
    const mockReaction = {
      id: 'reaction-2',
      reaction: 'heart',
      author: null,
    };

    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockReaction),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = addCommentReaction.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'comment-1',
      reaction: 'heart',
      settings: defaultSettings,
    });

    expect(result.author).toBe('unknown');
  });

  it('should post to the correct endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'r-1', reaction: 'laugh', author: { login: 'u1' } }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    addCommentReaction.aiTool.execute({
      issueId: 'DEMO-5',
      commentId: 'cmt-99',
      reaction: 'laugh',
      settings: defaultSettings,
    });

    const postCallUrl = mockConnection.post.mock.calls[0][0];
    expect(postCallUrl).toContain('/issues/DEMO-5/comments/cmt-99/reactions');
    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.$type).toBe('Reaction');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      addCommentReaction.aiTool.execute({
        commentId: 'comment-1',
        reaction: 'thumbs-up',
        settings: defaultSettings,
      })
    ).toThrow('ext_add_comment_reaction failed: issueId is required');
  });

  it('should throw when commentId is missing', () => {
    expect(() =>
      addCommentReaction.aiTool.execute({
        issueId: 'DEMO-1',
        reaction: 'thumbs-up',
        settings: defaultSettings,
      })
    ).toThrow('ext_add_comment_reaction failed: commentId is required');
  });

  it('should throw when reaction is missing', () => {
    expect(() =>
      addCommentReaction.aiTool.execute({
        issueId: 'DEMO-1',
        commentId: 'comment-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_add_comment_reaction failed: reaction is required');
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
      addCommentReaction.aiTool.execute({
        issueId: 'DEMO-1',
        commentId: 'missing-comment',
        reaction: 'thumbs-up',
        settings: defaultSettings,
      })
    ).toThrow('ext_add_comment_reaction failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(addCommentReaction.aiTool.annotations.readOnlyHint).toBe(false);
    expect(addCommentReaction.aiTool.annotations.destructiveHint).toBe(false);
    expect(addCommentReaction.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have outputSchema defined', () => {
    expect(addCommentReaction.aiTool.outputSchema).toBeDefined();
    expect(addCommentReaction.aiTool.outputSchema.properties.id).toBeDefined();
    expect(addCommentReaction.aiTool.outputSchema.properties.reaction).toBeDefined();
    expect(addCommentReaction.aiTool.outputSchema.properties.author).toBeDefined();
  });
});

export {};
