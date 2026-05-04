jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/work-items/get-all-work-items';

const DEFAULT_SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' },
};

const makeWorkItem = (id: string) => ({
  id,
  date: 1700000000000,
  duration: { minutes: 60 },
  author: { login: 'john.doe', name: 'John Doe' },
  creator: { login: 'john.doe', name: 'John Doe' },
  issue: { id: 'DEMO-1', idReadable: 'DEMO-1', summary: 'Test issue' },
  text: 'Worked on feature',
  type: { name: 'Development' },
});

describe('get_all_work_items', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return work items and hasMore: false when result count <= top', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([makeWorkItem('wi-1'), makeWorkItem('wi-2')]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.workItems).toHaveLength(2);
    expect(result.hasMore).toBe(false);
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should return hasMore: true when extra item is returned', () => {
    // top defaults to 50, so we return 51 items to trigger hasMore
    const items = Array.from({ length: 51 }, (_, i) => makeWorkItem(`wi-${i}`));
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify(items),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    expect(result.workItems).toHaveLength(50);
    expect(result.hasMore).toBe(true);
  });

  it('should map work item fields correctly', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([makeWorkItem('wi-1')]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    const item = result.workItems[0];
    expect(item.id).toBe('wi-1');
    expect(item.date).toBe(1700000000000);
    expect(item.duration).toBe(60);
    expect(item.author).toEqual({ login: 'john.doe', name: 'John Doe' });
    expect(item.issue).toEqual({ id: 'DEMO-1', idReadable: 'DEMO-1', summary: 'Test issue' });
    expect(item.description).toBe('Worked on feature');
    expect(item.type).toEqual({ name: 'Development' });
  });

  it('should pass top and skip parameters correctly', () => {
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
    expect(getCall).toMatch(/\$*top.*11/); // top+1 to detect hasMore
    expect(getCall).toMatch(/\$*skip.*20/);
  });

  it('should pass startDate and endDate when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({
      ...DEFAULT_SETTINGS,
      startDate: 1700000000000,
      endDate: 1700086400000,
    });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('start=1700000000000');
    expect(getCall).toContain('end=1700086400000');
  });

  it('should pass authorLogin as author parameter when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ ...DEFAULT_SETTINGS, authorLogin: 'john.doe' });

    const getCall = mockConnection.get.mock.calls[0][0];
    expect(getCall).toContain('author=john.doe');
  });

  it('should handle empty work items list', () => {
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

    expect(result.workItems).toHaveLength(0);
    expect(result.hasMore).toBe(false);
  });

  it('should use default values for missing author and type fields', () => {
    const incompleteItem = {
      id: 'wi-incomplete',
      date: 1700000000000,
      duration: null,
      author: null,
      issue: null,
      text: null,
      type: null,
    };
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([incompleteItem]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ ...DEFAULT_SETTINGS });

    const item = result.workItems[0];
    expect(item.duration).toBe(0);
    expect(item.author.login).toBe('unknown');
    expect(item.author.name).toBe('');
    expect(item.issue.id).toBe('');
    expect(item.description).toBe('');
    expect(item.type.name).toBe('Work Item');
  });

  it('should throw when top is less than 1', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, top: 0 })
    ).toThrow('ext_get_all_work_items failed:');
  });

  it('should throw when top exceeds 100', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, top: 101 })
    ).toThrow('ext_get_all_work_items failed:');
  });

  it('should throw when skip is negative', () => {
    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS, skip: -1 })
    ).toThrow('ext_get_all_work_items failed:');
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

    expect(() =>
      tool.aiTool.execute({ ...DEFAULT_SETTINGS })
    ).toThrow('ext_get_all_work_items failed: YouTrack API error 403:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have valid outputSchema with required fields', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.workItems).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.hasMore).toBeDefined();
    expect(tool.aiTool.outputSchema.required).toContain('workItems');
    expect(tool.aiTool.outputSchema.required).toContain('hasMore');
  });
});

export {};
