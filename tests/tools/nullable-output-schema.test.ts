const searchIssues = require('../../src/tools/issues/search-issues');
const getIssue = require('../../src/tools/issues/get-issue');
const getIssueCount = require('../../src/tools/issues/get-issue-count');
const findProjects = require('../../src/tools/projects/find-projects');
const getProject = require('../../src/tools/projects/get-project');
const createSavedQuery = require('../../src/tools/saved-queries/create-saved-query');
const updateSavedQuery = require('../../src/tools/saved-queries/update-saved-query');

function expectSchemaTypeToAllow(schema: any, primitiveType: string) {
  const declaredTypes = Array.isArray(schema.type) ? schema.type : [schema.type];

  expect(declaredTypes).toEqual(expect.arrayContaining([primitiveType, 'null']));
}

describe('nullable YouTrack fields in output schemas', () => {
  it('allows unresolved issues to return resolved=null in issue tools', () => {
    const searchIssuesResolvedSchema =
      searchIssues.aiTool.outputSchema.properties.issues.items.properties.resolved;
    const getIssueResolvedSchema =
      getIssue.aiTool.outputSchema.properties.resolved;

    expectSchemaTypeToAllow(searchIssuesResolvedSchema, 'number');
    expectSchemaTypeToAllow(getIssueResolvedSchema, 'number');
  });

  it('allows projects without descriptions in find_projects and get_project', () => {
    const findProjectsDescriptionSchema =
      findProjects.aiTool.outputSchema.properties.projects.items.properties.description;
    const getProjectDescriptionSchema =
      getProject.aiTool.outputSchema.properties.description;

    expectSchemaTypeToAllow(findProjectsDescriptionSchema, 'string');
    expectSchemaTypeToAllow(getProjectDescriptionSchema, 'string');
  });
});

describe('YouTrack query syntax descriptions', () => {
  const queryTools = [
    searchIssues,
    getIssueCount,
    createSavedQuery,
    updateSavedQuery,
  ];

  it('documents curly braces for multi-word project names', () => {
    for (const tool of queryTools) {
      const description = tool.aiTool.inputSchema.properties.query.description;

      expect(description).toContain('project: {Project With Spaces}');
      expect(description).toMatch(/curly braces/i);
    }
  });

  it('documents shortNames and invalid project query forms', () => {
    for (const tool of queryTools) {
      const description = tool.aiTool.inputSchema.properties.query.description;

      expect(description).toContain('project: PROJ');
      expect(description).toContain('project: "Project With Spaces"');
      expect(description).toContain('project: 0-119');
      expect(description).toMatch(/internal project IDs/i);
    }
  });
});

export {};
