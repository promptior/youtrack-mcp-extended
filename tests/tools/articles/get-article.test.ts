jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/get-article';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_article', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return full article details', () => {
    const mockArticle = {
      id: 'A-1',
      idReadable: 'DEMO-A-1',
      summary: 'Getting Started Guide',
      content: '# Welcome\n\nThis is the guide.',
      created: 1000000,
      updated: 2000000,
      author: { login: 'admin', name: 'Admin User' },
      project: { id: 'DEMO', name: 'Demo Project' },
      tags: [{ name: 'guide' }],
      childArticles: [{ id: 'A-2', idReadable: 'DEMO-A-2', summary: 'Sub Article' }],
      parentArticle: null,
      attachments: [],
    };
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockArticle) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    expect(result).toEqual({ article: mockArticle });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should include articleId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({ id: 'A-42' }) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-42', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/articles/A-42');
  });

  it('should throw when articleId is missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_get_article failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Article not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ articleId: 'missing-article', settings: TEST_SETTINGS })).toThrow(
      'ext_get_article failed:'
    );
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with article property', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.article).toBeDefined();
  });
});

export {};
