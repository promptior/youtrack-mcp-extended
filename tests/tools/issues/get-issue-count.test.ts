jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const getIssueCount = require('../../../src/tools/issues/get-issue-count');

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_issue_count', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should count issues with a valid query using POST', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ count: 42 }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueCount.aiTool.execute({ query: 'project = DEMO', settings: defaultSettings });

    expect(result).toEqual({ count: 42, query: 'project = DEMO' });
    expect(mockConnection.post).toHaveBeenCalledTimes(1);
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should send query in POST body, not as query param', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ count: 5 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    getIssueCount.aiTool.execute({ query: 'project = DEMO', settings: defaultSettings });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.query).toBe('project = DEMO');
  });

  it('should return count: -1 with calculating flag when YouTrack is still counting after the retry budget is exhausted', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ count: -1 }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueCount.aiTool.execute({ query: 'project = DEMO', settings: defaultSettings });

    expect(result.count).toBe(-1);
    expect(result.calculating).toBe(true);
    // The tool retries (each attempt is a network round-trip) before giving up.
    expect(mockConnection.post.mock.calls.length).toBeGreaterThan(1);
  });

  it('should poll until YouTrack returns the actual count and stop early', () => {
    let attempt = 0;
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockImplementation(() => {
        attempt += 1;
        const count = attempt < 3 ? -1 : 42;
        return { isSuccess: true, code: 200, response: JSON.stringify({ count }) };
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueCount.aiTool.execute({ query: 'project = DEMO', settings: defaultSettings });

    expect(result).toEqual({ count: 42, query: 'project = DEMO' });
    expect(mockConnection.post).toHaveBeenCalledTimes(3);
  });

  it('should throw error when query is missing', () => {
    expect(() => {
      getIssueCount.aiTool.execute({ settings: defaultSettings });
    }).toThrow('ext_get_issue_count failed: query parameter is required');
  });

  it('should handle API errors gracefully', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 400,
        response: 'Invalid query',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => {
      getIssueCount.aiTool.execute({ query: 'invalid', settings: defaultSettings });
    }).toThrow('ext_get_issue_count failed: YouTrack API error 400:');
  });

  it('should have correct annotations', () => {
    expect(getIssueCount.aiTool.annotations.readOnlyHint).toBe(true);
    expect(getIssueCount.aiTool.annotations.destructiveHint).toBe(false);
    expect(getIssueCount.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(getIssueCount.aiTool.outputSchema).toBeDefined();
    expect(getIssueCount.aiTool.outputSchema.properties.count).toBeDefined();
    expect(getIssueCount.aiTool.outputSchema.properties.query).toBeDefined();
  });
});

export {};
