# Contributing

Thank you for your interest in contributing to **@promtior/youtrack-mcp-extended**!

## Getting Started

1. Fork and clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a feature branch from `main` (the long-lived trunk):
   ```bash
   git checkout -b feature/my-feature main
   ```

## Adding a New Tool

Each tool lives in its own file under `src/tools/<domain>/`. Follow the existing pattern:

1. Create a new file exporting an `aiTool` object with `name`, `description`, `inputSchema`, and `execute`.
2. Run the build to regenerate the tools registry:
   ```bash
   node scripts/build.js
   ```
3. Add tests in `tests/` mirroring the tool path.

## Code Style

- Use TypeScript with ES module imports (`import`, not `require`).
- Keep tool files focused — one tool per file.
- Follow existing naming conventions (`kebab-case` for files, `snake_case` for tool names).

## Testing

Run the test suite before submitting:

```bash
npm test
```

## Pull Requests

- Keep PRs focused on a single domain or concern.
- Write a clear title and description.
- Ensure the build passes (`node scripts/build.js`) and tests are green.
- Request a review from a maintainer.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
