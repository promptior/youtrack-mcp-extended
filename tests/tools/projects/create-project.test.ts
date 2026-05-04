jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/projects/create-project');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('create_project', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should default leader to current user when leaderLogin is omitted', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1' }),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: '0-9',
          name: 'New Proj',
          shortName: 'NP',
          description: null,
          leader: { login: 'admin', name: 'admin' },
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      name: 'New Proj',
      shortName: 'NP',
      settings: defaultSettings,
    });

    const getUrl = mockConnection.get.mock.calls[0][0];
    expect(getUrl).toContain('/users/me');

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody).toEqual({
      name: 'New Proj',
      shortName: 'NP',
      leader: { id: '2-1' },
    });

    expect(result).toEqual({
      id: '0-9',
      name: 'New Proj',
      shortName: 'NP',
      description: null,
      leader: { login: 'admin', name: 'admin' },
    });
  });

  it('should resolve leaderLogin to id when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-7', login: 'alice' }),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: '0-10',
          name: 'A',
          shortName: 'A',
          leader: { login: 'alice', name: 'Alice' },
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      name: 'A',
      shortName: 'A',
      leaderLogin: 'alice',
      settings: defaultSettings,
    });

    const getUrl = mockConnection.get.mock.calls[0][0];
    expect(getUrl).toContain('/users/alice');

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.leader).toEqual({ id: '2-7' });
  });

  it('should include description in body when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1' }),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: '0-11',
          name: 'D',
          shortName: 'D',
          description: 'desc',
          leader: { login: 'admin', name: 'admin' },
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      name: 'D',
      shortName: 'D',
      description: 'desc',
      settings: defaultSettings,
    });

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.description).toBe('desc');
  });

  it('should throw when name is missing', () => {
    expect(() =>
      tool.aiTool.execute({ shortName: 'X', settings: defaultSettings })
    ).toThrow('ext_create_project failed: name is required');
  });

  it('should throw when shortName is missing', () => {
    expect(() =>
      tool.aiTool.execute({ name: 'X', settings: defaultSettings })
    ).toThrow('ext_create_project failed: shortName is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1' }),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 409,
        response: 'Project shortName already exists',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ name: 'X', shortName: 'DUP', settings: defaultSettings })
    ).toThrow('ext_create_project failed: YouTrack API error 409:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.shortName).toBeDefined();
  });
});

export {};
