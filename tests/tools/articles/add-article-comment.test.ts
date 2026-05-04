jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/add-article-comment';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('add_article_comment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a comment and return id, text, and created', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c-1', text: 'Great article!', created: 1700000000000 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', text: 'Great article!', settings: TEST_SETTINGS });

    expect(result).toEqual({ id: 'c-1', text: 'Great article!', created: 1700000000000, author: null });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should POST to /articles/{articleId}/comments endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c-2', text: 'Hello', created: 1000000 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-99', text: 'Hello', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/articles/A-99/comments');
  });

  it('should send usesMarkdown: true in the request body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'c-3', text: 'My comment', created: 1000000 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-1', text: 'My comment', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.text).toBe('My comment');
    expect(body.usesMarkdown).toBe(true);
  });

  it('should throw when articleId is missing', () => {
    expect(() => tool.aiTool.execute({ text: 'Hello', settings: TEST_SETTINGS })).toThrow(
      'ext_add_article_comment failed:'
    );
  });

  it('should throw when text is missing', () => {
    expect(() => tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS })).toThrow(
      'ext_add_article_comment failed:'
    );
  });

  it('should throw when both articleId and text are missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_add_article_comment failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ articleId: 'A-1', text: 'Hello', settings: TEST_SETTINGS })).toThrow(
      'ext_add_article_comment failed:'
    );
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });

  it('should have a valid outputSchema with id, text, and created properties', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.text).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.created).toBeDefined();
  });
});

export {};
