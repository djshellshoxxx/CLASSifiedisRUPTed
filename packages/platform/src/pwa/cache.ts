/**
 * F15.S01.M02 service-worker cache policy as pure functions. The worker asks `resolveCachePolicy` what to
 * do with each request and `isCacheableResponse` whether a response may be stored.
 * Privacy invariant: private API traffic, anything carrying credentials and every non-GET request is
 * `network_only` and never persisted, so a lost or shared device cannot leak cached account data.
 */

export type CacheStrategy = 'network_first' | 'cache_first' | 'stale_while_revalidate' | 'network_only';
export type CacheKind = 'shell' | 'assets' | 'public';

export interface CacheRule {
  readonly id: string;
  /** Exact path, or a prefix ending in `/*`. */
  readonly pattern: string;
  readonly strategy: CacheStrategy;
  readonly cacheKind?: CacheKind;
  readonly maxAgeSeconds?: number;
}

export interface CacheRequest {
  readonly method: string;
  readonly path: string;
  /** True when the request carries Authorization or session credentials. */
  readonly hasCredentials: boolean;
  /** True for top-level document navigations (SPA routes). */
  readonly navigation?: boolean;
}

export interface CacheDecision {
  readonly strategy: CacheStrategy;
  readonly persist: boolean;
  readonly ruleId: string;
  readonly cacheKind?: CacheKind;
  readonly maxAgeSeconds?: number;
  /** Cached document served when a navigation fails offline. */
  readonly offlineFallback?: string;
}

export const SHELL_FALLBACK = '/index.html';

/** First match wins; anything unmatched is network_only (deny by default). */
export const DEFAULT_CACHE_RULES: readonly CacheRule[] = Object.freeze([
  { id: 'shell-root', pattern: '/', strategy: 'network_first', cacheKind: 'shell' },
  { id: 'shell-index', pattern: SHELL_FALLBACK, strategy: 'network_first', cacheKind: 'shell' },
  { id: 'manifest', pattern: '/manifest.webmanifest', strategy: 'stale_while_revalidate', cacheKind: 'shell' },
  { id: 'hashed-assets', pattern: '/assets/*', strategy: 'cache_first', cacheKind: 'assets', maxAgeSeconds: 31_536_000 },
  { id: 'icons', pattern: '/icons/*', strategy: 'cache_first', cacheKind: 'assets', maxAgeSeconds: 2_592_000 },
  { id: 'fonts', pattern: '/fonts/*', strategy: 'cache_first', cacheKind: 'assets', maxAgeSeconds: 31_536_000 },
  { id: 'locales', pattern: '/locales/*', strategy: 'stale_while_revalidate', cacheKind: 'assets' },
  { id: 'public-api', pattern: '/v1/public/*', strategy: 'stale_while_revalidate', cacheKind: 'public', maxAgeSeconds: 300 },
  { id: 'private-api', pattern: '/v1/*', strategy: 'network_only' },
]);

export function matchesPattern(pattern: string, path: string): boolean {
  if (pattern.endsWith('/*')) return path.startsWith(pattern.slice(0, -1));
  return pattern === path;
}

const NETWORK_ONLY = (ruleId: string): CacheDecision => ({ strategy: 'network_only', persist: false, ruleId });

export function resolveCachePolicy(request: CacheRequest, rules: readonly CacheRule[] = DEFAULT_CACHE_RULES): CacheDecision {
  if (request.method.toUpperCase() !== 'GET') return NETWORK_ONLY('non-get');
  if (request.hasCredentials) return NETWORK_ONLY('credentials');
  const path = request.path.split('?')[0] as string;
  const rule = rules.find((r) => matchesPattern(r.pattern, path));
  if (!rule) {
    // Unknown navigations get the app shell when offline; unknown data requests stay uncached.
    return request.navigation ? { strategy: 'network_first', persist: false, ruleId: 'navigation', offlineFallback: SHELL_FALLBACK } : NETWORK_ONLY('default');
  }
  if (rule.strategy === 'network_only') return NETWORK_ONLY(rule.id);
  return {
    strategy: rule.strategy,
    persist: true,
    ruleId: rule.id,
    ...(rule.cacheKind ? { cacheKind: rule.cacheKind } : {}),
    ...(rule.maxAgeSeconds !== undefined ? { maxAgeSeconds: rule.maxAgeSeconds } : {}),
    ...(request.navigation ? { offlineFallback: SHELL_FALLBACK } : {}),
  };
}

export interface CacheableResponse {
  readonly status: number;
  readonly cacheControl?: string;
  readonly vary?: string;
  readonly hasSetCookie: boolean;
  /** Fetch response type; opaque responses hide their status and are never stored. */
  readonly type?: 'basic' | 'cors' | 'opaque' | 'error';
}

export function isCacheableResponse(res: CacheableResponse): boolean {
  if (res.status !== 200 || res.hasSetCookie) return false;
  if (res.type === 'opaque' || res.type === 'error') return false;
  if (res.vary?.trim() === '*') return false;
  const directives = (res.cacheControl ?? '').toLowerCase().split(',').map((d) => d.trim());
  return !directives.some((d) => d === 'no-store' || d === 'private' || d.startsWith('private='));
}

const CACHE_PREFIX = 'classrup-';
const VERSION_RE = /^[A-Za-z0-9._-]{1,32}$/;
export const CACHE_KINDS: readonly CacheKind[] = ['shell', 'assets', 'public'];
/** Static build output: not user data, so it survives logout. */
const STATIC_KINDS: readonly CacheKind[] = ['shell', 'assets'];

export function cacheName(kind: CacheKind, version: string): string {
  if (!VERSION_RE.test(version)) throw new TypeError(`invalid cache version ${version}`);
  return `${CACHE_PREFIX}${kind}-v${version}`;
}

export type PurgeReason = 'activate' | 'logout';

/**
 * Names of caches to delete. Caches not created by this app are never touched.
 * `activate` (new service worker version): drop every ClassRup cache from other versions.
 * `logout`: additionally drop the non-static caches of the current version.
 */
export function cachesToPurge(existing: readonly string[], currentVersion: string, reason: PurgeReason): string[] {
  const keep = new Set((reason === 'logout' ? STATIC_KINDS : CACHE_KINDS).map((k) => cacheName(k, currentVersion)));
  return existing.filter((name) => name.startsWith(CACHE_PREFIX) && !keep.has(name));
}
