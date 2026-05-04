jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/update-article';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('update_article', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update an article and return updated metadata', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'A-1', idReadable: 'PROJ-A-1', summary: 'Updated Title' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      articleId: 'A-1',
      summary: 'Updated Title',
      settings: TEST_SETTINGS,
    });

    expect(result).toEqual({ id: 'A-1', idReadable: 'PROJ-A-1', summary: 'Updated Title', content: '' });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should POST to /articles/{articleId} endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'A-42', idReadable: 'PROJ-A-42', summary: 'Title' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-42', summary: 'Title', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/articles/A-42');
  });

  it('should include summary in body when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'A-1', idReadable: 'PROJ-A-1', summary: 'New Title' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-1', summary: 'New Title', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.summary).toBe('New Title');
    expect(body.content).toBeUndefined();
  });

  it('should include content in body when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'A-1', idReadable: 'PROJ-A-1', summary: 'Title' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-1', content: 'New content', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.content).toBe('New content');
    expect(body.summary).toBeUndefined();
  });

  it('should include both summary and content when both are provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'A-1', idReadable: 'PROJ-A-1', summary: 'New Title' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-1', summary: 'New Title', content: 'New content', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.summary).toBe('New Title');
    expect(body.content).toBe('New content');
  });

  it('should throw when articleId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ summary: 'New Title', settings: TEST_SETTINGS })
    ).toThrow('ext_update_article failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Article not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ articleId: 'missing-article', summary: 'Title', settings: TEST_SETTINGS })
    ).toThrow('ext_update_article failed:');
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with id, idReadable, and summary properties', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.idReadable).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.summary).toBeDefined();
  });
});

export {};
