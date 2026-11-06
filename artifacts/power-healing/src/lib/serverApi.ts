import { auth } from './firebase';

const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/+$/, '');

export async function serverApi(
  path: string,
  init: RequestInit = {},
  options: { sameOrigin?: boolean; authorization?: string } = {},
): Promise<Response> {
  const token = options.authorization === undefined ? await auth.currentUser?.getIdToken() : undefined;
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.authorization !== undefined) headers.set('Authorization', options.authorization);
  return fetch(`${options.sameOrigin ? '' : API_BASE}${path}`, { ...init, headers });
}

export async function readJson<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof body?.error === 'string' ? body.error : `Request failed (${response.status})`);
  }
  return body as T;
}