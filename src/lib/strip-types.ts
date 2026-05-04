/**
 * Recursively removes the `$type` metadata field that YouTrack injects into
 * every entity in API responses. The LLM caller does not need it and it
 * inflates token usage. Tools that genuinely need the discriminator (e.g.
 * get_issue_activities) must opt out via the `keepTypes` flag in api-client.
 */
export function stripYtTypes<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripYtTypes) as unknown as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (k === '$type') continue;
      out[k] = stripYtTypes(v);
    }
    return out as T;
  }
  return value;
}
