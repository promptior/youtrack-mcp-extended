jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/delete-article-comment';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('delete_article_comment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a comment and return success', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', commentId: 'c-1', settings: TEST_SETTINGS });

    expect(result).toEqual({ success: true });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should call DELETE on /articles/{articleId}/comments/{commentId} path', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-5', commentId: 'c-7', settings: TEST_SETTINGS });

    const path = mockConnection.delete.mock.calls[0][0];
    expect(path).toContain('/articles/A-5/comments/c-7');
  });

  it('should throw when articleId is missing', () => {
    expect(() => tool.aiTool.execute({ commentId: 'c-1', settings: TEST_SETTINGS })).toThrow(
      'ext_delete_article_comment failed:'
    );
  });

  it('should throw when commentId is missing', () => {
    expect(() => tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS })).toThrow(
      'ext_delete_article_comment failed:'
    );
  });

  it('should throw when both articleId and commentId are missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_delete_article_comment failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Comment not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ articleId: 'A-1', commentId: 'missing-c', settings: TEST_SETTINGS })
    ).toThrow('ext_delete_article_comment failed:');
  });

  it('should have correct destructive annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(true);
  });

  it('should have a valid outputSchema with success property', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.success).toBeDefined();
  });
});

export {};
