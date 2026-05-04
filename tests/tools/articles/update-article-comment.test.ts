jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/update-article-comment';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('update_article_comment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a comment and return id, text, and updated', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c-1', text: 'Updated text', updated: 1700000000000 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      articleId: 'A-1',
      commentId: 'c-1',
      text: 'Updated text',
      settings: TEST_SETTINGS,
    });

    expect(result).toEqual({ id: 'c-1', text: 'Updated text', updated: 1700000000000 });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should POST to /articles/{articleId}/comments/{commentId} endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c-7', text: 'Hello', updated: 1000000 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-5', commentId: 'c-7', text: 'Hello', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/articles/A-5/comments/c-7');
  });

  it('should send only the text in the request body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c-1', text: 'New text', updated: 1000000 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-1', commentId: 'c-1', text: 'New text', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body).toEqual({ text: 'New text' });
  });

  it('should throw when articleId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ commentId: 'c-1', text: 'Hello', settings: TEST_SETTINGS })
    ).toThrow('ext_update_article_comment failed:');
  });

  it('should throw when commentId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ articleId: 'A-1', text: 'Hello', settings: TEST_SETTINGS })
    ).toThrow('ext_update_article_comment failed:');
  });

  it('should throw when text is missing', () => {
    expect(() =>
      tool.aiTool.execute({ articleId: 'A-1', commentId: 'c-1', settings: TEST_SETTINGS })
    ).toThrow('ext_update_article_comment failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Comment not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ articleId: 'A-1', commentId: 'missing-c', text: 'Hello', settings: TEST_SETTINGS })
    ).toThrow('ext_update_article_comment failed:');
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with id, text, and updated properties', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.text).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.updated).toBeDefined();
  });
});

export {};
