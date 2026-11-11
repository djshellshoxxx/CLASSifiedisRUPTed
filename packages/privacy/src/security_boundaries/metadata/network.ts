// Pure helpers that minimize network and time metadata: IP truncation, salted keys, public time, user agent.
import { appError, err, isIP, ok, sha256Hex, truncateIp as kernelTruncateIp, type AppError, type Result } from '@classrup/kernel';

export interface IpNetwork {
  readonly family: 4 | 6;
  readonly prefix: 24 | 48;
  /** `203.0.113.0/24` or `2001:db8:abcd::/48`. */
  readonly networkString: string;
}
/** RFC 3339 UTC millisecond timestamp floored to the hour. */
export type PublicTimestamp = string;
export interface UaFamily {
  readonly family: 'chrome' | 'edge' | 'firefox' | 'safari' | 'opera' | 'other';
  readonly major: number;
}

const invalid = (field: string): AppError => appError('VALIDATION_FAILED', { fields: [{ path: field, code: 'INVALID' }] });

/** Returns the /24 (IPv4, also IPv4-mapped IPv6) or /48 (IPv6) network; the raw address is never part of the result. */
export function truncateIp(ip: string): Result<IpNetwork, AppError> {
  if (typeof ip !== 'string' || ip.length > 64 || !isIP(ip)) return err(invalid('ip'));
  const net = kernelTruncateIp(ip);
  if (net === undefined) return err(invalid('ip'));
  return ok(net.endsWith('/24') ? { family: 4, prefix: 24, networkString: net } : { family: 6, prefix: 48, networkString: net });
}

const SALT_MIN = 16;
const SALT_MAX = 256;

/** Hex key for rate limiting derived from the truncated network and the caller's daily salt; the same /24 gives the same key within one salt. */
export async function rateLimitKey(ip: string, dailySalt: string): Promise<Result<string, AppError>> {
  if (typeof dailySalt !== 'string' || dailySalt.length < SALT_MIN || dailySalt.length > SALT_MAX) return err(invalid('dailySalt'));
  const net = truncateIp(ip);
  if (!net.ok) return net;
  return ok(await sha256Hex(`classrup.privacy.ratelimit/v1\u0000${dailySalt}\u0000${net.value.networkString}`));
}

const TS_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?Z$/;

function daysIn(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Floors a valid RFC 3339 UTC timestamp (1970 to 2100) to the hour; owner views keep the exact value. */
export function publicTime(iso: string): Result<PublicTimestamp, AppError> {
  const m = typeof iso === 'string' && iso.length <= 40 ? TS_RE.exec(iso) : null;
  if (!m) return err(invalid('ts'));
  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number) as [number, number, number, number, number, number];
  if (year < 1970 || year > 2100 || month < 1 || month > 12 || day < 1 || day > daysIn(year, month) || hour > 23 || minute > 59 || second > 59) return err(invalid('ts'));
  return ok(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:00:00.000Z`);
}

/** Ordering inside one public hour uses the record ID, never the exact time. */
export function orderKey(publicTs: PublicTimestamp, recordId: string): string {
  return `${publicTs}|${recordId}`;
}

const UA_RULES: readonly (readonly [UaFamily['family'], RegExp])[] = [
  ['edge', /\b(?:Edg|EdgA|EdgiOS|Edge)\/(\d{1,4})/],
  ['opera', /\b(?:OPR|Opera)\/(\d{1,4})/],
  ['firefox', /\b(?:Firefox|FxiOS)\/(\d{1,4})/],
  ['chrome', /\b(?:Chrome|CriOS|Chromium)\/(\d{1,4})/],
  ['safari', /\bVersion\/(\d{1,4})[^]*\bSafari\//],
];

/** Reduces a user agent to browser family and major version; device, OS and build details are dropped. */
export function userAgentFamily(ua: string): Result<UaFamily, AppError> {
  if (typeof ua !== 'string' || ua.length > 512) return err(invalid('ua'));
  for (const [family, re] of UA_RULES) {
    const m = re.exec(ua);
    if (m) return ok({ family, major: Number(m[1]) });
  }
  return ok({ family: 'other', major: 0 });
}

export interface OutboundLinkPolicy {
  readonly headers: Readonly<Record<string, string>>;
  readonly rel: string;
  readonly referrerPolicy: 'no-referrer';
  readonly thirdPartyRequests: false;
  readonly analyticsCookies: false;
}

/** Standard policy for outbound links and responses: nothing is sent to third parties. */
export function outboundLinkPolicy(): OutboundLinkPolicy {
  return { headers: { 'Referrer-Policy': 'no-referrer' }, rel: 'noopener noreferrer', referrerPolicy: 'no-referrer', thirdPartyRequests: false, analyticsCookies: false };
}
