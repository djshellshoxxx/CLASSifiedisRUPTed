// Secret wrapper (T01): every string, JSON, inspect and error form renders [REDACTED]; the raw value is reachable
// only through reveal() at the use site.
import { REDACTED } from './schema.ts';

const INSPECT = Symbol.for('nodejs.util.inspect.custom');

export class Secret {
  readonly #bytes: Uint8Array;
  /** Number of bytes of the raw value (metadata, not secret). */
  readonly length: number;

  private constructor(bytes: Uint8Array) {
    this.#bytes = bytes.slice();
    this.length = bytes.length;
    Object.freeze(this);
  }

  static fromBytes(bytes: Uint8Array): Secret {
    return new Secret(bytes);
  }

  static fromText(text: string): Secret {
    return new Secret(new TextEncoder().encode(text));
  }

  static isSecret(value: unknown): value is Secret {
    return value instanceof Secret;
  }

  /** A copy of the raw bytes; call only where the value is used, never to log or serialize it. */
  reveal(): Uint8Array {
    return this.#bytes.slice();
  }

  /** The raw value decoded as UTF-8 (text secrets such as passwords). */
  revealText(): string {
    return new TextDecoder().decode(this.#bytes);
  }

  toString(): string {
    return REDACTED;
  }

  toJSON(): string {
    return REDACTED;
  }

  toLocaleString(): string {
    return REDACTED;
  }

  valueOf(): string {
    return REDACTED;
  }

  [Symbol.toPrimitive](): string {
    return REDACTED;
  }

  get [Symbol.toStringTag](): string {
    return REDACTED;
  }

  [INSPECT](): string {
    return REDACTED;
  }
}
