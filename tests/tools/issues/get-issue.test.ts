jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/get-issue');

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

const mockIssueData = {
  id: '2-1',
  idReadable: 'DEMO-1',
  summary: 'Fix login bug',
  description: 'Users cannot log in on mobile',
  created: 1700000000000,
  updated: 1700001000000,
  resolved: null,
  reporter: { login: 'bob', name: 'Bob' },
  project: { id: 'DEMO', name: 'Demo Project' },
  tags: [{ name: 'urgent' }],
  customFields: [
    { name: 'Priority', value: { name: 'Critical' } },
    { name: 'State', value: { name: 'In Progress' } },
    { name: 'Type', value: { name: 'Bug' } },
    { name: 'Assignee', value: { login: 'alice', name: 'Alice' } },
    { name: 'Fix versions', value: { name: '1.0' } },
  ],
};

const expectedProjection = {
  id: '2-1',
  idReadable: 'DEMO-1',
  summary: 'Fix login bug',
  description: 'Users cannot log in on mobile',
  created: 1700000000000,
  updated: 1700001000000,
  resolved: null,
  priority: { name: 'Critical' },
  state: { name: 'In Progress' },
  type: { name: 'Bug' },
  assignee: { login: 'alice', name: 'Alice' },
  reporter: { login: 'bob', name: 'Bob' },
  project: { id: 'DEMO', name: 'Demo Project' },
  tags: [{ name: 'urgent' }],
  customFields: mockIssueData.customFields,
};

describe('get_issue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return full issue details', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockIssueData),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual(expectedProjection);
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.get).toHaveBeenCalledWith(
      expect.stringContaining('/issues/DEMO-1')
    );
  });

  it('should include customFields in the fields query parameter', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockIssueData),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    const getUrl: string = mockConnection.get.mock.calls[0][0];
    expect(getUrl).toContain('customFields');
  });

  it('should throw when issueId is missing', () => {
    expect(() => tool.aiTool.execute({ settings: defaultSettings })).toThrow(
      'ext_get_issue failed: issueId is required'
    );
  });

  it('should throw on API error (e.g. issue not found)', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-999', settings: defaultSettings })
    ).toThrow('ext_get_issue failed:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.summary).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.customFields).toBeDefined();
  });
});

export {};
