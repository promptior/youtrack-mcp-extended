jest.mock('@jetbrains/youtrack-scripting-api/http');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as getTags from '../../../src/tools/tags/get-tags';

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_tags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return tags with default pagination', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'tag-1', name: 'urgent', color: { id: 'red' } },
          { id: 'tag-2', name: 'backlog', color: { id: 'blue' } },
        ]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getTags.aiTool.execute({ settings: defaultSettings });

    expect(result.tags).toHaveLength(2);
    expect(result.tags[0].name).toBe('urgent');
    expect(result.tags[1].name).toBe('backlog');
    expect(result.returnedCount).toBe(2);
    expect(result.hasMore).toBe(false);
  });

  it('should set hasMore=true when more than top results are returned (top+1 sentinel)', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          { id: 'tag-1', name: 'a' },
          { id: 'tag-2', name: 'b' },
          { id: 'tag-3', name: 'c' },
        ]),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getTags.aiTool.execute({ top: 2, settings: defaultSettings });

    expect(result.tags).toHaveLength(2);
    expect(result.returnedCount).toBe(2);
    expect(result.hasMore).toBe(true);
    const url = mockConnection.get.mock.calls[0][0];
    // top+1 sentinel: top=2 → API request top=3
    expect(url).toContain('%24top=3');
  });

  it('should support pagination with top and skip (top+1 sentinel)', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ id: 'tag-1', name: 'urgent' }]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    getTags.aiTool.execute({ top: 50, skip: 10, settings: defaultSettings });

    const getCall = mockConnection.get.mock.calls[0][0];
    // top+1 sentinel: top=50 → API request top=51
    expect(getCall).toMatch(/\$*top.*51/);
    expect(getCall).toMatch(/\$*skip.*10/);
  });

  it('should handle empty tag list', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getTags.aiTool.execute({ settings: defaultSettings });

    expect(result.tags).toHaveLength(0);
  });

  it('should have correct annotations', () => {
    expect(getTags.aiTool.annotations.readOnlyHint).toBe(true);
    expect(getTags.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
