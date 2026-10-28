/**
 * F15.S03.M01 structured logging: one JSON object per line, redacted with the kernel field list,
 * filtered by a level threshold, written through an injected sink (stdout in the relay, console in dev).
 */
import type { Clock, LogFields, Logger, LogLevel } from '@classrup/kernel';
import { encodeJson, redact, toIso } from '@classrup/kernel';

export const LOG_LEVEL_RANK: Readonly<Record<LogLevel, number>> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface JsonLoggerOptions {
  readonly sink: (line: string) => void;
  readonly clock: Clock;
  readonly minLevel?: LogLevel;
  readonly base?: LogFields;
}

export class JsonLogger implements Logger {
  readonly #opts: JsonLoggerOptions;

  constructor(opts: JsonLoggerOptions) {
    this.#opts = opts;
  }

  log(level: LogLevel, msg: string, fields?: LogFields): void {
    if (LOG_LEVEL_RANK[level] < LOG_LEVEL_RANK[this.#opts.minLevel ?? 'info']) return;
    this.#opts.sink(this.#format(level, msg, fields));
  }

  child(fields: LogFields): Logger {
    return new JsonLogger({ ...this.#opts, base: { ...this.#opts.base, ...fields } });
  }

  /** Logging must never break a command: unserializable fields degrade to a marker line. */
  #format(level: LogLevel, msg: string, fields?: LogFields): string {
    const head = { ts: toIso(this.#opts.clock.now()), level, msg };
    try {
      return encodeJson({ ...redact({ ...this.#opts.base, ...fields }), ...head });
    } catch {
      return encodeJson({ ...head, logError: 'fields not serializable' });
    }
  }
}
