jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/agile/get-sprint';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_sprint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return sprint details with issues', () => {
    const mockSprintData = {
      id: 'sprint-1',
      name: 'Sprint 1',
      goal: 'Ship feature X',
      start: 1000000,
      finish: 2000000,
      isCompleted: false,
      archived: false,
      issues: [
        { id: '2-1', idReadable: 'DEMO-1', summary: 'Fix bug', fields: { State: 'In Progress' } },
        { id: '2-2', idReadable: 'DEMO-2', summary: 'Add feature', fields: null },
      ],
    };
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockSprintData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', sprintId: 'sprint-1', settings: TEST_SETTINGS });

    expect(result.sprint.id).toBe('sprint-1');
    expect(result.sprint.name).toBe('Sprint 1');
    expect(result.sprint.goal).toBe('Ship feature X');
    expect(result.sprint.isCompleted).toBe(false);
    expect(result.sprint.issues).toHaveLength(2);
    expect(result.sprint.issues[0].idReadable).toBe('DEMO-1');
    expect(result.sprint.issues[0].state).toBe('In Progress');
    expect(result.sprint.issues[1].state).toBeNull();
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should handle sprint with no issues', () => {
    const mockSprintData = {
      id: 'sprint-2',
      name: 'Empty Sprint',
      goal: '',
      start: null,
      finish: null,
      isCompleted: false,
      archived: false,
    };
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockSprintData) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', sprintId: 'sprint-2', settings: TEST_SETTINGS });

    expect(result.sprint.issues).toEqual([]);
    expect(result.sprint.goal).toBe('');
    expect(result.sprint.start).toBeNull();
    expect(result.sprint.finish).toBeNull();
  });

  it('should include boardId and sprintId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 's1', name: 'S1', issues: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-5', sprintId: 'sprint-99', settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/agiles/board-5/sprints/sprint-99');
  });

  it('should throw when boardId is missing', () => {
    expect(() => tool.aiTool.execute({ sprintId: 'sprint-1', settings: TEST_SETTINGS })).toThrow(
      'ext_get_sprint failed:'
    );
  });

  it('should throw when sprintId is missing', () => {
    expect(() => tool.aiTool.execute({ boardId: 'board-1', settings: TEST_SETTINGS })).toThrow(
      'ext_get_sprint failed:'
    );
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Sprint not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ boardId: 'board-1', sprintId: 'missing', settings: TEST_SETTINGS })
    ).toThrow('ext_get_sprint failed:');
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with sprint property', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.sprint).toBeDefined();
  });
});

export {};
