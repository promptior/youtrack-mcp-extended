import { apiPostMultipart } from '../../lib/api-client';

exports.aiTool = {
  name: 'upload_issue_attachment',
  description: 'Upload a file attachment to an issue. The file content must be provided as a base64-encoded string.',
  inputSchema: {
    type: 'object',
    properties: {
      issueId: { type: 'string', description: 'Issue ID (e.g. "DEMO-123")' },
      fileName: { type: 'string', description: 'Name of the file including extension (e.g. "screenshot.png")' },
      content: { type: 'string', description: 'File content encoded as base64 (max 10 MB before encoding)' },
      mimeType: { type: 'string', description: 'MIME type of the file (e.g. "image/png", "application/pdf")' },
    },
    required: ['issueId', 'fileName', 'content', 'mimeType'],
  },
  annotations: {
    title: 'Upload issue attachment',
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
    returnDirect: false,
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      url: { type: 'string' },
      mimeType: { type: 'string' },
      size: { type: 'number' },
    },
  },
  execute: (ctx: any) => {
    try {
      if (!ctx.issueId) throw new Error('issueId is required');
      if (!ctx.fileName) throw new Error('fileName is required');
      if (!ctx.content) throw new Error('content is required');
      if (!ctx.mimeType) throw new Error('mimeType is required');

      // ~10 MB file ≈ ~13.3 MB in base64
      const MAX_BASE64_LENGTH = 14 * 1024 * 1024;
      if (ctx.content.length > MAX_BASE64_LENGTH) {
        throw new Error('File too large: content exceeds the 10 MB limit');
      }

      // YouTrack's REST API requires multipart/form-data for attachments;
      // posting JSON with base64Content yields a 0-byte placeholder.
      const result = apiPostMultipart(
        ctx,
        `/issues/${ctx.issueId}/attachments`,
        ctx.fileName,
        ctx.mimeType,
        ctx.content,
        { fields: 'id,name,url,mimeType,size' }
      );
      const first = Array.isArray(result) ? result[0] : result;

      return {
        id: first?.id,
        name: first?.name,
        url: first?.url,
        mimeType: first?.mimeType,
        size: first?.size,
      };
    } catch (e: any) {
      throw new Error(`ext_upload_issue_attachment failed: ${e.message}`);
    }
  },
};
