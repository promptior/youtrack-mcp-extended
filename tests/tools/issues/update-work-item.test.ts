jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const updateWorkItem = require('../../../src/tools/issues/update-work-item');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('update_timetracking_work_item', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a work item and return the updated data', () => {
    const mockResult = {
      id: 'wi-1',
      duration: { minutes: 90 },
      text: 'Fixed the login bug',
      date: 1700000000000,
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

    const result = updateWorkItem.aiTool.execute({
      issueId: 'DEMO-1',
      workItemId: 'wi-1',
      duration: 90,
      description: 'Fixed the login bug',
      date: 1700000000000,
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: 'wi-1',
      duration: 90,
      description: 'Fixed the login bug',
      date: 1700000000000,
      type: null,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.post).toHaveBeenCalled();
  });

  it('should return undefined duration when not in response', () => {
    const mockResult = {
      id: 'wi-2',
      duration: null,
      text: 'Some work',
      date: null,
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

    const result = updateWorkItem.aiTool.execute({
      issueId: 'DEMO-1',
      workItemId: 'wi-2',
      settings: defaultSettings,
    });

    expect(result.duration).toBeUndefined();
  });

  it('should post to the correct endpoint with fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'wi-3', duration: { minutes: 30 }, text: '', date: null }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    updateWorkItem.aiTool.execute({
      issueId: 'DEMO-7',
      workItemId: 'wi-3',
      duration: 30,
      settings: defaultSettings,
    });

    const postCallUrl = mockConnection.post.mock.calls[0][0];
    expect(postCallUrl).toContain('/issues/DEMO-7/timeTracking/workItems/wi-3');
    expect(postCallUrl).toContain('fields=');
  });

  it('should build body with duration as minutes object', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'wi-4', duration: { minutes: 60 }, text: null, date: null }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    updateWorkItem.aiTool.execute({
      issueId: 'DEMO-1',
      workItemId: 'wi-4',
      duration: 60,
      settings: defaultSettings,
    });

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.duration).toEqual({ minutes: 60 });
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
        response: JSON.stringify({ id: 'wi-5', duration: null, text: null, date: null }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    updateWorkItem.aiTool.execute({
      issueId: 'DEMO-1',
      workItemId: 'wi-5',
      workType: 'Development',
      settings: defaultSettings,
    });

    const getUrl = mockConnection.get.mock.calls[0][0];
    expect(getUrl).toContain('/admin/timeTrackingSettings/workItemTypes');

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.type).toEqual({ id: 'wt-1' });
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      updateWorkItem.aiTool.execute({
        workItemId: 'wi-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_update_timetracking_work_item failed: issueId is required');
  });

  it('should throw when workItemId is missing', () => {
    expect(() =>
      updateWorkItem.aiTool.execute({
        issueId: 'DEMO-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_update_timetracking_work_item failed: workItemId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Work item not found',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      updateWorkItem.aiTool.execute({
        issueId: 'DEMO-1',
        workItemId: 'nonexistent-wi',
        settings: defaultSettings,
      })
    ).toThrow('ext_update_timetracking_work_item failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(updateWorkItem.aiTool.annotations.readOnlyHint).toBe(false);
    expect(updateWorkItem.aiTool.annotations.destructiveHint).toBe(false);
    expect(updateWorkItem.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have outputSchema defined', () => {
    expect(updateWorkItem.aiTool.outputSchema).toBeDefined();
    expect(updateWorkItem.aiTool.outputSchema.properties.id).toBeDefined();
    expect(updateWorkItem.aiTool.outputSchema.properties.duration).toBeDefined();
    expect(updateWorkItem.aiTool.outputSchema.properties.description).toBeDefined();
    expect(updateWorkItem.aiTool.outputSchema.properties.date).toBeDefined();
  });
});

export {};
