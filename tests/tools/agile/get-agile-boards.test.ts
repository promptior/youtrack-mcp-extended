jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/agile/get-agile-boards';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_agile_boards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of agile boards from raw array response', () => {
    const boards = [
      { id: 'board-1', name: 'Dev Board', status: 'active', projects: [{ id: 'DEMO', name: 'Demo' }] },
      { id: 'board-2', name: 'QA Board', status: 'active', projects: [] },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify(boards) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ settings: TEST_SETTINGS });

    expect(result).toEqual({ boards });
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should return empty boards array when response is empty array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ settings: TEST_SETTINGS });

    expect(result).toEqual({ boards: [] });
  });

  it('should return empty boards array when response is not an array', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({}) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ settings: TEST_SETTINGS });

    expect(result).toEqual({ boards: [] });
  });

  it('should use default top=50 and skip=0 when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('%24top=50');
    expect(url).toContain('%24skip=0');
  });

  it('should support custom top and skip pagination', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify([]) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ top: 10, skip: 20, settings: TEST_SETTINGS });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('%24top=10');
    expect(url).toContain('%24skip=20');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 403, response: 'Forbidden' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_get_agile_boards failed:');
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with boards property', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.boards).toBeDefined();
  });
});

export {};
