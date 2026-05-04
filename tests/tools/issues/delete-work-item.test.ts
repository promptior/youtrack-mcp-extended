jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const deleteWorkItem = require('../../../src/tools/issues/delete-work-item');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('delete_work_item', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a work item and return success', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: '',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = deleteWorkItem.aiTool.execute({
      issueId: 'DEMO-1',
      workItemId: 'wi-99',
      settings: defaultSettings,
    });

    expect(result).toEqual({ success: true });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.delete).toHaveBeenCalled();
  });

  it('should call delete on the correct path', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: '',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    deleteWorkItem.aiTool.execute({
      issueId: 'DEMO-5',
      workItemId: 'wi-42',
      settings: defaultSettings,
    });

    const deletePath = mockConnection.delete.mock.calls[0][0];
    expect(deletePath).toContain('/issues/DEMO-5/timeTracking/workItems/wi-42');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      deleteWorkItem.aiTool.execute({
        workItemId: 'wi-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_work_item failed: issueId is required');
  });

  it('should throw when workItemId is missing', () => {
    expect(() =>
      deleteWorkItem.aiTool.execute({
        issueId: 'DEMO-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_work_item failed: workItemId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 403,
        response: 'Forbidden',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      deleteWorkItem.aiTool.execute({
        issueId: 'DEMO-1',
        workItemId: 'wi-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_work_item failed: YouTrack API error 403:');
  });

  it('should have correct annotations', () => {
    expect(deleteWorkItem.aiTool.annotations.readOnlyHint).toBe(false);
    expect(deleteWorkItem.aiTool.annotations.destructiveHint).toBe(true);
    expect(deleteWorkItem.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have outputSchema defined', () => {
    expect(deleteWorkItem.aiTool.outputSchema).toBeDefined();
    expect(deleteWorkItem.aiTool.outputSchema.properties.success).toBeDefined();
  });
});

export {};
