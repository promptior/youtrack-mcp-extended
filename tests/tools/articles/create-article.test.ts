jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/create-article';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

const mockProject = { id: '0-0', shortName: 'PROJ' };

function makeConnection(postResponse: object) {
  return {
    addHeader: jest.fn(),
    get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockProject) }),
    post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(postResponse) }),
  };
}

describe('create_article', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an article and return metadata', () => {
    const mockConnection = makeConnection({ id: 'A-1', idReadable: 'PROJ-A-1', summary: 'My Article' });
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      summary: 'My Article',
      content: 'Some content',
      projectId: 'PROJ',
      settings: TEST_SETTINGS,
    });

    expect(result).toEqual({
      id: 'A-1',
      idReadable: 'PROJ-A-1',
      summary: 'My Article',
      content: '',
      project: null,
      parentArticle: null,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should POST to /articles endpoint', () => {
    const mockConnection = makeConnection({ id: 'A-2', idReadable: 'PROJ-A-2', summary: 'Test' });
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ summary: 'Test', content: 'Content', projectId: 'PROJ', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/articles');
  });

  it('should resolve project shortName to internal ID in the request body', () => {
    const mockConnection = makeConnection({ id: 'A-3', idReadable: 'PROJ-A-3', summary: 'Test' });
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ summary: 'Test', content: 'Content', projectId: 'PROJ', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.project).toEqual({ id: '0-0' });
    expect(body.summary).toBe('Test');
    expect(body.content).toBe('Content');
  });

  it('should include parentArticle in body when parentArticleId is provided', () => {
    const mockConnection = makeConnection({ id: 'A-4', idReadable: 'PROJ-A-4', summary: 'Sub Article' });
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      summary: 'Sub Article',
      content: 'Sub content',
      projectId: 'PROJ',
      parentArticleId: 'A-1',
      settings: TEST_SETTINGS,
    });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.parentArticle).toEqual({ id: 'A-1' });
  });

  it('should not include parentArticle in body when parentArticleId is not provided', () => {
    const mockConnection = makeConnection({ id: 'A-5', idReadable: 'PROJ-A-5', summary: 'Root Article' });
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ summary: 'Root Article', content: 'Content', projectId: 'PROJ', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.parentArticle).toBeUndefined();
  });

  it('should throw when project shortName is not found', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not Found' }),
      post: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ summary: 'Title', content: 'Content', projectId: 'NOTFOUND', settings: TEST_SETTINGS })
    ).toThrow('ext_create_article failed: Project not found: "NOTFOUND"');
  });

  it('should throw when summary is missing', () => {
    expect(() =>
      tool.aiTool.execute({ content: 'Content', projectId: 'PROJ', settings: TEST_SETTINGS })
    ).toThrow('ext_create_article failed:');
  });

  it('should throw when content is missing', () => {
    expect(() =>
      tool.aiTool.execute({ summary: 'Title', projectId: 'PROJ', settings: TEST_SETTINGS })
    ).toThrow('ext_create_article failed:');
  });

  it('should throw when projectId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ summary: 'Title', content: 'Content', settings: TEST_SETTINGS })
    ).toThrow('ext_create_article failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockProject) }),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ summary: 'Title', content: 'Content', projectId: 'PROJ', settings: TEST_SETTINGS })
    ).toThrow('ext_create_article failed:');
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });

  it('should have a valid outputSchema with id, idReadable, and summary properties', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.idReadable).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.summary).toBeDefined();
  });
});

export {};
