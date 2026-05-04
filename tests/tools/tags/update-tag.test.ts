jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/tags/update-tag';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('update_tag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update tag name and return updated tag', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-1', name: 'critical' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-1', name: 'critical' });

    expect(result).toEqual({ id: 'tag-1', name: 'critical', colorId: null });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should update tag color when colorId is provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-1', name: 'urgent', color: { id: 'green' } }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-1', colorId: 'green' });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.color).toEqual({ id: 'green' });
  });

  it('should throw and roll back the previous colour when YouTrack degrades it to "0" (no name change requested)', () => {
    // YouTrack does NOT just ignore unknown colorIds — it degrades the stored
    // colour to "0". The tool must put the original colour back even if no
    // name change was part of the same call.
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true, code: 200,
        response: JSON.stringify({ name: 'tag-1-name', color: { id: '24' } }),
      }),
      post: jest.fn()
        .mockReturnValueOnce({
          isSuccess: true, code: 200,
          response: JSON.stringify({ id: 'tag-1', name: 'tag-1-name', color: { id: '0' } }),
        })
        .mockReturnValueOnce({
          isSuccess: true, code: 200,
          response: JSON.stringify({ id: 'tag-1' }),
        }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-1', colorId: '99' })
    ).toThrow(/colorId "99" was rejected.*previous colour.*was rolled back/);

    // Two POSTs: the failed update + the colour rollback.
    expect(mockConnection.post).toHaveBeenCalledTimes(2);
    const rollbackBody = JSON.parse(mockConnection.post.mock.calls[1][2]);
    expect(rollbackBody.color).toEqual({ id: '24' });
    expect(rollbackBody.name).toBeUndefined();
  });

  it('should roll back BOTH name and previous colour when both got clobbered by a bogus colorId update', () => {
    // When the caller asked to update both name and colour but YouTrack
    // accepted the name and degraded the colour, the tool must restore both.
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true, code: 200,
        response: JSON.stringify({ name: 'original-name', color: { id: '24' } }),
      }),
      post: jest.fn()
        .mockReturnValueOnce({
          isSuccess: true, code: 200,
          response: JSON.stringify({ id: 'tag-1', name: 'new-name', color: { id: '0' } }),
        })
        .mockReturnValueOnce({
          isSuccess: true, code: 200,
          response: JSON.stringify({ id: 'tag-1' }),
        }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-1', name: 'new-name', colorId: '99' })
    ).toThrow(/colorId "99" was rejected.*name and previous colour.*were rolled back/);

    // Two POSTs: the failed update + the combined rollback.
    expect(mockConnection.post).toHaveBeenCalledTimes(2);
    const rollbackBody = JSON.parse(mockConnection.post.mock.calls[1][2]);
    expect(rollbackBody.name).toBe('original-name');
    expect(rollbackBody.color).toEqual({ id: '24' });
  });

  it('should call the correct endpoint with tagId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-99', name: 'renamed' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-99', name: 'renamed' });

    const postCall = mockConnection.post.mock.calls[0];
    expect(postCall[0]).toContain('/tags/tag-99');
  });

  it('should not include color in body when colorId is not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-1', name: 'updated' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-1', name: 'updated' });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.color).toBeUndefined();
  });

  it('should throw when tagId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'new-name' })
    ).toThrow('ext_update_tag failed:');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Tag not found',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, tagId: 'tag-999', name: 'Q' })
    ).toThrow('ext_update_tag failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });
});

export {};
