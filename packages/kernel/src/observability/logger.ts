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

export interface LoggerOptions {
  readonly sink: LogSink;
  readonly clock: Clock;
  readonly level?: LogLevel;
  readonly bindings?: LogFields;
}

function format(clock: Clock, level: LogLevel, msg: string, fields: LogFields): string {
  const safe = (redact(fields) ?? {}) as Record<string, unknown>;
  const line: Record<string, unknown> = { ts: clock.iso(), level, msg };
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
