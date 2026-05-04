jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/manage-issue-tags');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('manage_issue_tags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a tag to an issue', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-1', name: 'urgent' }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      tagId: 'tag-1',
      action: 'add',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      success: true,
      action: 'add',
      issueId: 'DEMO-1',
      tagId: 'tag-1',
    });
    expect(mockConnection.post).toHaveBeenCalled();
    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody).toEqual({ id: 'tag-1' });
  });

  it('should remove a tag from an issue', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: '',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      tagId: 'tag-1',
      action: 'remove',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      success: true,
      action: 'remove',
      issueId: 'DEMO-1',
      tagId: 'tag-1',
    });
    expect(mockConnection.delete).toHaveBeenCalled();
  });

  it('should call the correct URL for add action', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'tag-2', name: 'bug' }),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-5', tagId: 'tag-2', action: 'add', settings: defaultSettings });

    const postUrl = mockConnection.post.mock.calls[0][0];
    expect(postUrl).toContain('/issues/DEMO-5/tags');
  });

  it('should call the correct URL for remove action', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: '',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-5', tagId: 'tag-3', action: 'remove', settings: defaultSettings });

    const deleteUrl = mockConnection.delete.mock.calls[0][0];
    expect(deleteUrl).toContain('/issues/DEMO-5/tags/tag-3');
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ tagId: 'tag-1', action: 'add', settings: defaultSettings })
    ).toThrow('ext_manage_issue_tags failed: issueId is required');
  });

  it('should throw when tagId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', action: 'add', settings: defaultSettings })
    ).toThrow('ext_manage_issue_tags failed: tagId is required');
  });

  it('should throw when action is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', tagId: 'tag-1', settings: defaultSettings })
    ).toThrow('ext_manage_issue_tags failed: action is required');
  });

  it('should throw when action is invalid', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', tagId: 'tag-1', action: 'update', settings: defaultSettings })
    ).toThrow('ext_manage_issue_tags failed: action must be "add" or "remove"');
  });

  it('should throw on API error for add', () => {
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
      tool.aiTool.execute({ issueId: 'DEMO-1', tagId: 'nonexistent-tag', action: 'add', settings: defaultSettings })
    ).toThrow('ext_manage_issue_tags failed: YouTrack API error 404:');
  });

  it('should throw on API error for remove', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      delete: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Tag not found',
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', tagId: 'nonexistent-tag', action: 'remove', settings: defaultSettings })
    ).toThrow('ext_manage_issue_tags failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.success).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.action).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.issueId).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.tagId).toBeDefined();
  });
});

export {};
