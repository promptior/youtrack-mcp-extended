jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/projects/get-project';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

describe('get_project', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return full project details', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'proj-1',
          name: 'Demo Project',
          shortName: 'DEMO',
          description: 'A demo project',
          leader: { login: 'alice', name: 'Alice Smith' },
          createdBy: { login: 'admin', name: 'Admin User' },
          archived: false,
          template: false,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'DEMO' });

    expect(result).toEqual({
      id: 'proj-1',
      name: 'Demo Project',
      shortName: 'DEMO',
      description: 'A demo project',
      leader: { login: 'alice', name: 'Alice Smith' },
      createdBy: { login: 'admin', name: 'Admin User' },
      archived: false,
      template: false,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should call the correct endpoint with projectId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'proj-2',
          name: 'Test',
          shortName: 'TEST',
          description: null,
          leader: null,
          createdBy: null,
          archived: false,
          template: false,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'TEST' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('/admin/projects/TEST');
  });

  it('should handle null leader and createdBy', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          id: 'proj-3',
          name: 'No Leader',
          shortName: 'NL',
          description: null,
          leader: null,
          createdBy: null,
          archived: true,
          template: false,
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'NL' });

    expect(result.leader).toBeNull();
    expect(result.createdBy).toBeNull();
    expect(result.description).toBeNull();
    expect(result.archived).toBe(true);
  });

  it('should throw when projectId is missing', () => {
    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS })).toThrow('ext_get_project failed:');
  });

  it('should throw when API returns 404', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Not Found',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'UNKNOWN' })).toThrow(
      'ext_get_project failed: YouTrack API error 404:'
    );
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.id).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.name).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.shortName).toBeDefined();
  });
});

export {};
