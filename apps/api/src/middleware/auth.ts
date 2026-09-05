import { Context, Next } from 'hono';
import type { Env, SessionPayload } from '../types';
import { unauthorizedResponse } from '../lib/response';

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function authMiddleware(c: Context<{ Bindings: Env }>, next: Next) {
  const cookieHeader = c.req.header('Cookie');
  const token = parseCookie(cookieHeader, 'session_token');

  if (!token) {
    return c.json(unauthorizedResponse(), 401);
  }

  const authDoId = c.env.AUTH_DO.idFromName('global');
  const authDo = c.env.AUTH_DO.get(authDoId);

  const session = await authDo.validateSession(token);
  if (!session) {
    return c.json(unauthorizedResponse('Invalid or expired session'), 401);
  }

  c.set('session', session);
  await next();
}

export function getSession(c: Context): SessionPayload {
  return c.get('session') as SessionPayload;
}
