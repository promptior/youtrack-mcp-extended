jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/get-sub-articles';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_sub_articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return child articles for a parent article', () => {
    const mockData = {
      childArticles: [
        {
          id: 'A-2',
          idReadable: 'PROJ-A-2',
          summary: 'Child Article One',
          created: 1000000,
          updated: 2000000,
          author: { login: 'user1', name: 'User One' },
        },
        {
          id: 'A-3',
          idReadable: 'PROJ-A-3',
          summary: 'Child Article Two',
          created: 3000000,
          updated: 4000000,
          author: { login: 'user2', name: 'User Two' },
        },
      ],
    };
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    expect(result.childArticles).toHaveLength(2);
    expect(result.childArticles[0].id).toBe('A-2');
    expect(result.childArticles[1].summary).toBe('Child Article Two');
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should return empty childArticles when response has no childArticles key', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({}) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    expect(result).toEqual({ childArticles: [] });
  });

  it('should GET /articles/{articleId} with childArticles field expansion', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({ childArticles: [] }) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-55', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/articles/A-55');
    expect(url).toContain('childArticles');
  });

  it('should throw when articleId is missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_get_sub_articles failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Article not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ articleId: 'missing-article', settings: TEST_SETTINGS })).toThrow(
      'ext_get_sub_articles failed:'
    );
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with childArticles property', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.childArticles).toBeDefined();
  });
});

export {};
