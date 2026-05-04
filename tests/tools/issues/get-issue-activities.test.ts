jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const getIssueActivities = require('../../../src/tools/issues/get-issue-activities');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('get_issue_activities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should flatten field/added/removed objects to plain strings', () => {
    const rawActivities = [
      {
        id: 'activity-1',
        $type: 'CustomFieldActivityItem',
        timestamp: 1700000000000,
        author: { login: 'user1', name: 'User One' },
        field: { name: 'State', presentation: 'State' },
        added: [{ name: 'In Progress', presentation: 'In Progress' }],
        removed: [{ name: 'To do', presentation: 'To do' }],
      },
    ];

    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(rawActivities),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueActivities.aiTool.execute({
      issueId: 'DEMO-1',
      settings: defaultSettings,
    });

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0]).toEqual({
      id: 'activity-1',
      type: 'CustomFieldActivityItem',
      timestamp: 1700000000000,
      author: { login: 'user1', name: 'User One' },
      field: 'State',
      added: ['In Progress'],
      removed: ['To do'],
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should accept scalar added/removed values without crashing', () => {
    const rawActivities = [
      {
        id: 'activity-2',
        $type: 'CustomFieldActivityItem',
        timestamp: 1700000000001,
        author: { login: 'user1', name: 'User One' },
        field: { name: 'Estimation' },
        added: 60,
        removed: null,
      },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(rawActivities),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueActivities.aiTool.execute({
      issueId: 'DEMO-1',
      settings: defaultSettings,
    });

    expect(result.activities[0].added).toEqual([60]);
    expect(result.activities[0].removed).toEqual([]);
  });

  it('should return empty activities array when none present', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueActivities.aiTool.execute({
      issueId: 'DEMO-1',
      settings: defaultSettings,
    });

    expect(result).toEqual({ activities: [] });
  });

  it('should apply categories filter when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    getIssueActivities.aiTool.execute({
      issueId: 'DEMO-1',
      categories: 'CommentsCategory,SummaryCategory',
      settings: defaultSettings,
    });

    const getCallUrl = mockConnection.get.mock.calls[0][0];
    expect(getCallUrl).toContain('categories=');
  });

  it('should include default categories when categories is not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    getIssueActivities.aiTool.execute({
      issueId: 'DEMO-1',
      settings: defaultSettings,
    });

    const getCallUrl = mockConnection.get.mock.calls[0][0];
    expect(getCallUrl).toContain('categories=');
    expect(getCallUrl).toContain('CommentsCategory');
  });

  it('should apply reverse flag when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    getIssueActivities.aiTool.execute({
      issueId: 'DEMO-1',
      reverse: true,
      settings: defaultSettings,
    });

    const getCallUrl = mockConnection.get.mock.calls[0][0];
    expect(getCallUrl).toContain('reverse=true');
  });

  it('should apply top and skip pagination', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    getIssueActivities.aiTool.execute({
      issueId: 'DEMO-1',
      top: 10,
      skip: 20,
      settings: defaultSettings,
    });

    const getCallUrl = mockConnection.get.mock.calls[0][0];
    expect(getCallUrl).toContain('%24top=10');
    expect(getCallUrl).toContain('%24skip=20');
  });

  it('should throw with valid-category list when an unknown category is requested', () => {
    // YouTrack silently returns [] for unknown categories. The tool validates
    // up-front so the caller does not assume the issue has no activities.
    expect(() =>
      getIssueActivities.aiTool.execute({
        issueId: 'DEMO-1',
        categories: 'BogusCategory',
        settings: defaultSettings,
      })
    ).toThrow(/Unknown activity category: BogusCategory.*Valid categories/);
  });

  it('should throw and list all unknown categories when several are passed', () => {
    expect(() =>
      getIssueActivities.aiTool.execute({
        issueId: 'DEMO-1',
        categories: 'CommentsCategory,Bogus1,Bogus2',
        settings: defaultSettings,
      })
    ).toThrow(/Unknown activity categories: Bogus1, Bogus2/);
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      getIssueActivities.aiTool.execute({ settings: defaultSettings })
    ).toThrow('ext_get_issue_activities failed: issueId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Issue not found',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      getIssueActivities.aiTool.execute({ issueId: 'NOTFOUND-1', settings: defaultSettings })
    ).toThrow('ext_get_issue_activities failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(getIssueActivities.aiTool.annotations.readOnlyHint).toBe(true);
    expect(getIssueActivities.aiTool.annotations.destructiveHint).toBe(false);
    expect(getIssueActivities.aiTool.annotations.idempotentHint).toBe(true);
  });
});

export {};
