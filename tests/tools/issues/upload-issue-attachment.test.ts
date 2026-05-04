jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const uploadIssueAttachment = require('../../../src/tools/issues/upload-issue-attachment');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('upload_issue_attachment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should upload via multipart and return attachment data', () => {
    const mockAttachment = {
      id: 'attach-1',
      name: 'screenshot.png',
      url: 'https://test.youtrack.cloud/api/files/attach-1',
      mimeType: 'image/png',
      size: 102400,
    };

    const mockConnection = {
      addHeader: jest.fn(),
      postMultipart: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockAttachment),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = uploadIssueAttachment.aiTool.execute({
      issueId: 'DEMO-1',
      fileName: 'screenshot.png',
      content: 'aGVsbG8gd29ybGQ=',
      mimeType: 'image/png',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      id: 'attach-1',
      name: 'screenshot.png',
      url: 'https://test.youtrack.cloud/api/files/attach-1',
      mimeType: 'image/png',
      size: 102400,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
    expect(mockConnection.postMultipart).toHaveBeenCalled();
  });

  it('should call postMultipart against /issues/{id}/attachments with the right args', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      postMultipart: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'a-1', name: 'file.txt', url: '', mimeType: 'text/plain', size: 100 }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    uploadIssueAttachment.aiTool.execute({
      issueId: 'DEMO-7',
      fileName: 'file.txt',
      content: 'dGVzdA==',
      mimeType: 'text/plain',
      settings: defaultSettings,
    });

    const [url, fileName, mimeType, base64] = mockConnection.postMultipart.mock.calls[0];
    expect(url).toContain('/issues/DEMO-7/attachments');
    expect(url).toContain('fields=');
    expect(fileName).toBe('file.txt');
    expect(mimeType).toBe('text/plain');
    expect(base64).toBe('dGVzdA==');
  });

  it('should accept response that is an array of attachments and pick first', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      postMultipart: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: 'a-2', name: 'doc.pdf', url: '', mimeType: 'application/pdf', size: 200 }]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = uploadIssueAttachment.aiTool.execute({
      issueId: 'DEMO-1',
      fileName: 'doc.pdf',
      content: 'cGRmY29udGVudA==',
      mimeType: 'application/pdf',
      settings: defaultSettings,
    });

    expect(result.id).toBe('a-2');
    expect(result.mimeType).toBe('application/pdf');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      uploadIssueAttachment.aiTool.execute({
        fileName: 'file.txt',
        content: 'dGVzdA==',
        mimeType: 'text/plain',
        settings: defaultSettings,
      })
    ).toThrow('ext_upload_issue_attachment failed: issueId is required');
  });

  it('should throw when fileName is missing', () => {
    expect(() =>
      uploadIssueAttachment.aiTool.execute({
        issueId: 'DEMO-1',
        content: 'dGVzdA==',
        mimeType: 'text/plain',
        settings: defaultSettings,
      })
    ).toThrow('ext_upload_issue_attachment failed: fileName is required');
  });

  it('should throw when content is missing', () => {
    expect(() =>
      uploadIssueAttachment.aiTool.execute({
        issueId: 'DEMO-1',
        fileName: 'file.txt',
        mimeType: 'text/plain',
        settings: defaultSettings,
      })
    ).toThrow('ext_upload_issue_attachment failed: content is required');
  });

  it('should throw when mimeType is missing', () => {
    expect(() =>
      uploadIssueAttachment.aiTool.execute({
        issueId: 'DEMO-1',
        fileName: 'file.txt',
        content: 'dGVzdA==',
        settings: defaultSettings,
      })
    ).toThrow('ext_upload_issue_attachment failed: mimeType is required');
  });

  it('should reject mimeType containing parameters that would break curl -F syntax', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      postMultipart: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      uploadIssueAttachment.aiTool.execute({
        issueId: 'DEMO-1',
        fileName: 'safe.png',
        content: 'dGVzdA==',
        mimeType: 'image/png;filename=evil.exe',
        settings: defaultSettings,
      })
    ).toThrow(/Invalid mimeType/);
    expect(mockConnection.postMultipart).not.toHaveBeenCalled();
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      postMultipart: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 400,
        response: 'Bad request',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      uploadIssueAttachment.aiTool.execute({
        issueId: 'DEMO-1',
        fileName: 'bad.bin',
        content: 'invalid',
        mimeType: 'application/octet-stream',
        settings: defaultSettings,
      })
    ).toThrow('ext_upload_issue_attachment failed: YouTrack API error 400:');
  });

  it('should have correct annotations', () => {
    expect(uploadIssueAttachment.aiTool.annotations.readOnlyHint).toBe(false);
    expect(uploadIssueAttachment.aiTool.annotations.destructiveHint).toBe(false);
    expect(uploadIssueAttachment.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have outputSchema defined', () => {
    expect(uploadIssueAttachment.aiTool.outputSchema).toBeDefined();
    expect(uploadIssueAttachment.aiTool.outputSchema.properties.id).toBeDefined();
    expect(uploadIssueAttachment.aiTool.outputSchema.properties.name).toBeDefined();
    expect(uploadIssueAttachment.aiTool.outputSchema.properties.url).toBeDefined();
  });
});

export {};
