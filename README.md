# @promtior/youtrack-mcp-extended

> Extended MCP server for YouTrack — a complement to JetBrains' official MCP with broader REST API coverage.

[![npm version](https://img.shields.io/npm/v/%40promtior%2Fyoutrack-mcp-extended.svg?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@promtior/youtrack-mcp-extended)
[![npm downloads](https://img.shields.io/npm/dm/%40promtior%2Fyoutrack-mcp-extended.svg?label=downloads&color=blue)](https://www.npmjs.com/package/@promtior/youtrack-mcp-extended)
[![license](https://img.shields.io/npm/l/%40promtior%2Fyoutrack-mcp-extended.svg?color=green)](LICENSE)
[![node](https://img.shields.io/node/v/%40promtior%2Fyoutrack-mcp-extended.svg?logo=node.js&logoColor=white)](https://nodejs.org/)

---

## TL;DR

```bash
npx @promtior/youtrack-mcp-extended
```

Set two environment variables, point your MCP client at it, and you get **70 tools** covering the full YouTrack REST API — a broader surface than the ~19 tools currently shipped by JetBrains' official MCP server (as of today).

```bash
YOUTRACK_URL=https://your-instance.youtrack.cloud
YOUTRACK_TOKEN=perm:your-permanent-token
```

Works with Claude Desktop, Claude Code, and any MCP-compatible client. Compatible with YouTrack Cloud and self-hosted installations.

---

## Table of Contents

- [Why this exists](#why-this-exists)
- [Installation](#installation)
- [Configuration](#configuration)
- [Tool Reference](#tool-reference)
  - [Issues](#issues)
  - [Comments & Reactions](#comments--reactions)
  - [Time Tracking](#time-tracking)
  - [Issue Links](#issue-links)
  - [Issue Link Types](#issue-link-types)
  - [Attachments](#attachments)
  - [Activities](#activities)
  - [Tags](#tags)
  - [Saved Queries](#saved-queries)
  - [Agile Boards & Sprints](#agile-boards--sprints)
  - [Knowledge Base (Articles)](#knowledge-base-articles)
  - [Projects](#projects)
  - [Users & Groups](#users--groups)
  - [Commands](#commands)
- [Coverage compared to the Official JetBrains MCP](#coverage-compared-to-the-official-jetbrains-mcp)
- [Known Limitations](#known-limitations)
- [Authentication](#authentication)
- [Contributing](#contributing)

---

## Why this exists

The [official JetBrains YouTrack MCP server](https://www.jetbrains.com/help/youtrack/cloud/mcp-server.html) is a solid starting point and covers the most common workflows — searching issues, creating issues, updating fields. As of today, it focuses on a curated subset of the REST API, so a number of scenarios aren't covered yet: deleting issues, managing article comments, handling reactions, working with agile boards programmatically, deleting links, uploading attachments, or creating projects. JetBrains is actively iterating on it, so this scope is likely to grow over time.

We built `@promtior/youtrack-mcp-extended` to give teams more independence and power on top of YouTrack — without waiting for any specific roadmap. It's a standalone npm package that calls the YouTrack REST API directly, so you control which capabilities are exposed and how they behave. No app package installation in your YouTrack instance, no ZIP deployment, no admin access to YouTrack itself beyond a permanent token.

---

## Installation

### npx (no install needed)

```bash
npx @promtior/youtrack-mcp-extended
```

### Global install

```bash
npm install -g @promtior/youtrack-mcp-extended
youtrack-mcp-extended
```

> The installed binary is `youtrack-mcp-extended` (unscoped) — only the npm package name carries the `@promtior/` scope.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "youtrack-mcp-extended": {
      "command": "npx",
      "args": ["@promtior/youtrack-mcp-extended"],
      "env": {
        "YOUTRACK_URL": "https://your-instance.youtrack.cloud",
        "YOUTRACK_TOKEN": "perm:your-permanent-token"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add youtrack-mcp-extended \
  -e YOUTRACK_URL=https://your-instance.youtrack.cloud \
  -e YOUTRACK_TOKEN=perm:your-permanent-token \
  -- npx @promtior/youtrack-mcp-extended
```

---

## Configuration

| Environment Variable | Required | Description |
|---|---|---|
| `YOUTRACK_URL` | ✅ | Base URL of your YouTrack instance (e.g., `https://mycompany.youtrack.cloud`) |
| `YOUTRACK_TOKEN` | ✅ | Permanent token with appropriate permissions (see [Authentication](#authentication)) |

---

## Tool Reference

All tools accept readable issue IDs (`DEMO-123`) and project shortNames (`DEMO`) — no need to look up internal numeric IDs.

### Issues

| Tool | Description |
|---|---|
| `create_issue` | Create a new issue. Accepts `projectId` (shortName or ID), `summary`, optional `description`, `type`, and `assigneeLogin`. Type and assignee are applied via the `/commands` endpoint after creation, so any value valid in the YouTrack UI works. |
| `get_issue` | Get full details of an issue including all custom fields, tags, state, priority, and assignee. |
| `update_issue` | Update an issue's `summary` and/or `description`. For custom fields (state, priority, assignee), use `apply_command` or `change_issue_assignee`. |
| `delete_issue` | Permanently delete an issue. Irreversible. |
| `search_issues` | Search issues using YouTrack query language. Supports pagination via `top` and `skip`. Uses a `top+1` sentinel internally so `hasMore` is reliable without a second count call. |
| `get_issue_count` | Count issues matching a query without fetching details. Polls automatically when YouTrack returns the transient `count: -1, calculating: true` state — only sets `calculating: true` on the response if the count is still pending after the internal retry budget. |
| `change_issue_assignee` | Assign or unassign an issue. Pass an empty string `""` as `assigneeLogin` to unassign. |
| `manage_issue_tags` | Add or remove a tag from an issue (`action: "add"` or `"remove"`). Requires the tag's internal ID — get it from `get_tags`. |
| `move_issue_to_project` | Move an issue to a different project. `targetProjectId` must be the project's **internal ID** (e.g. `0-1`), not its shortName. The issue's readable ID changes to match the new project's prefix. ⚠ See [Known Limitations](#known-limitations) about workflow rules that may block the move. |

**Example:**
```
Create a bug in the DEMO project titled "Login fails on Safari" assigned to john.doe
→ create_issue(projectId="DEMO", summary="Login fails on Safari", type="Bug", assigneeLogin="john.doe")
```

---

### Comments & Reactions

| Tool | Description |
|---|---|
| `add_issue_comment` | Add a Markdown-formatted comment to an issue. |
| `get_issue_comments` | Get all comments for an issue with author and timestamp info. |
| `update_issue_comment` | Edit an existing comment. |
| `delete_issue_comment` | Permanently delete a comment. |
| `add_comment_reaction` | Add an emoji reaction to a comment (`thumbs-up`, `heart`, `laugh`, `confused`, `rocket`). |
| `delete_comment_reaction` | Remove a reaction. Requires the `reactionId` returned by `add_comment_reaction`. |

---

### Time Tracking

| Tool | Description |
|---|---|
| `log_work` | Log time spent on an issue. Specify `duration` in minutes, optional `description`, `date`, and `workType` (e.g., `"Development"`, `"Testing"`). Unknown work types fail with a list of available types. |
| `get_issue_work_items` | Get all time tracking entries for an issue, including duration, work type, author, and description. |
| `update_timetracking_work_item` | Update the duration, description, date, or work type of a time entry. |
| `delete_work_item` | Delete a time tracking entry. |
| `get_all_work_items` | Get time entries across the entire instance. Supports filtering by author login, date range, and pagination. |

---

### Issue Links

| Tool | Description |
|---|---|
| `link_issues` | Link two issues. Accepts any YouTrack link verb: `"relates to"`, `"depends on"`, `"duplicates"`, `"subtask of"`, etc. Default: `"relates to"`. |
| `get_issue_links` | Get all links for an issue, grouped by link type with direction (inward/outward). |
| `delete_issue_link` | Remove a link between two issues. Requires `issueId`, `linkId` (from `get_issue_links`), and `linkedIssueId`. |

---

### Issue Link Types

| Tool | Description |
|---|---|
| `get_issue_link_types` | List all available link types in the instance. |
| `create_issue_link_type` | Create a custom link type with `sourceToTarget` and `targetToSource` labels. |
| `update_issue_link_type` | Rename a link type or change its source/target labels. |

---

### Attachments

| Tool | Description |
|---|---|
| `upload_issue_attachment` | Upload a file to an issue. Pass `fileName`, `mimeType`, and base64-encoded `content` (max 10 MB before encoding). Uses multipart/form-data internally. |
| `get_issue_attachments` | List all attachments on an issue (name, size, MIME type, URL, uploader). |
| `delete_issue_attachment` | Delete a specific attachment by ID. |

---

### Activities

| Tool | Description |
|---|---|
| `get_issue_activities` | Get the full activity history of an issue — field changes, comments, work items, links, tags. Optionally filter by category. Unknown category names are rejected up-front with a clear error listing the valid options (YouTrack itself silently returns an empty list, which is easy to misread). When `categories` is omitted, a sensible default set is sent. |
| `get_issue_vcs_changes` | Get VCS commits and branches linked to an issue. Returns `{ vcsChanges: [...] }` only — the redundant `issueId` echo is intentionally omitted. |

**Activity categories** (filter with the `categories` parameter):
`IssueCreatedCategory`, `SummaryCategory`, `DescriptionCategory`, `CommentsCategory`, `WorkItemCategory`, `AttachmentsCategory`, `LinksCategory`, `TagsCategory`, `ProjectCategory`, `CustomFieldCategory`, `IssueResolvedCategory`, `VcsChangeCategory`, `SprintCategory`

---

### Tags

| Tool | Description |
|---|---|
| `create_tag` | Create a new tag with optional color. If YouTrack rejects the requested `colorId` it silently falls back to colorId `"0"`; this tool detects the mismatch, **deletes the orphan tag**, and throws — so you never end up with a half-coloured tag in the instance. |
| `get_tags` | List all tags in the instance with color and owner info. Paginated with `top+1` sentinel: returns `tags`, `returnedCount`, and `hasMore` (no global `total`). |
| `update_tag` | Rename a tag or change its color. If YouTrack rejects the requested `colorId` it actually **degrades** the existing colour to `"0"` (it does not just ignore the bad value). The tool snapshots the previous name and colour, restores both, and throws — leaving the tag exactly as it was before the call. |
| `delete_tag` | Delete a tag (removes it from all issues). |

> Use `manage_issue_tags` (in [Issues](#issues)) to attach or detach a tag from a specific issue.

---

### Saved Queries

| Tool | Description |
|---|---|
| `create_saved_query` | Save a YouTrack search query with a name. Optionally share it with all users. |
| `get_saved_issue_searches` | List all saved queries with their query strings and owners. |
| `update_saved_query` | Rename or change the query string of a saved search. |
| `delete_saved_query` | Delete a saved query. |

---

### Agile Boards & Sprints

| Tool | Description |
|---|---|
| `create_agile_board` | Create a new Agile board for one or more projects, using a specified field as columns (typically `"State"`). |
| `get_agile_boards` | List all Agile boards in the instance. |
| `get_agile_board` | Get detailed info about a specific board including projects, column settings, and sprint configuration. |
| `update_agile_board` | Rename a board or toggle sprint support (`sprintsEnabled: true/false`). |
| `create_sprint` | Create a sprint on a board with optional goal, start date, and finish date. |
| `get_sprints` | List sprints for a board. Filter by archived status. |
| `get_sprint` | Get full details of a specific sprint including associated issues. |
| `update_sprint` | Update a sprint's name, goal, dates, or completion status. |

---

### Knowledge Base (Articles)

| Tool | Description |
|---|---|
| `create_article` | Create a Knowledge Base article. Optionally nest it under a parent article. |
| `get_article` | Get the full content of an article including hierarchy, tags, and attachments. |
| `update_article` | Update an article's title and/or content. |
| `delete_article` | Delete an article and all its children. |
| `search_articles` | Search articles by keyword, optionally filtered by project. Accepts both project shortNames (`"DEMO"`) and internal IDs (`"0-0"`) for `projectId` — internal IDs are resolved to shortNames automatically before the query is built, since YouTrack's `project:` operator only accepts shortNames. |
| `get_sub_articles` | Get child articles nested under a parent. |
| `add_article_comment` | Add a comment to an article. |
| `get_article_comments` | Get all comments on an article. |
| `update_article_comment` | Edit an article comment. |
| `delete_article_comment` | Delete an article comment. |
| `get_article_attachments` | List attachments on an article. |

---

### Projects

| Tool | Description |
|---|---|
| `create_project` | Create a new project. Pass `name`, `shortName` (issue prefix, e.g. `"DEMO"`), optional `description`, and optional `leaderLogin` — defaults to the current authenticated user. |
| `find_projects` | List and search projects. Filter by name with the `query` parameter. |
| `get_project` | Get full details of a project by ID or shortName. |
| `get_issue_fields_schema` | Get the custom fields schema for a project — field types, names, and whether they're required. |

---

### Users & Groups

| Tool | Description |
|---|---|
| `get_current_user` | Get the profile of the authenticated user (the token owner). |
| `find_user` | Search for users by name or login. |
| `get_users` | List all users in the instance. Paginated with `top+1` sentinel: returns `users`, `returnedCount`, and `hasMore` (no global `total`). |
| `get_user_profile` | Get detailed profile info for a specific user (timezone, locale, email). |
| `find_user_groups` | List user groups with member counts. |
| `get_user_group_members` | Get the members of a specific group. |

---

### Commands

| Tool | Description |
|---|---|
| `apply_command` | Apply a YouTrack command to one or more issues. Supports the full YouTrack command syntax. Bulk-capable. |
| `get_command_suggestions` | Get autocomplete suggestions for a partial command string. ⚠ See [Known Limitations](#known-limitations). |

**`apply_command` examples:**
```
# Change state
apply_command(command="State In Progress", issueIds=["DEMO-42"])

# Bulk priority update
apply_command(command="Priority Critical", issueIds=["DEMO-1", "DEMO-2", "DEMO-3"])

# Assign to user
apply_command(command="assignee jane.doe", issueIds=["DEMO-10"])

# Add a tag
apply_command(command="add tag needs-review", issueIds=["DEMO-5"])

# Chain commands
apply_command(command="State Fixed Priority Normal", issueIds=["DEMO-7"])
```

> **Note:** Use YouTrack command syntax without curly braces for single-word values (`State Fixed`, not `State {Fixed}`). Use curly braces only for multi-word values with spaces.

---

## Coverage compared to the Official JetBrains MCP

> The table below reflects what the official JetBrains YouTrack MCP exposes **as of today**. JetBrains keeps expanding it, so think of this as a snapshot rather than a permanent comparison — capabilities marked as "not yet" may well be available in future releases.

| Capability | Official JetBrains MCP (today) | @promtior/youtrack-mcp-extended |
|---|---|---|
| Search issues | ✅ | ✅ |
| Create / update issues | ✅ | ✅ |
| Delete issues | Not yet | ✅ |
| Change assignee (dedicated tool) | Not yet | ✅ |
| Move issue to project | Not yet | ✅ |
| Get issue comments | ✅ | ✅ |
| Add / edit / delete comments | Not yet | ✅ |
| Comment reactions | Not yet | ✅ |
| Log work | ✅ | ✅ |
| Get / update / delete work items | Not yet | ✅ |
| All work items across instance | Not yet | ✅ |
| Issue links (create / get / delete) | Not yet | ✅ |
| Custom link types (create / update) | Not yet | ✅ |
| Issue attachments (upload / list / delete) | Not yet | ✅ |
| Activity history | Not yet | ✅ |
| VCS changes | Not yet | ✅ |
| Tags (manage on issues) | ✅ | ✅ |
| Tag CRUD (create / update / delete) | Not yet | ✅ |
| Saved queries | Not yet | ✅ |
| Agile boards & sprints | Not yet | ✅ |
| Knowledge Base articles | Not yet | ✅ |
| Article comments & attachments | Not yet | ✅ |
| Create / list projects | Not yet | ✅ |
| Users & groups | Not yet | ✅ |
| apply_command (bulk) | ✅ | ✅ |
| Issue count | Not yet | ✅ |
| **Total tools (today)** | **~19** | **70** |

---

## Known Limitations

### `get_command_suggestions` — may return empty

On some YouTrack Cloud instances, the command suggestions endpoint (`POST /api/commands/assist`) returns an empty response (`HTTP 200, body: {}`) even with a valid request. This appears to be a permissions or plan limitation of the instance, not a bug in the tool. If suggestions are always empty, check that your token has sufficient permissions, or use the YouTrack UI command dialog to explore valid command syntax for your instance.

### Bundled JetBrains workflows can fail issue create / move

Some bundled JetBrains workflows — most notably `@jetbrains/youtrack-workflow-duplicates/flatten-duplicates-structure` — throw runtime exceptions during issue creation and inter-project moves, triggering a server-side rollback. Symptoms:

- `create_issue` against a freshly-created project returns `500 Workflow runtime error` and the issue does **not** persist.
- `move_issue_to_project` returns `500 Workflow runtime error` and the issue stays in the source project.

The MCP tool detects these cases and surfaces a clear error naming the offending workflow rule and rule path. The fix lives on the YouTrack side: disable the workflow on the affected project (Project settings → Workflow) or remove it from your instance, then retry. The tools' happy paths are exercised by the test suite; the failure originates in the workflow runtime, not in the REST call.

### Agile boards — no delete

The YouTrack REST API does not expose an endpoint to delete Agile boards. Boards created via `create_agile_board` must be deleted manually through the YouTrack UI. The same applies to sprints — only `update_sprint` (with `archived: true`) is exposed; permanent deletion is UI-only.

---

## Authentication

Generate a permanent token in YouTrack:

1. Go to your profile → **Account Security** → **Tokens**
2. Click **New token**
3. Give it a name and select the appropriate scopes:
   - `YouTrack` — for issue, comment, tag, and project operations
   - `YouTrack Administration` — for user/group queries, link type creation, and project creation
4. Copy the token — it starts with `perm:`

The token should be passed via the `YOUTRACK_TOKEN` environment variable. Never commit it to source control.

---

## Contributing

Issues and PRs welcome. The package is a thin REST API client — each tool maps directly to one or more YouTrack REST endpoints documented at [JetBrains Developer Portal](https://www.jetbrains.com/help/youtrack/devportal/youtrack-rest-api.html).

When adding a new tool:
- Drop the implementation in `src/tools/<category>/<tool-name>.ts` — the build script auto-discovers it and regenerates `src/server/tools-registry.ts`.
- Accept readable IDs (`DEMO-123`, `DEMO`) — resolve to internal IDs internally if the endpoint requires it.
- Return descriptive errors — propagate the API error message, don't swallow it.
- Add a unit test in `tests/tools/<category>/<tool-name>.test.ts` mocking `@jetbrains/youtrack-scripting-api/http`.
- Test against both YouTrack Cloud and self-hosted if possible.

---

## License

MIT
