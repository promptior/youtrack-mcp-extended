jest.mock('@jetbrains/youtrack-scripting-api/http');
jest.mock('@jetbrains/youtrack-scripting-api/app');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as tool from '../../../src/tools/commands/get-command-suggestions';

const TEST_SETTINGS = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_command_suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return suggestions for a partial command query', () => {
    const mockSuggestions = [
      { prefix: 'State ', option: 'In Progress', suffix: '', description: 'Set state', matchingStart: 6, matchingEnd: 17 },
      { prefix: 'State ', option: 'In Review', suffix: '', description: 'Set state', matchingStart: 6, matchingEnd: 15 },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: mockSuggestions }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ query: 'State In', settings: TEST_SETTINGS });

    expect(result.suggestions).toHaveLength(2);
    expect(result.suggestions[0].option).toBe('In Progress');
    expect(mockConnection.addHeader).toHaveBeenCalledWith('Authorization', 'Bearer test-token');
  });

  it('should return empty suggestions array when response has no suggestions', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: JSON.stringify({}) }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ query: 'zzz nonexistent', settings: TEST_SETTINGS });

    expect(result.suggestions).toEqual([]);
  });

  it('should POST to /commands/assist endpoint', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'Priority', settings: TEST_SETTINGS });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/commands/assist');
  });

  it('should send query in the request body', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'State Fix', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.query).toBe('State Fix');
  });

  it('should include issues array in body when issueId is provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1' }),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'State', issueId: 'DEMO-1', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.issues).toEqual([{ $type: 'Issue', id: '2-1' }]);
  });

  it('should resolve readable issueId to internal ID before calling suggestions', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1' }),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'State', issueId: 'DEMO-1', settings: TEST_SETTINGS });

    const postBody = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(postBody.issues).toEqual([{ $type: 'Issue', id: '2-1' }]);
  });

  it('should not include issues in body when issueId is not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'State', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.issues).toBeUndefined();
  });

  it('should include caret in body when provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'State In', caret: 8, settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.caret).toBe(8);
  });

  it('should default caret to query.length when not provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'State', settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.caret).toBe('State'.length);
  });

  it('should include both issueId and caret when both are provided', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ id: '2-1' }),
      }),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ suggestions: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ query: 'Priority Cr', issueId: 'DEMO-5', caret: 11, settings: TEST_SETTINGS });

    const bodyStr = mockConnection.post.mock.calls[0][2];
    const body = JSON.parse(bodyStr);
    expect(body.issues).toEqual([{ $type: 'Issue', id: '2-1' }]);
    expect(body.caret).toBe(11);
  });

  it('should throw when query is missing', () => {
    expect(() => tool.aiTool.execute({ settings: TEST_SETTINGS })).toThrow('ext_get_command_suggestions failed:');
  });

  it('should throw when API call fails', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: false, code: 500, response: 'Internal Server Error' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() => tool.aiTool.execute({ query: 'State', settings: TEST_SETTINGS })).toThrow(
      'ext_get_command_suggestions failed:'
    );
  });

  it('should have correct readOnly annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(true);
  });

  it('should have a valid outputSchema with suggestions property', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.suggestions).toBeDefined();
  });
});

export {};
