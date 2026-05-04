/**
 * Node.js-compatible shim for @jetbrains/youtrack-scripting-api/http
 *
 * Implements the same Connection interface used by api-client.ts but using
 * synchronous HTTP calls via Node.js child_process + curl.
 * This is only used when bundling the npm MCP server — the YouTrack App Package
 * continues to use the real @jetbrains/youtrack-scripting-api/http at runtime.
 */
import { execFileSync } from 'child_process';
import { writeFileSync, unlinkSync, mkdtempSync, rmdirSync } from 'fs';
import { tmpdir } from 'os';
import { basename, join } from 'path';

interface Header {
  name: string;
  value: string;
}

interface SyncResponse {
  response: string;
  code: number;
  isSuccess: boolean;
  exception: Error | null;
  headers: Header[];
}

function buildResponse(body: string, statusCode: number): SyncResponse {
  return {
    response: body,
    code: statusCode,
    isSuccess: statusCode >= 200 && statusCode < 400,
    exception: null,
    headers: [],
  };
}

class Connection {
  private baseUrl: string;
  private headers: Header[] = [];

  constructor(url: string) {
    this.baseUrl = url ? url.replace(/\/$/, '') : '';
  }

  addHeader(nameOrObj: string | Header, value?: string): this {
    if (typeof nameOrObj === 'string') {
      this.headers.push({ name: nameOrObj, value: value || '' });
    } else {
      this.headers.push(nameOrObj);
    }
    return this;
  }

  private resolveUrl(uri: string): string {
    if (!uri) return this.baseUrl;
    if (uri.startsWith('http://') || uri.startsWith('https://')) return uri;
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const path = uri.startsWith('/') ? uri : `/${uri}`;
    return `${base}${path}`;
  }

  get(uri: string): SyncResponse {
    return this.doRequest('GET', uri, undefined);
  }

  post(uri: string, _contentType: string, body: string): SyncResponse {
    return this.doRequest('POST', uri, body);
  }

  postMultipart(uri: string, fileName: string, mimeType: string, base64Content: string): SyncResponse {
    const url = this.resolveUrl(uri);
    // Strip path separators to prevent traversal — fileName comes from user input
    const safeName = basename(fileName) || 'upload';
    const dir = mkdtempSync(join(tmpdir(), 'yt-upload-'));
    const filePath = join(dir, safeName);
    try {
      writeFileSync(filePath, Buffer.from(base64Content, 'base64'));

      const args: string[] = ['-s', '-w', '\n__STATUS__%{http_code}__STATUS__'];
      for (const h of this.headers) {
        if (h.name.toLowerCase() === 'content-type') continue;
        args.push('-H', `${h.name}: ${h.value}`);
      }
      args.push('-X', 'POST');
      args.push('-F', `file=@${filePath};type=${mimeType};filename=${safeName}`);
      args.push(url);

      const raw = execFileSync('curl', args, {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        timeout: 60000,
      });
      const statusMatch = raw.match(/\n__STATUS__(\d+)__STATUS__$/);
      const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
      const responseBody = raw.replace(/\n__STATUS__\d+__STATUS__$/, '');
      return buildResponse(responseBody, statusCode);
    } catch (err: any) {
      return { response: '', code: 0, isSuccess: false, exception: err, headers: [] };
    } finally {
      // Best-effort cleanup; ignore errors (file may already be gone).
      try { unlinkSync(filePath); } catch { /* noop */ }
      try { rmdirSync(dir); } catch { /* noop */ }
    }
  }

  delete(uri: string): SyncResponse {
    return this.doRequest('DELETE', uri, undefined);
  }

  private doRequest(method: string, uri: string, body: string | undefined): SyncResponse {
    const url = this.resolveUrl(uri);
    const args: string[] = ['-s'];

    // Append status code after the body using a unique sentinel
    args.push('-w', '\n__STATUS__%{http_code}__STATUS__');

    for (const h of this.headers) {
      args.push('-H', `${h.name}: ${h.value}`);
    }

    if (method === 'POST') {
      args.push('-X', 'POST');
      if (body !== undefined) {
        args.push('-d', body);
      }
    } else if (method === 'DELETE') {
      args.push('-X', 'DELETE');
    }
    // GET is the curl default

    args.push(url);

    try {
      const raw = execFileSync('curl', args, {
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024,
        timeout: 30000,
      });

      const statusMatch = raw.match(/\n__STATUS__(\d+)__STATUS__$/);
      const statusCode = statusMatch ? parseInt(statusMatch[1], 10) : 0;
      const responseBody = raw.replace(/\n__STATUS__\d+__STATUS__$/, '');

      return buildResponse(responseBody, statusCode);
    } catch (err: any) {
      return {
        response: '',
        code: 0,
        isSuccess: false,
        exception: err,
        headers: [],
      };
    }
  }
}

exports.Connection = Connection;
