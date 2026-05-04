export const mockSettings = {
  youtrackBaseUrl: 'https://test.youtrack.cloud',
  apiToken: 'perm-test-token',
};

export const mockResponse = {
  isSuccess: true,
  code: 200,
  response: '{}',
};

export const mockConnection = {
  addHeader: jest.fn(),
  get: jest.fn().mockReturnValue(mockResponse),
  post: jest.fn().mockReturnValue(mockResponse),
  delete: jest.fn().mockReturnValue(mockResponse),
};

export const Connection = jest.fn().mockImplementation(() => mockConnection);
export const getSettings = jest.fn().mockReturnValue(mockSettings);

export const mockIssue = {
  id: 'DEMO-1',
  summary: 'Test issue',
  description: 'Test description',
  comments: { forEach: jest.fn() },
  links: { forEach: jest.fn() },
  attachments: { forEach: jest.fn() },
  workItems: { forEach: jest.fn() },
  tags: { add: jest.fn(), remove: jest.fn() },
  delete: jest.fn(),
  fields: {},
  project: { id: 'DEMO', name: 'Demo Project', key: 'DEMO' },
};

export const Issue = {
  findById: jest.fn().mockReturnValue(mockIssue),
};

export const Project = {
  findByKey: jest.fn(),
  findById: jest.fn(),
};

export const User = {
  findByLogin: jest.fn(),
  findAll: jest.fn(),
};

export default {
  Connection,
  getSettings,
  Issue,
  Project,
  User,
};
