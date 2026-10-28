/**
 * F15.S02.M02 API: uniform RPC surface. Every feature operation is mounted at
 * `POST /v1/ops/<name>`; the JSON body is the operation input. Authentication is a bearer
 * session token resolved by the identity package. Errors map DomainError categories to HTTP.
 */
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { Actor, ErrorBody, Logger, Metrics, Operation, RateLimitPort } from '@classrup/kernel';
import { ANONYMOUS, DomainError, isDomainError, validationError } from '@classrup/kernel';
import { randomToken } from '@classrup/security';

export interface HttpAppOptions {
  readonly operations: readonly Operation[];
  /** Resolve a bearer token to an actor, or undefined when invalid/expired. */
  readonly authenticate: (token: string) => Actor | undefined;
  readonly defaultTenantId: string;
  readonly allowedOrigins: readonly string[];
  readonly logger: Logger;
  readonly metrics: Metrics;
  /** Per-client request budget (keyed by truncated IP or account id). */
  readonly rateLimit?: RateLimitPort;
  readonly clientKey?: (c: { req: { header(name: string): string | undefined } }) => string;
  readonly health?: () => { status: 'ok' | 'degraded' | 'down'; checks: Record<string, string> };
  readonly metricsText?: () => string;
  readonly maxBodyBytes?: number;
}

const IDEM_RE = /^[A-Za-z0-9_\-:.]{8,128}$/;
const CORRELATION_RE = /^[A-Za-z0-9_\-:.]{8,128}$/;

/** JSON.stringify that never throws on bigint (defence in depth: DTOs should not contain bigint). */
export const safeJson = (value: unknown): string => JSON.stringify(value, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v));

const INTERNAL: ErrorBody = { code: 'INTERNAL.ERROR', category: 'internal', message: 'internal error', retryable: false, details: {} };

export function createHttpApp(opts: HttpAppOptions): Hono {
  const ops = new Map(opts.operations.map((o) => [o.name, o]));
  const app = new Hono();

  app.use('*', secureHeaders({ contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] }, referrerPolicy: 'no-referrer' }));
  app.use(
    '/v1/*',
    cors({
      origin: (origin) => (opts.allowedOrigins.includes(origin) ? origin : null),
      allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Correlation-Id'],
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      maxAge: 600,
    }),
  );
  app.use('/v1/ops/*', bodyLimit({ maxSize: opts.maxBodyBytes ?? 256 * 1024, onError: (c) => c.json({ ok: false, error: { ...INTERNAL, code: 'HTTP.PAYLOAD_TOO_LARGE', category: 'validation', message: 'payload too large' } }, 413) }));

  app.get('/v1/health', (c) => {
    const h = opts.health?.() ?? { status: 'ok' as const, checks: {} };
    return c.json(h, h.status === 'down' ? 503 : 200);
  });

  app.get('/v1/ops', (c) =>
    c.json({ ok: true, data: opts.operations.map((o) => ({ name: o.name, kind: o.kind, flag: o.flag, summary: o.summary, public: o.public === true })) }),
  );

  if (opts.metricsText) {
    const render = opts.metricsText;
    app.get('/metrics', (c) => c.text(render(), 200, { 'content-type': 'text/plain; version=0.0.4' }));
  }

  app.post('/v1/ops/:name', async (c) => {
    const started = Date.now();
    const name = c.req.param('name');
    const correlationHeader = c.req.header('x-correlation-id');
    const correlationId = correlationHeader && CORRELATION_RE.test(correlationHeader) ? correlationHeader : `cor_${randomToken(12)}`;
    const log = opts.logger.child({ correlationId, op: name });
    try {
      const op = ops.get(name);
      if (!op) throw new DomainError('not_found', 'HTTP.UNKNOWN_OPERATION', 'unknown operation', { name });

      const actor = resolveActor(c.req.header('authorization'), opts);
      if (actor.kind === 'anonymous' && !op.public) throw new DomainError('unauthenticated', 'AUTH.REQUIRED', 'authentication required');
      opts.rateLimit?.consume(actor.kind === 'anonymous' ? `http:${opts.clientKey?.(c) ?? 'anon'}` : `http:${actor.id}`);

      const idem = c.req.header('idempotency-key');
      if (idem !== undefined && !IDEM_RE.test(idem)) throw validationError('HTTP.IDEMPOTENCY_KEY_INVALID', 'invalid Idempotency-Key');
      if (!(c.req.header('content-type') ?? '').toLowerCase().startsWith('application/json')) {
        throw validationError('HTTP.UNSUPPORTED_MEDIA_TYPE', 'content-type must be application/json');
      }
      const text = await c.req.text();
      let input: unknown;
      try {
        input = text.length === 0 ? {} : JSON.parse(text);
      } catch {
        throw validationError('HTTP.INVALID_JSON', 'body is not valid JSON');
      }
      const data = op.handler({ actor, correlationId, ...(idem && op.kind === 'command' ? { idempotencyKey: idem } : {}) }, input);
      opts.metrics.increment('http.requests', 1, { op: name, status: '200' });
      return c.body(safeJson({ ok: true, data: data ?? null }), 200, { 'content-type': 'application/json; charset=utf-8', 'x-correlation-id': correlationId });
    } catch (e) {
      const { status, body } = toErrorResponse(e);
      if (status >= 500) log.log('error', 'operation failed', { error: e instanceof Error ? e : String(e) });
      opts.metrics.increment('http.requests', 1, { op: name, status: String(status) });
      return c.body(safeJson({ ok: false, error: body }), status as 400, { 'content-type': 'application/json; charset=utf-8', 'x-correlation-id': correlationId });
    } finally {
      opts.metrics.observe('http.duration_ms', Date.now() - started, { op: name });
    }
  });

  app.notFound((c) => c.json({ ok: false, error: { ...INTERNAL, code: 'HTTP.NOT_FOUND', category: 'not_found', message: 'not found' } }, 404));
  return app;
}

function resolveActor(authorization: string | undefined, opts: HttpAppOptions): Actor {
  if (!authorization) return ANONYMOUS(opts.defaultTenantId);
  const m = /^Bearer ([A-Za-z0-9_-]{20,200})$/.exec(authorization);
  if (!m) throw new DomainError('unauthenticated', 'AUTH.MALFORMED', 'malformed authorization header');
  const actor = opts.authenticate(m[1] as string);
  if (!actor) throw new DomainError('unauthenticated', 'AUTH.INVALID_SESSION', 'session invalid or expired');
  return actor;
}

export function toErrorResponse(e: unknown): { status: number; body: ErrorBody } {
  if (isDomainError(e)) {
    // Internal errors never expose their message; programming errors may contain internals.
    if (e.category === 'internal') return { status: 500, body: INTERNAL };
    return { status: e.httpStatus, body: e.toJSON() };
  }
  return { status: 500, body: INTERNAL };
}
