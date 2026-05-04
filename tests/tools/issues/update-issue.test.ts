jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/update-issue');

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('update_issue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update the summary of an issue', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1', idReadable: 'DEMO-1', summary: 'Updated summary' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      summary: 'Updated summary',
      settings: defaultSettings,
    });

    expect(result).toEqual({ id: '2-1', idReadable: 'DEMO-1', summary: 'Updated summary', description: '' });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.post).toHaveBeenCalledWith(
      expect.stringContaining('/issues/DEMO-1'),
      'application/json',
      expect.stringContaining('"summary":"Updated summary"')
    );
  });

  it('should update the description of an issue', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1', idReadable: 'DEMO-1', summary: 'Existing summary' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      issueId: 'DEMO-1',
      description: 'New description text',
      settings: defaultSettings,
    });

    const bodyArg: string = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyArg);
    expect(body.description).toBe('New description text');
    expect(body.summary).toBeUndefined();
  });

  it('should update both summary and description together', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1', idReadable: 'DEMO-1', summary: 'New summary' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      issueId: 'DEMO-1',
      summary: 'New summary',
      description: 'New description',
      settings: defaultSettings,
    });

    const bodyArg: string = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyArg);
    expect(body.summary).toBe('New summary');
    expect(body.description).toBe('New description');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ summary: 'New summary', settings: defaultSettings })
    ).toThrow('update_issue failed: issueId is required');
  });

  it('should throw when neither summary nor description is provided', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings })
    ).toThrow('update_issue failed: at least one of summary or description must be provided');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-999', summary: 'Fix', settings: defaultSettings })
    ).toThrow('update_issue failed:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.idReadable).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.summary).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.description).toBeDefined();
  });

  it('should return description from the API response', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: '2-1',
          idReadable: 'DEMO-1',
          summary: 'Existing summary',
          description: 'Updated body',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      description: 'Updated body',
      settings: defaultSettings,
    });

    expect(result.description).toBe('Updated body');
  });
});

export {};
