/**
 * @fileoverview Development Session Cookie & HMAC Token Management
 * Provides cryptographic HMAC verification and session cookie serialization.
 */

import crypto from 'crypto';
import { DEV_IDENTITIES } from './dev-identities.ts';
import { isDevAuthEnabled, DEV_SESSION_SECRET, DEV_SESSION_COOKIE_NAME } from './dev-auth-config.ts';

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createDevSessionToken(identityKey: string): string {
  if (!isDevAuthEnabled()) {
    throw new Error('Development session creation blocked: development authentication is disabled.');
  }
  if (!DEV_IDENTITIES[identityKey]) {
    throw new Error(`Invalid development identity key: ${identityKey}`);
  }
  const timestamp = Date.now();
  const payload = `${identityKey}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', DEV_SESSION_SECRET).update(payload).digest('hex');
  return `${payload}:${hmac}`;
}

export function verifyDevSessionToken(token: string): string | null {
  if (!isDevAuthEnabled()) {
    return null;
  }
  if (!token || typeof token !== 'string') {
    return null;
  }
  const parts = token.split(':');
  if (parts.length !== 3) {
    return null;
  }
  const [identityKey, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp) || Date.now() - timestamp > SESSION_TTL_MS) {
    return null; // Expired
  }
  if (!DEV_IDENTITIES[identityKey]) {
    return null; // Not allowlisted
  }

  const expectedPayload = `${identityKey}:${timestampStr}`;
  const expectedHmac = crypto.createHmac('sha256', DEV_SESSION_SECRET).update(expectedPayload).digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expectedHmac, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  return identityKey;
}

export function parseCookies(cookieHeader?: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return cookies;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const key = pair.slice(0, idx).trim();
      const val = pair.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

export function serializeDevSessionCookie(token: string, maxAgeSeconds: number = 86400): string {
  const isSecure = typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  return `${DEV_SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${isSecure ? '; Secure' : ''}`;
}

export function clearDevSessionCookie(): string {
  return `${DEV_SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}
