# Security Policy

## Supported versions

Only the latest published version of `@promtior/youtrack-mcp-extended` on npm receives security fixes.

## Reporting a vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Report them privately through
[GitHub Security Advisories](https://github.com/promptior/youtrack-mcp-extended/security/advisories/new).
We aim to acknowledge reports within 5 business days and to ship a fix, or explain why we
consider the report out of scope, within 30 days.

When reporting, please include:

- The affected tool or module, and the version you are running.
- What an attacker gains — be explicit about which trust boundary is crossed.
- Steps to reproduce, with your YouTrack token and any private data **redacted**.

## Threat model

This server holds a YouTrack permanent token supplied by the operator and acts on their
behalf. Understanding what is and is not a vulnerability here saves everyone time:

**In scope**

- Anything that lets a party *other than the operator* use the token, read its value, or
  reach a YouTrack resource the token's own permissions would not allow.
- Missing or incorrect MCP `destructiveHint` / `readOnlyHint` annotations. MCP clients use
  these to decide whether to ask the user to confirm an action, so an operation that
  destroys data while claiming to be non-destructive bypasses that check.
- Anything that causes a destructive YouTrack operation to run without the operator's
  intent, including via content the model reads (prompt injection reaching a write tool).
- Dependency vulnerabilities that are reachable from this package's code paths.

**Out of scope**

- A tool doing something the supplied token is authorised to do. This server is as
  privileged as the token you give it — scope your permanent token to what you actually
  need, per the [Authentication](README.md#authentication) section.
- An attacker who already has a shell on the machine running the server, or read access to
  its environment or MCP client config. That attacker can read the token directly.
- Anything requiring a modified YouTrack instance or a compromised YouTrack administrator.

## Operator guidance

- Grant the permanent token the narrowest scope that covers your workflows.
- Prefer a dedicated service account over a personal token, so its actions are auditable
  and its permissions can be revoked independently.
- Treat `YOUTRACK_TOKEN` as a secret: keep it out of source control, shell history, and
  anything you paste into an issue.
