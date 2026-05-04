jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/log-work');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('log_work', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log a work item on an issue', () => {
    const mockResult = {
      id: 'workitem-1',
      date: 1700000000000,
      duration: { minutes: 60 },
      text: 'Worked on feature',
      author: { login: 'user1', name: 'User One' },
    };

    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockResult),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      duration: 60,
      date: 1700000000000,
      description: 'Worked on feature',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: 'workitem-1',
      date: 1700000000000,
      duration: 60,
      description: 'Worked on feature',
      type: null,
      author: { login: 'user1', name: 'User One' },
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.post).toHaveBeenCalled();
  });

  it('should resolve workType name to id and send {id} in body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'wt-1', name: 'Development' },
          { id: 'wt-2', name: 'Testing' },
        ]),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'wi-1', date: 1700000000000, duration: { minutes: 90 }, text: null }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      issueId: 'DEMO-1',
      duration: 90,
      date: 1700000000000,
      workType: 'Testing',
      settings: defaultSettings,
    });

    const getUrl = mockConnection.get.mock.calls[0][0];
    expect(getUrl).toContain('/admin/timeTrackingSettings/workItemTypes');

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.duration).toEqual({ minutes: 90 });
    expect(postBody.date).toBe(1700000000000);
    expect(postBody.type).toEqual({ id: 'wt-2' });
  });

  it('should throw with available types listed when workType is unknown', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: 'wt-1', name: 'Development' }]),
      }),
      post: jest.fn(),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({
        issueId: 'DEMO-1',
        duration: 30,
        workType: 'Bogus',
        settings: defaultSettings,
      })
    ).toThrow(/Unknown workType "Bogus".*Development/);
  });

  it('should use current time when date is not provided', () => {
    const before = Date.now();

    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'wi-1', date: before, duration: { minutes: 30 } }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', duration: 30, settings: defaultSettings });

    const after = Date.now();
    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.date).toBeGreaterThanOrEqual(before);
    expect(postBody.date).toBeLessThanOrEqual(after);
  });

  it('should not include text or type when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'wi-1', date: 1700000000000, duration: { minutes: 60 } }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', duration: 60, date: 1700000000000, settings: defaultSettings });

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.text).toBeUndefined();
    expect(postBody.type).toBeUndefined();
  });

  it('should fall back to ctx.duration when API response has no duration', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'wi-1', date: 1700000000000 }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      duration: 45,
      date: 1700000000000,
      settings: defaultSettings,
    });

    expect(result.duration).toBe(45);
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ duration: 60, settings: defaultSettings })
    ).toThrow('ext_log_work failed: issueId is required');
  });

  it('should throw when duration is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings })
    ).toThrow('ext_log_work failed: duration is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 403,
        response: 'Time tracking is disabled',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', duration: 60, settings: defaultSettings })
    ).toThrow('ext_log_work failed: YouTrack API error 403:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.duration).toBeDefined();
  });
});

export {};
