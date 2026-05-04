jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/get-issue-links');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

describe('get_issue_links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return links from REST response', () => {
    const mockLinks = [
      {
        id: 'link-1',
        direction: 'OUTWARD',
        linkType: { name: 'Relates', sourceToTarget: 'relates to', targetToSource: 'is related to' },
        issues: [{ id: '2-1', idReadable: 'DEMO-2', summary: 'Other issue' }],
      },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ links: mockLinks }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({ links: mockLinks });
  });

  it('should filter out empty link buckets (YouTrack returns one per linkType×direction)', () => {
    // When an issue has no links, YouTrack still returns one bucket per
    // (linkType × direction) with issues:[]. The tool must hide that noise.
    const mockLinks = [
      { id: '167-0', direction: 'BOTH', linkType: { name: 'Relates' }, issues: [] },
      {
        id: '167-1s',
        direction: 'OUTWARD',
        linkType: { name: 'Depend' },
        issues: [{ id: '2-1', idReadable: 'DEMO-2', summary: 'Linked' }],
      },
      { id: '167-1t', direction: 'INWARD', linkType: { name: 'Depend' }, issues: [] },
    ];
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ links: mockLinks }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result.links).toHaveLength(1);
    expect(result.links[0].id).toBe('167-1s');
  });

  it('should GET /issues/{issueId} with links fields', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ links: [] }),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    const url = mockConnection.get.mock.calls[0][0];
    expect(url).toContain('/issues/DEMO-1');
    expect(url).toContain('links');
  });

  it('should return empty links array when links is undefined', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({}),
      }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings });

    expect(result).toEqual({ links: [] });
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ settings: defaultSettings })
    ).toThrow('ext_get_issue_links failed: issueId is required');
  });

  it('should throw on API error', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({ isSuccess: false, code: 404, response: 'Not found' }),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'NOTFOUND-1', settings: defaultSettings })
    ).toThrow('ext_get_issue_links failed: YouTrack API error 404');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(true);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
