jest.mock('@jetbrains/youtrack-scripting-api/http');

import * as mockHttp from '@jetbrains/youtrack-scripting-api/http';
import * as getIssueLinkTypes from '../../../src/tools/issue-link-types/get-issue-link-types';

const defaultSettings = { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 'test-token' };

describe('get_issue_link_types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return issue link types', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([
          {
            id: 'relates-to',
            name: 'relates to',
            sourceToTarget: 'relates to',
            targetToSource: 'is related to',
            directed: true,
          },
          {
            id: 'duplicates',
            name: 'duplicates',
            sourceToTarget: 'duplicates',
            targetToSource: 'is duplicated by',
            directed: true,
          },
        ]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueLinkTypes.aiTool.execute({ settings: defaultSettings });

    expect(result.linkTypes).toHaveLength(2);
    expect(result.linkTypes[0].name).toBe('relates to');
    expect(result.linkTypes[1].sourceToTarget).toBe('duplicates');
  });

  it('should handle empty list', () => {
    const mockConnection = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([]),
      }),
    };

    mockHttp.Connection.mockReturnValue(mockConnection);

    const result = getIssueLinkTypes.aiTool.execute({ settings: defaultSettings });

    expect(result.linkTypes).toHaveLength(0);
  });

  it('should have correct annotations', () => {
    expect(getIssueLinkTypes.aiTool.annotations.readOnlyHint).toBe(true);
    expect(getIssueLinkTypes.aiTool.annotations.destructiveHint).toBe(false);
  });
});

export {};
