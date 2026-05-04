import { projectCustomFields, ISSUE_CUSTOM_FIELDS_PROJECTION } from '../../src/lib/issue-fields';

describe('projectCustomFields', () => {
  it('returns all-null projection when input is undefined', () => {
    expect(projectCustomFields(undefined)).toEqual({
      priority: null,
      state: null,
      type: null,
      assignee: null,
    });
  });

  it('returns all-null projection when input is null', () => {
    expect(projectCustomFields(null)).toEqual({
      priority: null,
      state: null,
      type: null,
      assignee: null,
    });
  });

  it('returns all-null projection when input is not an array', () => {
    expect(projectCustomFields({} as any)).toEqual({
      priority: null,
      state: null,
      type: null,
      assignee: null,
    });
  });

  it('projects priority, state, type and assignee from customFields', () => {
    const cf = [
      { name: 'Priority', value: { name: 'Major' } },
      { name: 'State', value: { name: 'In Progress' } },
      { name: 'Type', value: { name: 'Bug' } },
      { name: 'Assignee', value: { login: 'jdoe', name: 'John Doe' } },
    ];
    expect(projectCustomFields(cf)).toEqual({
      priority: { name: 'Major' },
      state: { name: 'In Progress' },
      type: { name: 'Bug' },
      assignee: { login: 'jdoe', name: 'John Doe' },
    });
  });

  it('treats unset custom fields (value=null) as null in the projection', () => {
    const cf = [
      { name: 'Priority', value: null },
      { name: 'State', value: { name: 'Open' } },
    ];
    expect(projectCustomFields(cf)).toEqual({
      priority: null,
      state: { name: 'Open' },
      type: null,
      assignee: null,
    });
  });

  it('skips entries that are not plain objects', () => {
    const cf = [null, 'not-an-object', 42, { name: 'Priority', value: { name: 'Critical' } }];
    expect(projectCustomFields(cf as any)).toEqual({
      priority: { name: 'Critical' },
      state: null,
      type: null,
      assignee: null,
    });
  });

  it('ignores unknown custom field names', () => {
    const cf = [
      { name: 'Some Custom Field', value: { name: 'whatever' } },
      { name: 'Priority', value: { name: 'Minor' } },
    ];
    expect(projectCustomFields(cf)).toEqual({
      priority: { name: 'Minor' },
      state: null,
      type: null,
      assignee: null,
    });
  });
});

describe('ISSUE_CUSTOM_FIELDS_PROJECTION', () => {
  it('exposes a fields= projection that lets the helper read custom fields', () => {
    expect(ISSUE_CUSTOM_FIELDS_PROJECTION).toContain('customFields');
    expect(ISSUE_CUSTOM_FIELDS_PROJECTION).toContain('name');
    expect(ISSUE_CUSTOM_FIELDS_PROJECTION).toContain('value');
  });
});
