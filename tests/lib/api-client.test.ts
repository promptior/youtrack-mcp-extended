jest.mock('@jetbrains/youtrack-scripting-api/http');

const mockHttp = require('@jetbrains/youtrack-scripting-api/http');
const { apiGet, apiPost } = require('../../src/lib/api-client');

const SETTINGS = {
  settings: { youtrackBaseUrl: 'https://test.youtrack.cloud', apiToken: 't' },
};

describe('api-client: $type stripping', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('apiGet strips $type recursively by default', () => {
    const conn = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({
          $type: 'Issue',
          id: '1',
          project: { $type: 'Project', id: 'p' },
        }),
      }),
    };
    mockHttp.Connection.mockReturnValue(conn);

    const result = apiGet(SETTINGS, '/issues/1');
    expect(result).toEqual({ id: '1', project: { id: 'p' } });
  });

  it('apiGet keeps $type when keepTypes=true (for tools that need the discriminator)', () => {
    const conn = {
      addHeader: jest.fn(),
      get: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify([{ $type: 'CommentActivityItem', id: 'a1' }]),
      }),
    };
    mockHttp.Connection.mockReturnValue(conn);

    const result = apiGet(SETTINGS, '/issues/1/activities', {}, true);
    expect(result).toEqual([{ $type: 'CommentActivityItem', id: 'a1' }]);
  });

  it('apiPost strips $type from the response by default', () => {
    const conn = {
      addHeader: jest.fn(),
      post: jest.fn().mockReturnValue({
        isSuccess: true,
        code: 200,
        response: JSON.stringify({ $type: 'Sprint', id: 's1', name: 'X' }),
      }),
    };
    mockHttp.Connection.mockReturnValue(conn);

    const result = apiPost(SETTINGS, '/agiles/b/sprints', { name: 'X' });
    expect(result).toEqual({ id: 's1', name: 'X' });
  });
});
