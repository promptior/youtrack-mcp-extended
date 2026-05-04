jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/articles/get-article-attachments';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_article_attachments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return attachments for an article', () => {
    const mockData = [
      {
        id: 'att-1',
        name: 'diagram.png',
        size: 204800,
        mimeType: 'image/png',
        created: 1000000,
        author: { login: 'user1', name: 'User One' },
        url: 'https://test.youtrack.cloud/attachments/att-1',
      },
      {
        id: 'att-2',
        name: 'spec.pdf',
        size: 512000,
        mimeType: 'application/pdf',
        created: 2000000,
        author: { login: 'user2', name: 'User Two' },
        url: 'https://test.youtrack.cloud/attachments/att-2',
      },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    expect(result.attachments).toHaveLength(2);
    expect(result.attachments[0].name).toBe('diagram.png');
    expect(result.attachments[1].mimeType).toBe('application/pdf');
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should return empty array when no attachments exist', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({}) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS });

    expect(result).toEqual({ attachments: [] });
  });

  it('should include articleId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ articleId: 'A-55', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/articles/A-55/attachments');
  });

  it('should throw when articleId is missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_get_article_attachments failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ articleId: 'A-1', settings: TEST_SETTINGS })).toThrow(
      'ext_get_article_attachments failed:'
    );
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with attachments property', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.attachments).toBeDefined();
  });
});

export {};
