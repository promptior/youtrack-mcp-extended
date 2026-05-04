jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/commands/apply-command';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('apply_command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply a command and return applied result', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueIds: ['DEMO-1', 'DEMO-2'],
      command: 'State Fixed',
      settings: TEST_SETTINGS,
    });

    expect(result).toEqual({ applied: true, issueCount: 2, command: 'State Fixed' });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should POST to /commands endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'Priority Critical', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/commands');
  });

  it('should send correct issues array in the request body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueIds: ['DEMO-1', 'DEMO-3'], command: 'State Done', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.issues).toEqual([{ idReadable: 'DEMO-1' }, { idReadable: 'DEMO-3' }]);
    expect(body.query).toBe('State Done');
  });

  it('should use the command as the query field in the request body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'assignee me', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.query).toBe('assignee me');
    expect(body.command).toBeUndefined();
  });

  it('should default silent to false when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'State Fixed', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.silent).toBe(false);
  });

  it('should pass silent=true when specified', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'State Fixed', silent: true, settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.silent).toBe(true);
  });

  it('should include comment in body when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      issueIds: ['DEMO-1'],
      command: 'State Fixed',
      comment: 'Closing this issue',
      settings: TEST_SETTINGS,
    });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.comment).toBe('Closing this issue');
  });

  it('should not include comment in body when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'State Fixed', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.comment).toBeUndefined();
  });

  it('should return correct issueCount matching the number of issueIds', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueIds: ['DEMO-1', 'DEMO-2', 'DEMO-3', 'DEMO-4'],
      command: 'Priority Major',
      settings: TEST_SETTINGS,
    });

    expect(result.issueCount).toBe(4);
  });

  it('should throw when issueIds is missing', () => {
    expect(() => tool.aiTool.execute({ command: 'State Fixed', settings: TEST_SETTINGS })).toThrow(
      'ext_apply_command failed:'
    );
  });

  it('should throw when issueIds is an empty array', () => {
    expect(() =>
      tool.aiTool.execute({ issueIds: [], command: 'State Fixed', settings: TEST_SETTINGS })
    ).toThrow('ext_apply_command failed:');
  });

  it('should throw when command is missing', () => {
    expect(() => tool.aiTool.execute({ issueIds: ['DEMO-1'], settings: TEST_SETTINGS })).toThrow(
      'ext_apply_command failed:'
    );
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 400, response: 'Bad Request' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'invalid command', settings: TEST_SETTINGS })
    ).toThrow('ext_apply_command failed:');
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have a valid outputSchema with applied, issueCount, and command properties', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.applied).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.issueCount).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.command).toBeDefined();
  });

  it('should throw when API responds 200 but body contains error field', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ error: 'Command not found', error_description: 'Unknown command: EstadoInvalido' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'EstadoInvalido', settings: TEST_SETTINGS })
    ).toThrow('ext_apply_command failed:');
  });

  it('should throw when API responds 200 but body contains errors array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ errors: [{ message: 'Unknown value for field State' }] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'State InvalidValue', settings: TEST_SETTINGS })
    ).toThrow('ext_apply_command failed:');
  });

  it('should throw when API responds 200 but body contains violations array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ violations: [{ message: 'No such command: UnknownCmd' }] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueIds: ['DEMO-1'], command: 'UnknownCmd', settings: TEST_SETTINGS })
    ).toThrow('ext_apply_command failed: Command violations: No such command: UnknownCmd');
  });
});

export {};
