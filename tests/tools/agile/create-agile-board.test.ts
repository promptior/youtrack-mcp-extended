jest.mock('@jetbrains/youtrack-scripting-api/http');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/agile/create-agile-board';

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

const mockProjects = [
  { id: '0-0', shortName: 'DEMO' },
  { id: '1-0', shortName: 'OTHER' },
];

const mockFields = [
  { id: 'pcf-101', field: { id: '184-2', name: 'State' } },
  { id: 'pcf-102', field: { id: '185-3', name: 'Priority' } },
];

describe('create_agile_board', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve project shortName and field name, then create the board', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn()
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockProjects) })
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockFields) }),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({ id: 'board-1', name: 'My Board' }) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      name: 'My Board',
      projectIds: ['DEMO'],
      columnFieldName: 'State',
      settings: defaultSettings,
    });

    expect(result).toEqual({ id: 'board-1', name: 'My Board', projects: [], sprintsEnabled: true });
    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.columnSettings.field).toEqual({ id: '184-2' });
    expect(postBody.projects).toEqual([{ id: '0-0' }]);
  });

  it('should GET all projects first to resolve shortNames', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn()
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockProjects) })
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockFields) }),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({ id: 'b1', name: 'B' }) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ name: 'B', projectIds: ['DEMO', 'OTHER'], columnFieldName: 'State', settings: defaultSettings });

    const projectsGetUrl = mockConnection.get.mock.calls[0][0];
    expect(projectsGetUrl).toContain('/admin/projects');
  });

  it('should GET fields using resolved internal project ID', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn()
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockProjects) })
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockFields) }),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({ id: 'b1', name: 'B' }) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ name: 'B', projectIds: ['DEMO', 'OTHER'], columnFieldName: 'State', settings: defaultSettings });

    const fieldsGetUrl = mockConnection.get.mock.calls[1][0];
    expect(fieldsGetUrl).toContain('/admin/projects/0-0/customFields');
  });

  it('should include all resolved projectIds in POST body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn()
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockProjects) })
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockFields) }),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({ id: 'b1', name: 'B' }) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ name: 'B', projectIds: ['DEMO', 'OTHER'], columnFieldName: 'State', settings: defaultSettings });

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.projects).toEqual([{ id: '0-0' }, { id: '1-0' }]);
  });

  it('should throw when project shortName is not found', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockProjects) }),
      post: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ name: 'B', projectIds: ['NOTFOUND'], columnFieldName: 'State', settings: defaultSettings })
    ).toThrow('ext_create_agile_board failed: Project not found: "NOTFOUND"');
  });

  it('should throw when field name is not found', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn()
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockProjects) })
        .mockReturnValueOnce({ isSuccess: true, code: 200, response: JSON.stringify(mockFields) }),
      post: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ name: 'B', projectIds: ['DEMO'], columnFieldName: 'NonExistent', settings: defaultSettings })
    ).toThrow('ext_create_agile_board failed: Field "NonExistent" not found');
  });

  it('should throw when required params are missing', () => {
    expect(() =>
      tool.aiTool.execute({ name: 'B', settings: defaultSettings })
    ).toThrow('ext_create_agile_board failed:');
  });

  it('should throw on API error fetching projects', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' }),
      post: jest.fn(),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ name: 'B', projectIds: ['DEMO'], columnFieldName: 'State', settings: defaultSettings })
    ).toThrow('ext_create_agile_board failed:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
