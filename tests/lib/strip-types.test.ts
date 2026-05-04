import { stripYtTypes } from '../../src/lib/strip-types';

describe('stripYtTypes', () => {
  it('removes $type from a flat object', () => {
    expect(stripYtTypes({ id: '1', $type: 'Issue', name: 'X' })).toEqual({ id: '1', name: 'X' });
  });

  it('removes $type recursively from nested objects', () => {
    const input = {
      $type: 'Issue',
      id: '1',
      project: { $type: 'Project', id: 'p', shortName: 'DEMO' },
      reporter: { $type: 'User', login: 'a' },
    };
    expect(stripYtTypes(input)).toEqual({
      id: '1',
      project: { id: 'p', shortName: 'DEMO' },
      reporter: { login: 'a' },
    });
  });

  it('removes $type from objects inside arrays', () => {
    const input = [
      { $type: 'Issue', id: '1', tags: [{ $type: 'Tag', name: 't1' }] },
      { $type: 'Issue', id: '2', tags: [] },
    ];
    expect(stripYtTypes(input)).toEqual([
      { id: '1', tags: [{ name: 't1' }] },
      { id: '2', tags: [] },
    ]);
  });

  it('preserves null, primitives, and undefined', () => {
    expect(stripYtTypes(null)).toBeNull();
    expect(stripYtTypes(42)).toBe(42);
    expect(stripYtTypes('hi')).toBe('hi');
    expect(stripYtTypes(true)).toBe(true);
    expect(stripYtTypes(undefined)).toBeUndefined();
  });

  it('preserves keys named "type" (without the dollar sign)', () => {
    expect(stripYtTypes({ id: '1', type: 'Bug', $type: 'Issue' })).toEqual({ id: '1', type: 'Bug' });
  });
});
