jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/issue-link-types/create-issue-link-type';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('create_issue_link_type', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create an issue link type and return id, name, sourceToTarget, targetToSource', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'lt-1',
          name: 'duplicates',
          sourceToTarget: 'duplicates',
          targetToSource: 'is duplicated by',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      name: 'duplicates',
      sourceToTarget: 'duplicates',
      targetToSource: 'is duplicated by',
    });

    expect(result).toEqual({
      id: 'lt-1',
      name: 'duplicates',
      sourceToTarget: 'duplicates',
      targetToSource: 'is duplicated by',
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should default directed to true when not specified', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'lt-2',
          name: 'relates to',
          sourceToTarget: 'relates to',
          targetToSource: 'is related to',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      name: 'relates to',
      sourceToTarget: 'relates to',
      targetToSource: 'is related to',
    });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.directed).toBe(true);
  });

  it('should use directed=false when explicitly set', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'lt-3',
          name: 'related',
          sourceToTarget: 'related',
          targetToSource: 'related',
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      name: 'related',
      sourceToTarget: 'related',
      targetToSource: 'related',
      directed: false,
    });

    const postCall = mockConnection.post.mock.calls[0];
    const body = JSON.parse(postCall[2]);
    expect(body.directed).toBe(false);
  });

  it('should throw when name is missing', () => {
    expect(() =>
      tool.aiTool.execute({
        ...DEFAULT_SETTINGS,
        sourceToTarget: 'duplicates',
        targetToSource: 'is duplicated by',
      })
    ).toThrow('ext_create_issue_link_type failed:');
  });

  it('should throw when sourceToTarget is missing', () => {
    expect(() =>
      tool.aiTool.execute({
        ...DEFAULT_SETTINGS,
        name: 'duplicates',
        targetToSource: 'is duplicated by',
      })
    ).toThrow('ext_create_issue_link_type failed:');
  });

  it('should throw when targetToSource is missing', () => {
    expect(() =>
      tool.aiTool.execute({
        ...DEFAULT_SETTINGS,
        name: 'duplicates',
        sourceToTarget: 'duplicates',
      })
    ).toThrow('ext_create_issue_link_type failed:');
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 409,
        response: 'Link type already exists',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({
        ...DEFAULT_SETTINGS,
        name: 'duplicates',
        sourceToTarget: 'duplicates',
        targetToSource: 'is duplicated by',
      })
    ).toThrow('ext_create_issue_link_type failed: YouTrack API error 409:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema with required fields', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.name).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.sourceToTarget).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.targetToSource).toBeDefined();
  });
});

export {};
