jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/issue-link-types/update-issue-link-type';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('update_issue_link_type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a link type and return updated fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'lt-1',
          name: 'renamed',
          sourceToTarget: 'copies',
          targetToSource: 'is copied by',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      linkTypeId: 'lt-1',
      name: 'renamed',
      sourceToTarget: 'copies',
      targetToSource: 'is copied by',
    });

    expect(result).toEqual({
      id: 'lt-1',
      name: 'renamed',
      sourceToTarget: 'copies',
      targetToSource: 'is copied by',
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should update only name when other fields are not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'lt-1',
          name: 'new name',
          sourceToTarget: 'old s2t',
          targetToSource: 'old t2s',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, linkTypeId: 'lt-1', name: 'new name' });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.name).toBe('new name');
    expect(body.sourceToTarget).toBeUndefined();
    expect(body.targetToSource).toBeUndefined();
  });

  it('should call the correct endpoint with linkTypeId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'lt-77', name: 'n', sourceToTarget: 's', targetToSource: 't' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, linkTypeId: 'lt-77', name: 'n' });

    const postCall = mockConnection.post.mock.calls[0];
    expect(postCall[0]).toContain('/issueLinkTypes/lt-77');
  });

  it('should update sourceToTarget and targetToSource independently', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'lt-1',
          name: 'x',
          sourceToTarget: 'new s2t',
          targetToSource: 'new t2s',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      linkTypeId: 'lt-1',
      sourceToTarget: 'new s2t',
      targetToSource: 'new t2s',
    });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.sourceToTarget).toBe('new s2t');
    expect(body.targetToSource).toBe('new t2s');
    expect(body.name).toBeUndefined();
  });

  it('should throw when linkTypeId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, name: 'new name' })
    ).toThrow('ext_update_issue_link_type failed:');
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
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, linkTypeId: 'lt-999', name: 'Q' })
    ).toThrow('ext_update_issue_link_type failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });
});

export {};
