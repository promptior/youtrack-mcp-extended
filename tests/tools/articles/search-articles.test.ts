jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/search-articles';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('search_articles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return articles matching a search query', () => {
    const mockData = [
      {
        id: 'A-1',
        idReadable: 'DEMO-A-1',
        summary: 'How to deploy',
        content: 'Short content',
        created: 1000000,
        updated: 2000000,
        author: { login: 'user1', name: 'User One' },
        project: { id: 'DEMO', name: 'Demo Project' },
        tags: [{ name: 'deployment' }],
      },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ query: 'deploy', settings: TEST_SETTINGS });

    expect(result.articles).toHaveLength(1);
    expect(result.articles[0].summary).toBe('How to deploy');
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should return empty articles array when no results', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({}) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ settings: TEST_SETTINGS });

    expect(result).toEqual({ articles: [] });
  });

  it('should truncate content longer than 500 characters', () => {
    const longContent = 'A'.repeat(600);
    const mockData = [{ id: 'A-1', summary: 'Test', content: longContent }];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ settings: TEST_SETTINGS });

    expect(result.articles[0].content).toHaveLength(503); // 500 + '...'
    expect(result.articles[0].content).toMatch(/\.\.\.$/);

  });

  it('should not truncate content shorter than 500 characters', () => {
    const shortContent = 'Short article content.';
    const mockData = [{ id: 'A-1', summary: 'Test', content: shortContent }];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ settings: TEST_SETTINGS });

    expect(result.articles[0].content).toBe(shortContent);
  });

  it('should include query parameter in API URL when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'deployment guide', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('query=');
  });

  it('should include projectId filter when provided as a shortName', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ projectId: 'DEMO', settings: TEST_SETTINGS });

    // Single GET (only the search call, no admin/projects lookup needed for shortNames)
    expect(mockConnection.get).toHaveBeenCalledTimes(1);
    const url = mockConnection.get.mock.calls[0][0];
    expect(decodeURIComponent(url)).toContain('query=project: DEMO');
  });

  it('should resolve internal projectId (e.g. "0-0") to its shortName before building the query', () => {
    // YouTrack's `project:` query operator only accepts the shortName. The
    // tool should fetch /admin/projects/{id} to translate before searching.
    let call = 0;
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockImplementation((url: string) => {
        call += 1;
        if (call === 1 && url.startsWith('/admin/projects/')) {
          return { isSuccess: true, code: 200, response: JSON.stringify({ shortName: 'DEMO' }) };
        }
        return { isSuccess: true, code: 200, response: JSON.stringify([]) };
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ projectId: '0-0', settings: TEST_SETTINGS });

    expect(mockConnection.get).toHaveBeenCalledTimes(2);
    const adminUrl = mockConnection.get.mock.calls[0][0];
    expect(adminUrl).toContain('/admin/projects/0-0');
    const searchUrl = mockConnection.get.mock.calls[1][0];
    expect(decodeURIComponent(searchUrl)).toContain('query=project: DEMO');
  });

  it('should propagate a clear error when an internal projectId cannot be resolved', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ projectId: '9-99', settings: TEST_SETTINGS })
    ).toThrow(/Could not resolve projectId "9-99".*Pass the project shortName/);
  });

  it('should use default top=20 when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('%24top=20');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 500, response: 'Server Error' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_search_articles failed:');
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });
});

export {};
