// @ts-expect-error - no type declarations available for @jetbrains/youtrack-scripting-api
import * as http from '@jetbrains/youtrack-scripting-api/http';
import { stripYtTypes } from './strip-types';

export interface ApiClientOptions {
  fields?: string;
  top?: number;
  skip?: number;
  [key: string]: string | number | undefined;
}

function getSettings(ctx: any) {
  const baseUrl = ctx.settings && ctx.settings.youtrackBaseUrl;
  const token = ctx.settings && ctx.settings.apiToken;
  if (!baseUrl || !token) {
    throw new Error(
      'YouTrack MCP Extended: Missing settings. Please configure youtrackBaseUrl and apiToken in Administration → Apps → youtrack-extended-tools → Settings.'
    );
  }
  return {
    baseUrl: String(baseUrl).replace(/\/$/, ''),
    token: String(token),
  };
}

function buildQuery(options: ApiClientOptions): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) {
      const apiKey = key === 'top' ? '$top' : key === 'skip' ? '$skip' : key;
      parts.push(`${encodeURIComponent(apiKey)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}

export function apiGet(ctx: any, path: string, options: ApiClientOptions = {}, keepTypes = false) {
  const { baseUrl, token } = getSettings(ctx);
  const conn = new http.Connection(`${baseUrl}/api`);
  conn.addHeader('Authorization', `Bearer ${token}`);
  conn.addHeader('Accept', 'application/json');
  const url = `${path}${buildQuery(options)}`;
  const response = conn.get(url);
  if (!response.isSuccess) {
    throw new Error(`YouTrack API error ${response.code}: ${response.response}`);
  }
  const parsed = JSON.parse(response.response);
  return keepTypes ? parsed : stripYtTypes(parsed);
}

export function apiPost(ctx: any, path: string, body: object, options: ApiClientOptions = {}, keepTypes = false) {
  if (body === undefined || body === null) {
    throw new Error(`apiPost(${path}): body is required (received ${body === null ? 'null' : 'undefined'}).`);
  }
  const { baseUrl, token } = getSettings(ctx);
  const conn = new http.Connection(`${baseUrl}/api`);
  conn.addHeader('Authorization', `Bearer ${token}`);
  conn.addHeader('Accept', 'application/json');
  conn.addHeader('Content-Type', 'application/json');
  const url = `${path}${buildQuery(options)}`;
  const response = conn.post(url, 'application/json', JSON.stringify(body));
  if (!response.isSuccess) {
    throw new Error(`YouTrack API error ${response.code}: ${response.response}`);
  }
  if (!response.response) return null;
  const parsed = JSON.parse(response.response);
  return keepTypes ? parsed : stripYtTypes(parsed);
}

// RFC 6838: type/subtype with optional parameters separated by ';'. We disallow
// parameters to keep the value safe for the curl -F "type=" syntax (which uses
// ';' as a separator and would otherwise let a caller smuggle ;filename=…).
const MIME_TYPE_PATTERN = /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/;

export function apiPostMultipart(ctx: any, path: string, fileName: string, mimeType: string, base64Content: string, options: ApiClientOptions = {}) {
  if (!MIME_TYPE_PATTERN.test(mimeType)) {
    throw new Error(`Invalid mimeType "${mimeType}": expected "type/subtype" with no parameters.`);
  }
  const { baseUrl, token } = getSettings(ctx);
  const conn: any = new http.Connection(`${baseUrl}/api`);
  conn.addHeader('Authorization', `Bearer ${token}`);
  conn.addHeader('Accept', 'application/json');
  if (typeof conn.postMultipart !== 'function') {
    throw new Error('Multipart uploads are not supported in this runtime.');
  }
  const url = `${path}${buildQuery(options)}`;
  const response = conn.postMultipart(url, fileName, mimeType, base64Content);
  if (!response.isSuccess) {
    throw new Error(`YouTrack API error ${response.code}: ${response.response}`);
  }
  return response.response ? JSON.parse(response.response) : null;
}

export function apiDelete(ctx: any, path: string) {
  const { baseUrl, token } = getSettings(ctx);
  const conn = new http.Connection(`${baseUrl}/api`);
  conn.addHeader('Authorization', `Bearer ${token}`);
  conn.addHeader('Accept', 'application/json');
  const response = conn.delete(path);
  if (!response.isSuccess) {
    throw new Error(`YouTrack API error ${response.code}: ${response.response}`);
  }
  return true;
}
