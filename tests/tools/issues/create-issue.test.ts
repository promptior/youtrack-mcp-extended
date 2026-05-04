jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/create-issue');

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('create_issue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an issue with required fields only', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: '0-0', shortName: 'DEMO' }]),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-42', idReadable: 'DEMO-42', summary: 'New issue' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      summary: 'New issue',
      projectId: 'DEMO',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: '2-42',
      idReadable: 'DEMO-42',
      summary: 'New issue',
      description: '',
      priority: null,
      state: null,
      type: null,
      assignee: null,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.post).toHaveBeenCalledWith(
      expect.stringContaining('/issues'),
      'application/json',
      expect.stringContaining('"summary":"New issue"')
    );
  });

  it('should include description in body and apply type/assignee via /commands', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: '0-0', shortName: 'DEMO' }]),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-43', idReadable: 'DEMO-43', summary: 'Bug report' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      summary: 'Bug report',
      projectId: 'DEMO',
      description: 'Something is broken',
      assigneeLogin: 'alice',
      type: 'Bug',
      settings: defaultSettings,
    });

    // First POST creates the issue with summary/description/project only.
    const createBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(createBody.description).toBe('Something is broken');
    expect(createBody.assignee).toBeUndefined();
    expect(createBody.type).toBeUndefined();

    // Second POST runs /commands to set Type and Assignee.
    const commandsUrl = mockConnection.post.mock.calls[1][0];
    expect(commandsUrl).toContain('/commands');
    const commandsBody = JSON.parse(mockConnection.post.mock.calls[1][2]);
    expect(commandsBody.query).toBe('Type Bug for alice');
    expect(commandsBody.issues).toEqual([{ idReadable: 'DEMO-43' }]);
  });

  it('should not include optional fields when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: '0-0', shortName: 'DEMO' }]),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-44', idReadable: 'DEMO-44', summary: 'Simple issue' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ summary: 'Simple issue', projectId: 'DEMO', settings: defaultSettings });

    const bodyArg: string = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyArg);
    expect(body.assignee).toBeUndefined();
    expect(body.type).toBeUndefined();
    expect(body.description).toBeUndefined();
  });

  it('should throw when summary is missing', () => {
    expect(() =>
      tool.aiTool.execute({ projectId: 'DEMO', settings: defaultSettings })
    ).toThrow('ext_create_issue failed: summary is required');
  });

  it('should throw when projectId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ summary: 'Issue', settings: defaultSettings })
    ).toThrow('ext_create_issue failed: projectId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' }),
      post: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ summary: 'Issue', projectId: 'DEMO', settings: defaultSettings })
    ).toThrow('ext_create_issue failed:');
  });

  it('should throw when project shortName is not found', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: '1-1', shortName: 'OTHER' }]),
      }),
      post: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ summary: 'Issue', projectId: 'NOTFOUND', settings: defaultSettings })
    ).toThrow('ext_create_issue failed: Project not found: "NOTFOUND"');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.idReadable).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.summary).toBeDefined();
  });
});

export {};
