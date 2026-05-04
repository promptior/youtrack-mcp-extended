jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/get-article-comments';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_article_comments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return comments for an article', () => {
    const mockData = [
      {
        id: 'comment-1',
        text: 'Great article!',
        created: 1000000,
        updated: 1000000,
        author: { login: 'user1', name: 'User One' },
      },
      {
        id: 'comment-2',
        text: 'Very helpful.',
        created: 2000000,
        updated: 2000000,
        author: { login: 'user2', name: 'User Two' },
      },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    expect(result.comments).toHaveLength(2);
    expect(result.comments[0].id).toBe('comment-1');
    expect(result.comments[1].id).toBe('comment-2');
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should return empty array when no comments exist', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({}) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    expect(result).toEqual({ comments: [] });
  });

  it('should include articleId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-99', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/articles/A-99/comments');
  });

  it('should use default top=50 and skip=0 when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('%24top=50');
    expect(url).toContain('%24skip=0');
  });

  it('should throw when articleId is missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_get_article_comments failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not Found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ articleId: 'bad-id', settings: TEST_SETTINGS })).toThrow(
      'ext_get_article_comments failed:'
    );
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
