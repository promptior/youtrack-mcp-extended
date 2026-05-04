jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/saved-queries/create-saved-query';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

function makeMockConnection(getMeResponse: object, postResponse: object) {
  return {
    addHeader: jest.fn(),
    get: jest.fn().mockReturnValue({
      isSuccess: true,
      code: 200,
      response: JSON.stringify(getMeResponse),
    }),
    post: jest.fn().mockReturnValue({
      isSuccess: true,
      code: 200,
      response: JSON.stringify(postResponse),
    }),
  };
}

describe('create_saved_query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve current user ID before creating the query', () => {
    const mockConn = makeMockConnection(
      { id: '1-42' },
      { id: 'sq-1', name: 'My Open Issues', query: 'project: DEMO and State: Open' }
    );
    mockHttp.Connection.mockReturnValue(mockConn);

    const result = tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      name: 'My Open Issues',
      query: 'project: DEMO and State: Open',
    });

    expect(result).toEqual({
      id: 'sq-1',
      name: 'My Open Issues',
      query: 'project: DEMO and State: Open',
    });
    // GET /users/me must be called
    expect(mockConn.get).toHaveBeenCalled();
    const getUrl = mockConn.get.mock.calls[0][0];
    expect(getUrl).toContain('/users/me');
  });

  it('should use the resolved user ID as owner in POST body', () => {
    const mockConn = makeMockConnection(
      { id: '1-42' },
      { id: 'sq-1', name: 'Q', query: 'State: Open' }
    );
    mockHttp.Connection.mockReturnValue(mockConn);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'Q', query: 'State: Open' });

    const body = JSON.parse(mockConn.post.mock.calls[0][2]);
    expect(body.owner).toEqual({ id: '1-42' });
  });

  it('should send shareAllProjects=true when isShared is true', () => {
    const mockConn = makeMockConnection(
      { id: '1-1' },
      { id: 'sq-2', name: 'Shared Query', query: 'State: Open' }
    );
    mockHttp.Connection.mockReturnValue(mockConn);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'Shared Query', query: 'State: Open', isShared: true });

    const body = JSON.parse(mockConn.post.mock.calls[0][2]);
    expect(body.shareAllProjects).toBe(true);
  });

  it('should default shareAllProjects to false when isShared is not provided', () => {
    const mockConn = makeMockConnection(
      { id: '1-1' },
      { id: 'sq-3', name: 'Private Query', query: 'State: Open' }
    );
    mockHttp.Connection.mockReturnValue(mockConn);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'Private Query', query: 'State: Open' });

    const body = JSON.parse(mockConn.post.mock.calls[0][2]);
    expect(body.shareAllProjects).toBe(false);
  });

  it('should throw when name is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'State: Open' })
    ).toThrow('ext_create_saved_query failed:');
  });

  it('should throw when query is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'My Query' })
    ).toThrow('ext_create_saved_query failed:');
  });

  it('should throw when GET /users/me fails', () => {
    const mockConn = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 401, response: 'Unauthorized' }),
      post: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConn);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'Q', query: 'State: Open' })
    ).toThrow('ext_create_saved_query failed:');
  });

  it('should throw when POST /savedQueries fails', () => {
    const mockConn = makeMockConnection({ id: '1-1' }, {});
    mockConn.post.mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' });
    mockHttp.Connection.mockReturnValue(mockConn);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'Q', query: 'State: Open' })
    ).toThrow('ext_create_saved_query failed: YouTrack API error 403:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema with required fields', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.name).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.query).toBeDefined();
  });
});

export {};
