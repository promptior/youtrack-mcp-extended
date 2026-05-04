jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/projects/get-issue-fields-schema';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

const mockFields = [
  {
    id: 'field-1',
    name: 'State',
    field: { id: 'f-1', name: 'State', fieldType: { id: 'state[1]' } },
    canBeEmpty: false,
    emptyFieldText: 'No state',
  },
  {
    id: 'field-2',
    name: 'Priority',
    field: { id: 'f-2', name: 'Priority', fieldType: { id: 'enum[1]' } },
    canBeEmpty: true,
    emptyFieldText: null,
  },
  {
    id: 'field-3',
    name: 'Assignee',
    field: { id: 'f-3', name: 'Assignee', fieldType: { id: 'user[1]' } },
    canBeEmpty: true,
    emptyFieldText: 'Unassigned',
  },
];

describe('get_issue_fields_schema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of custom fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockFields),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'DEMO' });

    expect(result.fields).toHaveLength(3);
    expect(result.fields[0]).toEqual({
      id: 'field-1',
      name: 'State',
      fieldType: 'state[1]',
      isRequired: true,
      emptyFieldText: 'No state',
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should map canBeEmpty=false to isRequired=true', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(mockFields),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'DEMO' });

    expect(result.fields[0].isRequired).toBe(true);
    expect(result.fields[1].isRequired).toBe(false);
    expect(result.fields[2].isRequired).toBe(false);
  });

  it('should call the correct endpoint with projectId', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'MYPROJ' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('/admin/projects/MYPROJ/customFields');
  });

  it('should return empty fields array when API returns empty array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'DEMO' });

    expect(result.fields).toEqual([]);
  });

  it('should fall back to field.name when top-level name is missing', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'f-x', field: { id: 'fx', name: 'Priority', fieldType: { id: 'enum[1]' } }, canBeEmpty: false, emptyFieldText: null },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'DEMO' });

    expect(result.fields[0].name).toBe('Priority');
  });

  it('should handle field with no fieldType', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'f-x', name: 'Custom', field: { id: 'fx', name: 'Custom', fieldType: null }, canBeEmpty: true, emptyFieldText: null },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'DEMO' });

    expect(result.fields[0].fieldType).toBeNull();
  });

  it('should throw when projectId is missing', () => {
    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS })).toThrow(
      'ext_get_issue_fields_schema failed:'
    );
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

    expect(() => tool.aiTool.execute({ ...DEFAULT_SETTINGS, projectId: 'DEMO' })).toThrow(
      'ext_get_issue_fields_schema failed: YouTrack API error 403:'
    );
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.fields).toBeDefined();
  });
});

export {};
