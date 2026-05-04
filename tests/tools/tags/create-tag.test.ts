jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/tags/create-tag';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('create_tag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a tag and return id, name, colorId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-1', name: 'urgent', color: { id: 'red' } }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'urgent', colorId: 'red' });

    expect(result).toEqual({ id: 'tag-1', name: 'urgent', colorId: 'red', owner: null });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should create a tag without colorId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-2', name: 'backlog' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'backlog' });

    expect(result.id).toBe('tag-2');
    expect(result.name).toBe('backlog');
    expect(result.colorId).toBeNull();
  });

  it('should include color in the body when colorId is provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-3', name: 'critical', color: { id: 'blue' } }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'critical', colorId: 'blue' });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.color).toEqual({ id: 'blue' });
    expect(body.name).toBe('critical');
  });

  it('should not include color in body when colorId is not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-4', name: 'feature' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'feature' });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.color).toBeUndefined();
  });

  it('should throw when name is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS })
    ).toThrow('ext_create_tag failed:');
  });

  it('should throw AND roll back the orphan tag when YouTrack silently fell back to colorId "0"', () => {
    // YouTrack falls back to colorId "0" when the requested colour is unknown.
    // The tool must (a) surface the mismatch as an error AND (b) DELETE the
    // tag YouTrack already created so it does not stay orphaned with the
    // wrong colour.
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-bogus', name: 't', color: { id: '0' } }),
      }),
      delete: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 't', colorId: '99' })
    ).toThrow(/colorId "99" was rejected.*rolled back/);

    expect(mockConnection.delete).toHaveBeenCalledTimes(1);
    expect(mockConnection.delete.mock.calls[0][0]).toContain('/tags/tag-bogus');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 409,
        response: 'Tag already exists',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'duplicate' })
    ).toThrow('ext_create_tag failed: YouTrack API error 409:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });
});

export {};
