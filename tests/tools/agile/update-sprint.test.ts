jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/agile/update-sprint';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('update_sprint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update sprint name and return updated sprint', () => {
    const mockResult = { id: 'sprint-1', name: 'Renamed Sprint', isCompleted: false };
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockResult) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      boardId: 'board-1',
      sprintId: 'sprint-1',
      name: 'Renamed Sprint',
      settings: TEST_SETTINGS,
    });

    expect(result.id).toBe('sprint-1');
    expect(result.name).toBe('Renamed Sprint');
    expect(result.isCompleted).toBe(false);
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should mark sprint as completed', () => {
    const mockResult = { id: 'sprint-1', name: 'Sprint 1', isCompleted: true };
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockResult) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      boardId: 'board-1',
      sprintId: 'sprint-1',
      isCompleted: true,
      settings: TEST_SETTINGS,
    });

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.isCompleted).toBe(true);
    expect(result.isCompleted).toBe(true);
  });

  it('should throw if YouTrack silently ignores isCompleted (returns mismatched value)', () => {
    // YouTrack sometimes accepts the POST with 200 but does not flip the flag
    // (e.g. if sprintsEnabled is false on the board). Surface the mismatch.
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'sprint-1', name: 'Sprint 1', isCompleted: false }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({
        boardId: 'board-1',
        sprintId: 'sprint-1',
        isCompleted: true,
        settings: TEST_SETTINGS,
      })
    ).toThrow(/did not change isCompleted/);
  });

  it('should update sprint goal', () => {
    const mockResult = { id: 'sprint-1', name: 'Sprint 1', isCompleted: false };
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockResult) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      boardId: 'board-1',
      sprintId: 'sprint-1',
      goal: 'New goal',
      settings: TEST_SETTINGS,
    });

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.goal).toBe('New goal');
  });

  it('should include boardId and sprintId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'sprint-7', name: 'S', isCompleted: false }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-3', sprintId: 'sprint-7', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/agiles/board-3/sprints/sprint-7');
  });

  it('should default isCompleted to false when not in response', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'sprint-1', name: 'Sprint 1' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', sprintId: 'sprint-1', settings: TEST_SETTINGS });

    expect(result.isCompleted).toBe(false);
  });

  it('should throw when boardId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ sprintId: 'sprint-1', settings: TEST_SETTINGS })
    ).toThrow('ext_update_sprint failed:');
  });

  it('should throw when sprintId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ boardId: 'board-1', settings: TEST_SETTINGS })
    ).toThrow('ext_update_sprint failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not Found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ boardId: 'board-1', sprintId: 'bad-sprint', settings: TEST_SETTINGS })
    ).toThrow('ext_update_sprint failed:');
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });
});

export {};
