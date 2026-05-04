/**
 * YouTrack stores Priority, State, Type, Assignee and friends as
 * customFields entries, NOT as top-level Issue properties. Asking for
 * `priority(name)` directly in fields= silently returns nothing.
 *
 * This helper takes the customFields array YouTrack returns and projects
 * the well-known fields onto a flat object the LLM caller can use directly.
 * Unknown custom fields are kept under `customFields` so callers that need
 * them still have access.
 */
export interface ProjectedIssueFields {
  priority: { name: string } | null;
  state: { name: string } | null;
  type: { name: string } | null;
  assignee: { login: string; name: string } | null;
}

const KNOWN_FIELD_NAMES = ['Priority', 'State', 'Type', 'Assignee'] as const;

export function projectCustomFields(customFields: any[] | undefined | null): ProjectedIssueFields {
  const out: ProjectedIssueFields = {
    priority: null,
    state: null,
    type: null,
    assignee: null,
  };
  if (!Array.isArray(customFields)) return out;

  for (const cf of customFields) {
    if (!cf || typeof cf !== 'object') continue;
    const name: string = cf.name;
    const value: any = cf.value;
    if (!value) continue;
    if (name === 'Priority') out.priority = { name: value.name };
    else if (name === 'State') out.state = { name: value.name };
    else if (name === 'Type') out.type = { name: value.name };
    else if (name === 'Assignee') {
      out.assignee = { login: value.login, name: value.name };
    }
  }
  return out;
}

// Convenience: the YouTrack `fields=` projection that the helper expects.
// Use this in api-client requests so the customFields entries arrive shaped
// the way projectCustomFields can read them.
export const ISSUE_CUSTOM_FIELDS_PROJECTION =
  'customFields(name,value(name,login,text,id))';

export { KNOWN_FIELD_NAMES };
