jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/projects/find-projects';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

const mockProjects = [
  { id: 'proj-1', name: 'Alpha Project', shortName: 'ALPHA', description: 'First project', leader: { login: 'alice', name: 'Alice' } },
  { id: 'proj-2', name: 'Beta Project', shortName: 'BETA', description: null, leader: null },
  { id: 'proj-3', name: 'Gamma Service', shortName: 'GAMMA', description: 'Third project', leader: { login: 'bob', name: 'Bob' } },
];

describe('find_projects', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all projects when no query is given', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockProjects),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.projects).toHaveLength(3);
    expect(result.projects[0]).toEqual({
      id: 'proj-1',
      name: 'Alpha Project',
      shortName: 'ALPHA',
      description: 'First project',
      leader: { login: 'alice', name: 'Alice' },
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should pass query parameter to the server (server-side filter, not client-side)', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([mockProjects[0], mockProjects[1]]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, query: 'project' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('query=project');
    expect(result.projects).toHaveLength(2);
  });

  it('should not pass query parameter when omitted', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).not.toContain('query=');
  });

  it('should handle project with null leader', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([mockProjects[1]]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.projects[0].leader).toBeNull();
    expect(result.projects[0].description).toBeNull();
  });

  it('should use default top=50 and skip=0', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=50');
    expect(getCall).toContain('%24skip=0');
  });

  it('should use custom top and skip values', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, top: 10, skip: 20 });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('%24top=10');
    expect(getCall).toContain('%24skip=20');
  });

  it('should return empty projects array when API returns empty array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.projects).toEqual([]);
  });

  it('should throw when API returns error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 403,
        response: 'Forbidden',
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS })).toThrow('ext_find_projects failed:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.projects).toBeDefined();
  });
});

export {};
