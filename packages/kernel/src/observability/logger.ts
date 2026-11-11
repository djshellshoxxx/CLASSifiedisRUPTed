// Structured JSON-lines logger with redaction (CTR-OBS-001 OBS-1). Sinks are ports; the vault uses a
// bounded in-memory ring buffer and sends nothing off-device (OBS-7).
import type { Clock } from '../clock/clock.ts';
import { redact } from './redact.ts';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogFields = Readonly<Record<string, unknown>>;
export type LogSink = (line: string) => void;

export interface Logger {
  debug(msg: string, fields?: LogFields): void;
  info(msg: string, fields?: LogFields): void;
  warn(msg: string, fields?: LogFields): void;
  error(msg: string, fields?: LogFields): void;
  child(bindings: LogFields): Logger;
  /** Lines lost because the sink threw. */
  dropped(): number;
}

const LEVELS: Readonly<Record<LogLevel, number>> = { debug: 10, info: 20, warn: 30, error: 40 };
const HEAD = ['correlationId', 'module', 'code', 'durationMs'] as const;

// Diagnostic messages are stable event identifiers, never user-provided free text.
// Invalid/freeform messages are replaced before they can reach any sink.
const EVENT_ID = /^[A-Za-z][A-Za-z0-9]*(?:[._-][A-Za-z][A-Za-z0-9]*)*$/;
const ERROR_CODE = /^[A-Z][A-Z0-9_]{0,63}$/;

/** Strip Error messages, stacks and causes at every nesting depth before generic field redaction. */
function withoutErrorDetails(value: unknown, seen = new WeakSet<object>(), depth = 0): unknown {
  if (value instanceof Error) {
    const code = (value as Error & { code?: unknown }).code;
    return typeof code === 'string' && ERROR_CODE.test(code)
      ? { name: 'Error', code }
      : { name: 'Error' };
  }
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;
  if (seen.has(value)) return '[circular]';
  if (depth > 8) return '[depth]';
  seen.add(value);
  if (Array.isArray(value)) return value.map((item) => withoutErrorDetails(item, seen, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    // Plain-object wrappers sometimes carry raw Error text without an Error prototype.
    out[key] = key === 'message' || key === 'stack'
      ? '[redacted]'
      : withoutErrorDetails(item, seen, depth + 1);
  }
  return out;
}

export interface LoggerOptions {
  readonly sink: LogSink;
  readonly clock: Clock;
  readonly level?: LogLevel;
  readonly bindings?: LogFields;
}

function format(clock: Clock, level: LogLevel, msg: string, fields: LogFields): string {
  const safe = (redact(withoutErrorDetails(fields)) ?? {}) as Record<string, unknown>;
  const line: Record<string, unknown> = { ts: clock.iso(), level, msg: EVENT_ID.test(msg) ? msg : '[redacted]' };
  for (const k of HEAD) if (safe[k] !== undefined) line[k] = safe[k];
  for (const [k, v] of Object.entries(safe)) if (!(k in line) && v !== undefined) line[k] = v;
  return JSON.stringify(line);
}

export function createLogger(opts: LoggerOptions): Logger {
  const min = LEVELS[opts.level ?? 'info'];
  if (min === undefined) throw new Error(`invalid log level ${String(opts.level)}`);
  const counter = { dropped: 0 };
  const make = (bindings: LogFields): Logger => {
    const write = (level: LogLevel, msg: string, fields?: LogFields): void => {
      if (LEVELS[level] < min) return;
      try {
        opts.sink(format(opts.clock, level, msg, { ...bindings, ...fields }));
      } catch {
        counter.dropped += 1;
      }
    };
    return {
      debug: (m, f) => write('debug', m, f),
      info: (m, f) => write('info', m, f),
      warn: (m, f) => write('warn', m, f),
      error: (m, f) => write('error', m, f),
      child: (b) => make({ ...bindings, ...b }),
      dropped: () => counter.dropped,
    };
  };
  return make(opts.bindings ?? {});
}

export const noopLogger: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
  child: () => noopLogger,
  dropped: () => 0,
};

export interface RingBufferSink {
  readonly sink: LogSink;
  lines(): string[];
  records(): Record<string, unknown>[];
  /** JSON Lines export of the already-redacted buffer (user-initiated diagnostics export). */
  exportJsonl(): string;
  clear(): void;
}

/** Bounded in-memory sink for vault diagnostics and tests; oldest lines are evicted first. */
export function createRingBufferSink(capacity = 1000): RingBufferSink {
  if (!Number.isInteger(capacity) || capacity < 1) throw new RangeError('capacity must be >= 1');
  const buf: string[] = [];
  return {
    sink: (line) => {
      buf.push(line);
      if (buf.length > capacity) buf.splice(0, buf.length - capacity);
    },
    lines: () => [...buf],
    records: () => buf.map((l) => JSON.parse(l) as Record<string, unknown>),
    exportJsonl: () => (buf.length ? `${buf.join('\n')}\n` : ''),
    clear: () => void buf.splice(0, buf.length),
  };
}

/** Relay sink writing one line per call to the global console (stdout under Node). */
export const consoleSink: LogSink = (line) => globalThis.console.log(line);
