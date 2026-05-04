jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/agile/get-sprints';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_sprints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sprints for a board', () => {
    const sprints = [
      { id: 'sprint-1', name: 'Sprint 1', goal: 'Goal A', start: 1000000, finish: 2000000, isCompleted: false, archived: false },
      { id: 'sprint-2', name: 'Sprint 2', goal: 'Goal B', start: 2000000, finish: 3000000, isCompleted: false, archived: false },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(sprints) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', settings: TEST_SETTINGS });

    expect(result.sprints).toHaveLength(2);
    expect(result.sprints[0].id).toBe('sprint-1');
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should pass archived=false to the API by default', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-1', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('archived=false');
  });

  it('should pass archived=true to the API when requested', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-1', archived: true, settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('archived=true');
  });

  it('should return empty array when API returns empty array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', settings: TEST_SETTINGS });

    expect(result).toEqual({ sprints: [] });
  });

  it('should throw when boardId is missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_get_sprints failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Board not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ boardId: 'bad-board', settings: TEST_SETTINGS })).toThrow(
      'ext_get_sprints failed:'
    );
  });

  it('should include boardId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-99', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/agiles/board-99/sprints');
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
