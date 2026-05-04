jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/search-issues');

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('search_issues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return issues matching the query and project customFields onto flat priority/state/type/assignee', () => {
    const apiIssues = [
      {
        id: '2-1',
        idReadable: 'DEMO-1',
        summary: 'Fix login bug',
        description: 'Users cannot log in',
        created: 1700000000000,
        updated: 1700001000000,
        resolved: null,
        project: { id: 'DEMO', name: 'Demo Project' },
        tags: [{ name: 'urgent' }],
        customFields: [
          { name: 'Priority', value: { name: 'Critical' } },
          { name: 'State', value: { name: 'Open' } },
          { name: 'Type', value: { name: 'Bug' } },
          { name: 'Assignee', value: { login: 'alice', name: 'Alice' } },
        ],
      },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(apiIssues),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ query: 'project = DEMO', settings: defaultSettings });

    expect(result).toEqual({
      issues: [
        {
          id: '2-1',
          idReadable: 'DEMO-1',
          summary: 'Fix login bug',
          description: 'Users cannot log in',
          created: 1700000000000,
          updated: 1700001000000,
          resolved: null,
          project: { id: 'DEMO', name: 'Demo Project' },
          tags: [{ name: 'urgent' }],
          priority: { name: 'Critical' },
          state: { name: 'Open' },
          type: { name: 'Bug' },
          assignee: { login: 'alice', name: 'Alice' },
        },
      ],
      returnedCount: 1,
      hasMore: false,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.get).toHaveBeenCalledWith(
      expect.stringContaining('/issues')
    );
  });

  it('should set hasMore=true when more than top results are returned (sentinel)', () => {
    const make = (i: number) => ({ id: `2-${i}`, idReadable: `DEMO-${i}` });
    const apiIssues = [make(1), make(2), make(3)];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(apiIssues),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ query: 'project = DEMO', top: 2, settings: defaultSettings });

    expect(result.returnedCount).toBe(2);
    expect(result.hasMore).toBe(true);
    expect(result.issues).toHaveLength(2);
    const getUrl: string = mockConnection.get.mock.calls[0][0];
    // top+1 sentinel pattern: we asked top=2 → API request top=3
    expect(getUrl).toContain('%24top=3');
  });

  it('should use default top=10 and skip=0 when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ query: '#unresolved', settings: defaultSettings });

    expect(result).toEqual({ issues: [], returnedCount: 0, hasMore: false });
    const getUrl: string = mockConnection.get.mock.calls[0][0];
    // top+1 sentinel pattern: default top=10 → API request top=11
    expect(getUrl).toContain('%24top=11');
    expect(getUrl).toContain('%24skip=0');
  });

  it('should respect custom top and skip parameters', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: '#unresolved', top: 25, skip: 50, settings: defaultSettings });

    const getUrl: string = mockConnection.get.mock.calls[0][0];
    // top+1 sentinel pattern
    expect(getUrl).toContain('%24top=26');
    expect(getUrl).toContain('%24skip=50');
  });

  it('should throw when query is missing', () => {
    expect(() => tool.aiTool.execute({ settings: defaultSettings })).toThrow(
      'ext_search_issues failed: query is required'
    );
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 400, response: 'Bad query' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ query: 'bad query', settings: defaultSettings })
    ).toThrow('ext_search_issues failed:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.issues).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.returnedCount).toBeDefined();
  });
});

export {};
