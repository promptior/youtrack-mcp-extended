jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const deleteCommentReaction = require('../../../src/tools/issues/delete-comment-reaction');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('delete_comment_reaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a reaction and return success', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: '',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = deleteCommentReaction.aiTool.execute({
      issueId: 'DEMO-1',
      commentId: 'comment-1',
      reactionId: 'reaction-1',
      settings: defaultSettings,
    });

    expect(result).toEqual({ success: true });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.delete).toHaveBeenCalled();
  });

  it('should call delete on the correct path', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: '',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    deleteCommentReaction.aiTool.execute({
      issueId: 'DEMO-5',
      commentId: 'cmt-10',
      reactionId: 'rxn-99',
      settings: defaultSettings,
    });

    const deletePath = mockConnection.delete.mock.calls[0][0];
    expect(deletePath).toContain('/issues/DEMO-5/comments/cmt-10/reactions/rxn-99');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      deleteCommentReaction.aiTool.execute({
        commentId: 'comment-1',
        reactionId: 'reaction-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_comment_reaction failed: issueId is required');
  });

  it('should throw when commentId is missing', () => {
    expect(() =>
      deleteCommentReaction.aiTool.execute({
        issueId: 'DEMO-1',
        reactionId: 'reaction-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_comment_reaction failed: commentId is required');
  });

  it('should throw when reactionId is missing', () => {
    expect(() =>
      deleteCommentReaction.aiTool.execute({
        issueId: 'DEMO-1',
        commentId: 'comment-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_comment_reaction failed: reactionId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 403,
        response: 'Forbidden',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      deleteCommentReaction.aiTool.execute({
        issueId: 'DEMO-1',
        commentId: 'comment-1',
        reactionId: 'reaction-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_comment_reaction failed: YouTrack API error 403:');
  });

  it('should have correct annotations', () => {
    expect(deleteCommentReaction.aiTool.annotations.readOnlyHint).toBe(false);
    expect(deleteCommentReaction.aiTool.annotations.destructiveHint).toBe(true);
    expect(deleteCommentReaction.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have outputSchema defined', () => {
    expect(deleteCommentReaction.aiTool.outputSchema).toBeDefined();
    expect(deleteCommentReaction.aiTool.outputSchema.properties.success).toBeDefined();
  });
});

export {};
