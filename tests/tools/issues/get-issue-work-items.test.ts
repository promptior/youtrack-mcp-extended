jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/get-issue-work-items');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('get_issue_work_items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return work items with mapped fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          {
            id: 'wi-1',
            date: 1700000000000,
            duration: { minutes: 90 },
            text: 'Fixed login bug',
            author: { login: 'jdoe', name: 'John Doe' },
            type: { name: 'Development' },
          },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({
      workItems: [
        {
          id: 'wi-1',
          date: 1700000000000,
          duration: 90,
          description: 'Fixed login bug',
          author: { login: 'jdoe', name: 'John Doe' },
          type: { name: 'Development' },
        },
      ],
    });
  });

  it('should GET /issues/{issueId}/timeTracking/workItems with fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '[]' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/issues/DEMO-1/timeTracking/workItems');
    expect(url).toContain('fields=');
  });

  it('should return empty array when no work items', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '[]' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({ workItems: [] });
  });

  it('should handle missing duration and worktype gracefully', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          {
            id: 'wi-2',
            date: 1700000000000,
            duration: null,
            text: null,
            author: { login: 'a', name: 'A' },
            type: null,
          },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result.workItems[0].duration).toBe(0);
    expect(result.workItems[0].type).toBeNull();
    expect(result.workItems[0].description).toBe('');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ settings: defaultSettings })
    ).toThrow('ext_get_issue_work_items failed: issueId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'NOTFOUND-1', settings: defaultSettings })
    ).toThrow('ext_get_issue_work_items failed: YouTrack API error 404');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
