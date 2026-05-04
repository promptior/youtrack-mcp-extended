jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/tags/delete-tag';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('delete_tag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a tag and return success: true', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: true, code: 204, response: '' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-1' });

    expect(result).toEqual({ success: true });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should call the correct delete endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: true, code: 204, response: '' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-42' });

    const deleteCall = mockConnection.delete.mock.calls[0][0];
    expect(deleteCall).toContain('/tags/tag-42');
  });

  it('should throw when tagId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS })
    ).toThrow('ext_delete_tag failed:');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not Found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-999' })
    ).toThrow('ext_delete_tag failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(true);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.success).toBeDefined();
  });
});

export {};
