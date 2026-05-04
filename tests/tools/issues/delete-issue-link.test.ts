jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const deleteIssueLink = require('../../../src/tools/issues/delete-issue-link');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

function makeConnection(deleteSuccess = true) {
  return {
    addHeader: jest.fn(),
    get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({ id: '3-34' }) }),
    delete: jest.fn().mockReturnValue({
      isSuccess: deleteSuccess,
      code: deleteSuccess ? 200 : 404,
      response: deleteSuccess ? '' : 'Link not found',
    }),
  };
}

describe('delete_issue_link', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve linkedIssueId to internal ID and delete the link', () => {
    const mockConnection = makeConnection();
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = deleteIssueLink.aiTool.execute({
      issueId: 'DEMO-1',
      linkId: 'link-42',
      linkedIssueId: 'DEMO-2',
      settings: defaultSettings,
    });

    expect(result).toEqual({ success: true });
    expect(mockConnection.get).toHaveBeenCalled();
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should call delete on the correct path using resolved internal ID', () => {
    const mockConnection = makeConnection();
    mockHttp.Connection.mockReturnValue(mockConnection);

    deleteIssueLink.aiTool.execute({
      issueId: 'DEMO-7',
      linkId: 'link-99',
      linkedIssueId: 'DEMO-8',
      settings: defaultSettings,
    });

    const deletePath = mockConnection.delete.mock.calls[0][0];
    expect(deletePath).toContain('/issues/DEMO-7/links/link-99/issues/3-34');
  });

  it('should resolve linkedIssueId via GET before DELETE', () => {
    const mockConnection = makeConnection();
    mockHttp.Connection.mockReturnValue(mockConnection);

    deleteIssueLink.aiTool.execute({
      issueId: 'DEMO-7',
      linkId: 'link-99',
      linkedIssueId: 'DEMO-8',
      settings: defaultSettings,
    });

    const getUrl = mockConnection.get.mock.calls[0][0];
    expect(getUrl).toContain('/issues/DEMO-8');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      deleteIssueLink.aiTool.execute({
        linkId: 'link-42',
        linkedIssueId: 'DEMO-2',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_issue_link failed: issueId is required');
  });

  it('should throw when linkId is missing', () => {
    expect(() =>
      deleteIssueLink.aiTool.execute({
        issueId: 'DEMO-1',
        linkedIssueId: 'DEMO-2',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_issue_link failed: linkId is required');
  });

  it('should throw when linkedIssueId is missing', () => {
    expect(() =>
      deleteIssueLink.aiTool.execute({
        issueId: 'DEMO-1',
        linkId: 'link-42',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_issue_link failed: linkedIssueId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = makeConnection(false);
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      deleteIssueLink.aiTool.execute({
        issueId: 'DEMO-1',
        linkId: 'nonexistent-link',
        linkedIssueId: 'DEMO-2',
        settings: defaultSettings,
      })
    ).toThrow('ext_delete_issue_link failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(deleteIssueLink.aiTool.annotations.readOnlyHint).toBe(false);
    expect(deleteIssueLink.aiTool.annotations.destructiveHint).toBe(true);
    expect(deleteIssueLink.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have outputSchema defined', () => {
    expect(deleteIssueLink.aiTool.outputSchema).toBeDefined();
    expect(deleteIssueLink.aiTool.outputSchema.properties.success).toBeDefined();
  });
});

export {};
