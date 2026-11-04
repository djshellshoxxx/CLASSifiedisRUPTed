// Relay HTTP adapter (node:http) over the command bus: POST /api/v1/cmd/<name>, POST /api/v1/query/<name>,
// GET /healthz, /readyz, /metrics (platform.metrics.read). JSON only, 256 KiB bodies, problem+json errors.
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { Clock } from '../clock/clock.ts';
import { appError, type AppError } from '../errors/app-error.ts';
import { PROBLEM_CONTENT_TYPE, toProblemJson } from '../errors/problem.ts';
import { err, ok, type Result } from '../errors/result.ts';
import { isUuidV7, type IdGen } from '../ids/uuidv7.ts';
import { truncateIp } from '../observability/ip.ts';
import { noopLogger, type Logger } from '../observability/logger.ts';
import { PROMETHEUS_CONTENT_TYPE, type MetricsRegistry } from '../observability/metrics.ts';
import type { ReadinessProbe } from '../observability/readiness.ts';
import type { Bus } from '../bus/bus.ts';
import type { AuthzPort, Session, SessionPort } from '../bus/ports.ts';

export const BODY_LIMIT_BYTES = 256 * 1024;
export const METRICS_CAPABILITY = 'platform.metrics.read';
const API_RE = /^\/api\/v1\/(cmd|query)\/([a-z0-9]+\.[a-z0-9_]+\.[a-z0-9_]+)$/;
const SECURITY_HEADERS: Readonly<Record<string, string>> = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'x-frame-options': 'DENY',
  'content-security-policy': "default-src 'none'; frame-ancestors 'none'",
};

export interface HttpAdapterOptions {
  readonly bus: Bus;
  readonly sessions: SessionPort;
  readonly authz: AuthzPort;
  readonly ids: IdGen;
  readonly clock: Clock;
  readonly metrics?: MetricsRegistry;
  readonly readiness?: ReadinessProbe;
  readonly logger?: Logger;
  readonly bodyLimitBytes?: number;
  /**
   * Client address used for the per-network rate limit; defaults to the socket peer. A relay behind a
   * reverse proxy it trusts returns the forwarded client address here. Only its /24 or /48 reaches the bus.
   */
  readonly clientAddress?: (req: IncomingMessage) => string | undefined;
}

export interface HttpHandler {
  (req: IncomingMessage, res: ServerResponse): void;
  /** While draining, /readyz answers 503 so load balancers stop routing (graceful shutdown). */
  setDraining(draining: boolean): void;
  inFlight(): number;
}

interface Reply {
  readonly status: number;
  readonly body: string;
  readonly type: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly code: string;
}

const json = (status: number, value: unknown, headers?: Record<string, string>): Reply => ({ status, body: JSON.stringify(value ?? null), type: 'application/json; charset=utf-8', code: 'OK', ...(headers ? { headers } : {}) });

function problem(e: AppError, correlationId: string, headers?: Record<string, string>): Reply {
  const extra: Record<string, string> = { ...headers };
  if (e.retryAfterMs !== undefined) extra['retry-after'] = String(Math.ceil(e.retryAfterMs / 1000));
  return { status: e.status, body: JSON.stringify(toProblemJson(e, correlationId)), type: PROBLEM_CONTENT_TYPE, code: e.code, headers: extra };
}

function readBody(req: IncomingMessage, limit: number): Promise<Result<string, AppError>> {
  const declared = Number(req.headers['content-length'] ?? '0');
  if (declared > limit) {
    req.resume();
    return Promise.resolve(err(appError('PAYLOAD_TOO_LARGE', { params: { limitBytes: limit } })));
  }
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;
    const settle = (r: Result<string, AppError>): void => {
      if (!settled) resolve(r);
      settled = true;
    };
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) settle(err(appError('PAYLOAD_TOO_LARGE', { params: { limitBytes: limit } })));
      else if (!settled) chunks.push(c);
    });
    req.on('end', () => settle(ok(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', () => settle(err(appError('VALIDATION_FAILED', { fields: [{ path: 'body', code: 'INCOMPLETE' }] }))));
  });
}

function bearer(req: IncomingMessage): Result<string | undefined, AppError> {
  const h = req.headers.authorization;
  if (h === undefined) return ok(undefined);
  const m = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(h);
  return m?.[1] ? ok(m[1]) : err(appError('UNAUTHENTICATED'));
}

function isJson(req: IncomingMessage): boolean {
  const ct = (req.headers['content-type'] ?? '').toLowerCase();
  return /^application\/json\s*(;\s*charset=utf-8\s*)?$/.test(ct);
}

function parseIfMatch(v: string | undefined): Result<number | undefined, AppError> {
  if (v === undefined) return ok(undefined);
  const m = /^"?([1-9][0-9]{0,15})"?$/.exec(v.trim());
  return m?.[1] ? ok(Number(m[1])) : err(appError('VALIDATION_FAILED', { fields: [{ path: 'If-Match', code: 'INVALID_REVISION' }] }));
}

function header(req: IncomingMessage, name: string): string | undefined {
  const v = req.headers[name];
  return Array.isArray(v) ? v[0] : v;
}

export function createHttpHandler(o: HttpAdapterOptions): HttpHandler {
  const log = o.logger ?? noopLogger;
  const limit = o.bodyLimitBytes ?? BODY_LIMIT_BYTES;
  const requests = o.metrics?.counter({ name: 'classrup_http_requests_total', help: 'HTTP requests by outcome and code.', labels: ['outcome', 'code'] });
  let draining = false;
  let inFlight = 0;

  function network(req: IncomingMessage): string | undefined {
    const address = o.clientAddress ? o.clientAddress(req) : req.socket.remoteAddress;
    return address === undefined ? undefined : truncateIp(address);
  }

  async function session(req: IncomingMessage): Promise<Result<Session, AppError>> {
    const token = bearer(req);
    return token.ok ? o.sessions.resolve(token.value) : token;
  }

  async function api(req: IncomingMessage, kind: 'cmd' | 'query', name: string, correlationId: string): Promise<Reply> {
    if (req.method !== 'POST') return problem(appError('PLATFORM_BUS_METHOD_NOT_ALLOWED'), correlationId, { allow: 'POST' });
    if (!isJson(req)) return problem(appError('PLATFORM_BUS_UNSUPPORTED_MEDIA_TYPE'), correlationId);
    const body = await readBody(req, limit);
    if (!body.ok) return problem(body.error, correlationId, { connection: 'close' });
    let input: unknown;
    try {
      input = JSON.parse(body.value) as unknown;
    } catch {
      return problem(appError('VALIDATION_FAILED', { fields: [{ path: '', code: 'INVALID_JSON' }] }), correlationId);
    }
    const s = await session(req);
    if (!s.ok) return problem(s.error, correlationId);
    const net = network(req);
    const ctx = { actor: s.value.actor, tenantId: s.value.tenantId, correlationId, origin: 'remote' as const, ...(net === undefined ? {} : { network: net }) };
    if (kind === 'query') {
      const r = await o.bus.query(ctx, name, input);
      return r.ok ? json(200, r.value.value) : problem(r.error, correlationId);
    }
    const ifMatch = parseIfMatch(header(req, 'if-match'));
    if (!ifMatch.ok) return problem(ifMatch.error, correlationId);
    const key = header(req, 'idempotency-key');
    const r = await o.bus.dispatch(ctx, name, input, { ...(key === undefined ? {} : { idempotencyKey: key }), ...(ifMatch.value === undefined ? {} : { expectedRevision: ifMatch.value }) });
    if (!r.ok) return problem(r.error, correlationId);
    return json(r.value.status, r.value.value, r.value.replayed ? { 'idempotent-replay': 'true' } : undefined);
  }

  async function metrics(req: IncomingMessage, correlationId: string): Promise<Reply> {
    if (req.method !== 'GET') return problem(appError('PLATFORM_BUS_METHOD_NOT_ALLOWED'), correlationId, { allow: 'GET' });
    const s = await session(req);
    if (!s.ok) return problem(s.error, correlationId);
    if (s.value.actor.kind === 'anonymous') return problem(appError('UNAUTHENTICATED'), correlationId);
    const d = await o.authz.authorize(s.value.actor, METRICS_CAPABILITY, undefined, { tenantId: s.value.tenantId, operation: 'GET /metrics', kind: 'endpoint', origin: 'remote', now: o.clock.now() });
    if (!d.allow) return problem(appError('NOT_FOUND'), correlationId);
    return { status: 200, body: o.metrics?.render() ?? '', type: PROMETHEUS_CONTENT_TYPE, code: 'OK' };
  }

  async function ready(): Promise<Reply> {
    if (draining) return json(503, { status: 'unready', checks: { draining: true } });
    if (!o.readiness) return json(200, { status: 'ready', checks: {} });
    const r = await o.readiness.check();
    return json(r.ready ? 200 : 503, { status: r.ready ? 'ready' : 'unready', checks: r.checks, lagMs: r.lagMs });
  }

  async function route(req: IncomingMessage, correlationId: string): Promise<Reply> {
    const path = new URL(req.url ?? '/', 'http://relay.invalid').pathname;
    const m = API_RE.exec(path);
    if (m?.[1] && m[2]) return api(req, m[1] as 'cmd' | 'query', m[2], correlationId);
    if (path === '/healthz' && req.method === 'GET') return json(200, { status: 'ok' });
    if (path === '/readyz' && req.method === 'GET') return ready();
    if (path === '/metrics') return metrics(req, correlationId);
    return problem(appError('NOT_FOUND'), correlationId);
  }

  function send(res: ServerResponse, reply: Reply, correlationId: string): void {
    res.statusCode = reply.status;
    for (const [k, v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k, v);
    res.setHeader('content-type', reply.type);
    res.setHeader('x-correlation-id', correlationId);
    for (const [k, v] of Object.entries(reply.headers ?? {})) res.setHeader(k, v);
    res.end(reply.body);
  }

  const handler = (req: IncomingMessage, res: ServerResponse): void => {
    const started = globalThis.performance.now();
    const incoming = header(req, 'x-correlation-id');
    const correlationId = incoming !== undefined && isUuidV7(incoming) ? incoming : o.ids.next();
    inFlight += 1;
    route(req, correlationId)
      .catch((e: unknown) => {
        log.error('http.unhandled', { correlationId, error: e });
        return problem(appError('INTERNAL'), correlationId);
      })
      .then((reply) => {
        send(res, reply, correlationId);
        const outcome = reply.status >= 500 ? 'failed' : reply.status >= 400 ? 'rejected' : 'ok';
        requests?.inc({ outcome, code: reply.code });
        log.info('http.request', { correlationId, code: reply.code, durationMs: Math.round(globalThis.performance.now() - started), method: req.method, status: reply.status, ip: req.socket.remoteAddress });
      })
      .finally(() => {
        inFlight -= 1;
      });
  };
  return Object.assign(handler, { setDraining: (d: boolean) => void (draining = d), inFlight: () => inFlight });
}

export interface RunningServer {
  readonly server: Server;
  readonly port: number;
  /** Stops accepting, marks unready, waits for in-flight requests up to graceMs, then closes sockets. */
  close(graceMs?: number): Promise<void>;
}

export function startHttpServer(handler: HttpHandler, opts: { readonly port?: number; readonly host?: string } = {}): Promise<RunningServer> {
  const server = createServer({ requestTimeout: 30_000, headersTimeout: 10_000 }, handler);
  server.keepAliveTimeout = 5_000;
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(opts.port ?? 0, opts.host ?? '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({
        server,
        port,
        close: async (graceMs = 10_000) => {
          handler.setDraining(true);
          const closed = new Promise<void>((r) => server.close(() => r()));
          server.closeIdleConnections();
          const deadline = Date.now() + graceMs;
          while (handler.inFlight() > 0 && Date.now() < deadline) await new Promise((r) => setTimeout(r, 10));
          server.closeAllConnections();
          await closed;
        },
      });
    });
  });
}
