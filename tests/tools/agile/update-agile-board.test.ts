jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/agile/update-agile-board';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('update_agile_board', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update board name and return updated board', () => {
    const mockResult = { id: 'board-1', name: 'Updated Board', sprintsSettings: { disableSprints: false } };
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockResult) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', name: 'Updated Board', settings: TEST_SETTINGS });

    expect(result.id).toBe('board-1');
    expect(result.name).toBe('Updated Board');
    expect(result.sprintsEnabled).toBe(true);
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should send sprintsSettings.disableSprints inverted from sprintsEnabled', () => {
    const mockResult = { id: 'board-1', name: 'My Board', sprintsSettings: { disableSprints: true } };
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(mockResult) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', sprintsEnabled: false, settings: TEST_SETTINGS });

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.sprintsSettings).toEqual({ disableSprints: true });
    expect(body.sprintsEnabled).toBeUndefined();
    expect(result.sprintsEnabled).toBe(false);
  });

  it('should include boardId in the API URL', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'board-42', name: 'B', sprintsSettings: { disableSprints: true } }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ boardId: 'board-42', name: 'B', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/agiles/board-42');
  });

  it('should default sprintsEnabled to false when sprintsSettings missing in response', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: 'board-1', name: 'Board' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ boardId: 'board-1', settings: TEST_SETTINGS });

    expect(result.sprintsEnabled).toBe(false);
  });

  it('should throw when boardId is missing', () => {
    expect(() => tool.aiTool.execute({ name: 'New Name', settings: TEST_SETTINGS })).toThrow(
      'ext_update_agile_board failed:'
    );
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not Found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ boardId: 'bad-board', settings: TEST_SETTINGS })).toThrow(
      'ext_update_agile_board failed:'
    );
  });

  it('should have correct write annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
