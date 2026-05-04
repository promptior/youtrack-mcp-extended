jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/agile/create-sprint';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('create_sprint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a sprint with required fields', () => {
    const mockResult = { id: 'sprint-new', name: 'Sprint 1', start: null, finish: null };
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockResult) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', name: 'Sprint 1', settings: TEST_SETTINGS });

    expect(result).toEqual({
      id: 'sprint-new',
      name: 'Sprint 1',
      goal: '',
      start: null,
      finish: null,
      isCompleted: false,
      archived: false,
    });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should create a sprint with all optional fields', () => {
    const mockResult = { id: 'sprint-full', name: 'Sprint Full', start: 1000000, finish: 2000000 };
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockResult) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      boardId: 'board-1',
      name: 'Sprint Full',
      goal: 'Complete user stories',
      startDate: 1000000,
      finishDate: 2000000,
      settings: TEST_SETTINGS,
    });

    expect(result.start).toBe(1000000);
    expect(result.finish).toBe(2000000);

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.goal).toBe('Complete user stories');
    expect(body.start).toBe(1000000);
    expect(body.finish).toBe(2000000);
  });

  it('should include boardId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 's1', name: 'S1', start: null, finish: null }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-7', name: 'Sprint', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/agiles/board-7/sprints');
  });

  it('should not include optional fields if not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 's1', name: 'S1', start: null, finish: null }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-1', name: 'Sprint', settings: TEST_SETTINGS });

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.goal).toBeUndefined();
    expect(body.start).toBeUndefined();
    expect(body.finish).toBeUndefined();
  });

  it('should throw when boardId is missing', () => {
    expect(() => tool.aiTool.execute({ name: 'Sprint 1', settings: TEST_SETTINGS })).toThrow(
      'ext_create_sprint failed:'
    );
  });

  it('should throw when name is missing', () => {
    expect(() => tool.aiTool.execute({ boardId: 'board-1', settings: TEST_SETTINGS })).toThrow(
      'ext_create_sprint failed:'
    );
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 400, response: 'Bad Request' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ boardId: 'board-1', name: 'Sprint', settings: TEST_SETTINGS })
    ).toThrow('ext_create_sprint failed:');
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });
});

export {};
