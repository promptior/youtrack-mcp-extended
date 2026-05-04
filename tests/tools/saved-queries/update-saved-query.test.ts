jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/saved-queries/update-saved-query';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('update_saved_query', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update name and query and return updated fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'sq-1',
          name: 'Updated Name',
          query: 'project: DEMO and State: Resolved',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      queryId: 'sq-1',
      name: 'Updated Name',
      query: 'project: DEMO and State: Resolved',
    });

    expect(result).toEqual({
      id: 'sq-1',
      name: 'Updated Name',
      query: 'project: DEMO and State: Resolved',
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should update only name when query is not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'sq-1', name: 'New Name', query: 'State: Open' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, queryId: 'sq-1', name: 'New Name' });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.name).toBe('New Name');
    expect(body.query).toBeUndefined();
  });

  it('should update only query when name is not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'sq-1', name: 'Old Name', query: 'State: Resolved' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, queryId: 'sq-1', query: 'State: Resolved' });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.query).toBe('State: Resolved');
    expect(body.name).toBeUndefined();
  });

  it('should call the correct endpoint with queryId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'sq-42', name: 'Q', query: 'q' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, queryId: 'sq-42', name: 'Q' });

    const postCall = mockConnection.post.mock.calls[0];
    expect(postCall[0]).toContain('/savedQueries/sq-42');
  });

  it('should throw when queryId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'New Name' })
    ).toThrow('ext_update_saved_query failed:');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Not Found',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, queryId: 'sq-999', name: 'Q' })
    ).toThrow('ext_update_saved_query failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });
});

export {};
