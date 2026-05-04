jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const deleteIssueAttachment = require('../../../src/tools/issues/delete-issue-attachment');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('delete_issue_attachment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete an attachment and return success', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: '',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = deleteIssueAttachment.aiTool.execute({
      issueId: 'DEMO-1',
      attachmentId: 'attach-99',
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

    deleteIssueAttachment.aiTool.execute({
      issueId: 'DEMO-5',
      attachmentId: 'attach-42',
      settings: defaultSettings,
    });

    const deletePath = mockConnection.delete.mock.calls[0][0];
    expect(deletePath).toContain('/issues/DEMO-5/attachments/attach-42');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      deleteIssueAttachment.aiTool.execute({
        attachmentId: 'attach-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_issue_attachment failed: issueId is required');
  });

  it('should throw when attachmentId is missing', () => {
    expect(() =>
      deleteIssueAttachment.aiTool.execute({
        issueId: 'DEMO-1',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_issue_attachment failed: attachmentId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Attachment not found',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      deleteIssueAttachment.aiTool.execute({
        issueId: 'DEMO-1',
        attachmentId: 'nonexistent-attach',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_issue_attachment failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(deleteIssueAttachment.aiTool.annotations.readOnlyHint).toBe(false);
    expect(deleteIssueAttachment.aiTool.annotations.destructiveHint).toBe(true);
    expect(deleteIssueAttachment.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have outputSchema defined', () => {
    expect(deleteIssueAttachment.aiTool.outputSchema).toBeDefined();
    expect(deleteIssueAttachment.aiTool.outputSchema.properties.success).toBeDefined();
  });
});

export {};
