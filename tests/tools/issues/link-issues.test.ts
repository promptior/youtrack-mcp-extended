jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const tool = require('../../../src/tools/issues/link-issues');

const defaultSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'test-token',
};

const empty = () => ({ isSuccess: true, code: 200, response: JSON.stringify([]) });
const confirming = (targetId: string, verb = 'relates to') => ({
  isSuccess: true,
  code: 200,
  response: JSON.stringify([
    {
      direction: 'OUTWARD',
      linkType: { name: 'Relates', sourceToTarget: verb, targetToSource: verb },
      issues: [{ idReadable: targetId }],
    },
  ]),
});

// Build a connection where the first GET returns "no link", the second returns confirmation.
const buildHappyPath = (targetId: string) => ({
  addHeader: jest.fn(),
  post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
  get: jest.fn().mockReturnValueOnce(empty()).mockReturnValueOnce(confirming(targetId)),
});

describe('link_issues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should link two issues using /commands and verify with get_issue_links', () => {
    const mockConnection = buildHappyPath('DEMO-2');
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      targetIssueId: 'DEMO-2',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      linked: true,
      created: true,
      issueId: 'DEMO-1',
      targetIssueId: 'DEMO-2',
      linkTypeName: 'relates to',
    });
    expect(mockConnection.post).toHaveBeenCalledTimes(1);
    expect(mockConnection.get).toHaveBeenCalledTimes(2);
  });

  it('should return created:false and skip POST when the link already exists', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn(),
      get: jest.fn().mockReturnValue(confirming('DEMO-2')),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      targetIssueId: 'DEMO-2',
      settings: defaultSettings,
    });

    expect(result).toEqual({
      linked: true,
      created: false,
      issueId: 'DEMO-1',
      targetIssueId: 'DEMO-2',
      linkTypeName: 'relates to',
    });
    expect(mockConnection.post).not.toHaveBeenCalled();
    expect(mockConnection.get).toHaveBeenCalledTimes(1);
  });

  it('should POST to /commands endpoint', () => {
    const mockConnection = buildHappyPath('DEMO-2');
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', targetIssueId: 'DEMO-2', settings: defaultSettings });

    const url = mockConnection.post.mock.calls[0][0];
    expect(url).toContain('/commands');
  });

  it('should send source issue as idReadable and target in query', () => {
    const mockConnection = buildHappyPath('DEMO-2');
    mockHttp.Connection.mockReturnValue(mockConnection);

    tool.aiTool.execute({ issueId: 'DEMO-1', targetIssueId: 'DEMO-2', settings: defaultSettings });

    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.issues).toEqual([{ idReadable: 'DEMO-1' }]);
    expect(body.query).toBe('relates to DEMO-2');
  });

  it('should use custom link type name in command query', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
      get: jest.fn()
        .mockReturnValueOnce(empty())
        .mockReturnValueOnce(confirming('DEMO-3', 'depends on')),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = tool.aiTool.execute({
      issueId: 'DEMO-1',
      targetIssueId: 'DEMO-3',
      linkTypeName: 'depends on',
      settings: defaultSettings,
    });

    expect(result.linkTypeName).toBe('depends on');
    expect(result.created).toBe(true);
    const body = JSON.parse(mockConnection.post.mock.calls[0][2]);
    expect(body.query).toBe('depends on DEMO-3');
  });

  it('should throw when verification GET shows the link did not actually get created', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({ isSuccess: true, code: 200, response: '{}' }),
      // Both before and after GETs show no link → /commands didn't actually link.
      get: jest.fn().mockReturnValue(empty()),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({
        issueId: 'DEMO-1',
        targetIssueId: 'DEMO-2',
        linkTypeName: 'invalid verb',
        settings: defaultSettings,
      })
    ).toThrow(/Link command did not produce a link/);
  });

  it('should throw when issueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ targetIssueId: 'DEMO-2', settings: defaultSettings })
    ).toThrow('ext_link_issues failed: issueId is required');
  });

  it('should throw when targetIssueId is missing', () => {
    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', settings: defaultSettings })
    ).toThrow('ext_link_issues failed: targetIssueId is required');
  });

  it('should throw on API error from /commands', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: false,
        code: 404,
        response: 'Issue not found',
      }),
      // First (snapshot) GET returns no existing link so we proceed to POST.
      get: jest.fn().mockReturnValue(empty()),
    };
    mockHttp.Connection.mockReturnValue(mockConnection);

    expect(() =>
      tool.aiTool.execute({ issueId: 'DEMO-1', targetIssueId: 'NOTFOUND-99', settings: defaultSettings })
    ).toThrow('ext_link_issues failed: YouTrack API error 404:');
  });

  it('should have correct annotations', () => {
    expect(tool.aiTool.annotations.readOnlyHint).toBe(false);
    expect(tool.aiTool.annotations.destructiveHint).toBe(false);
    expect(tool.aiTool.annotations.idempotentHint).toBe(false);
  });

  it('should have valid outputSchema', () => {
    expect(tool.aiTool.outputSchema).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.linked).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.created).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.issueId).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.targetIssueId).toBeDefined();
    expect(tool.aiTool.outputSchema.properties.linkTypeName).toBeDefined();
  });
});

export {};
