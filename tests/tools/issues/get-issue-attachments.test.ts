jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/get-issue-attachments');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('get_issue_attachments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return attachments with all fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          {
            id: 'att-1',
            name: 'screenshot.png',
            size: 12345,
            mimeType: 'image/png',
            extension: 'png',
            url: 'https://test.youtrack.cloud/api/files/att-1',
            author: { login: 'jdoe', name: 'John Doe' },
            created: 1700000000000,
          },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({
      attachments: [
        {
          id: 'att-1',
          name: 'screenshot.png',
          size: 12345,
          mimeType: 'image/png',
          extension: 'png',
          url: 'https://test.youtrack.cloud/api/files/att-1',
          author: { login: 'jdoe', name: 'John Doe' },
          created: 1700000000000,
        },
      ],
    });
  });

  it('should GET /issues/{issueId}/attachments with fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '[]' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/issues/DEMO-1/attachments');
    expect(url).toContain('fields=');
  });

  it('should return empty array when no attachments', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '[]' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({ attachments: [] });
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ settings: defaultSettings })
    ).toThrow('ext_get_issue_attachments failed: issueId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'NOTFOUND-1', settings: defaultSettings })
    ).toThrow('ext_get_issue_attachments failed: YouTrack API error 404');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
