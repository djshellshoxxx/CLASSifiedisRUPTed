/**
 * CTR-SCH-001 (owner F15): input validation and event schema registry.
 * Validation errors list paths and zod messages only; input values are never echoed.
 */
import { z } from 'zod';
import { validationError } from './errors';

export { z };

export function parse<S extends z.ZodType>(schema: S, input: unknown, code = 'VALIDATION.INVALID_INPUT'): z.output<S> {
  const r = schema.safeParse(input);
  if (r.success) return r.data;
  const issues = r.error.issues.slice(0, 20).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
  throw validationError(code, 'input failed validation', { issues });
}

/** Common field schemas shared across modules. */
export const schemas = {
  id: (prefix: string) => z.string().regex(new RegExp(`^${prefix}_[0-9A-HJKMNP-TV-Z]{26}$`), `expected ${prefix} id`),
  /** Free text: trimmed, NFC-normalized, control characters (except \n, \t) rejected. */
  text: (min: number, max: number) =>
    z
      .string()
      .transform((s) => s.normalize('NFC').trim())
      .pipe(
        z
          .string()
          .min(min)
          .max(max)
          // eslint-disable-next-line no-control-regex
          .refine((s) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s), 'control characters not allowed'),
      ),
  timestamp: () => z.number().int().nonnegative(),
  idempotencyKey: () => z.string().min(8).max(128).regex(/^[A-Za-z0-9_\-:.]+$/),
  currency: () => z.string().regex(/^[A-Z][A-Z0-9]{2,9}$/),
  /** Integer minor units as decimal string or bigint (JSON transport uses strings). */
  minor: () =>
    z.union([z.bigint(), z.string().regex(/^-?\d{1,30}$/), z.number().int()]).transform((v) => BigInt(v)),
} as const;

export interface EventSchemaEntry {
  readonly type: string;
  readonly version: number;
  readonly schema: z.ZodType;
}

type Upcaster = (payload: unknown) => unknown;

/** Registry of event payload schemas with upcasters from version n to n+1. */
export class SchemaRegistry {
  readonly #entries = new Map<string, Map<number, z.ZodType>>();
  readonly #upcasters = new Map<string, Map<number, Upcaster>>();

  register(type: string, version: number, schema: z.ZodType, upcastFromPrevious?: Upcaster): void {
    let versions = this.#entries.get(type);
    if (!versions) {
      versions = new Map();
      this.#entries.set(type, versions);
    }
    if (versions.has(version)) throw new Error(`schema already registered: ${type}@${version}`);
    if (version > 1 && !upcastFromPrevious) throw new Error(`upcaster required for ${type}@${version}`);
    versions.set(version, schema);
    if (upcastFromPrevious) {
      let ups = this.#upcasters.get(type);
      if (!ups) {
        ups = new Map();
        this.#upcasters.set(type, ups);
      }
      ups.set(version - 1, upcastFromPrevious);
    }
  }

  latest(type: string): number | undefined {
    const v = this.#entries.get(type);
    return v ? Math.max(...v.keys()) : undefined;
  }

  /** Validate a payload at `version`, upcasting to the latest registered version. */
  decode(type: string, version: number, payload: unknown): { version: number; payload: unknown } {
    const versions = this.#entries.get(type);
    if (!versions) throw validationError('SCHEMA.UNKNOWN_TYPE', 'unknown event type', { type });
    const latest = Math.max(...versions.keys());
    if (version > latest) throw validationError('SCHEMA.UNSUPPORTED_VERSION', 'event version newer than supported', { type, version, latest });
    let v = version;
    let p = parse(versions.get(v) ?? z.never(), payload, 'SCHEMA.INVALID_PAYLOAD');
    while (v < latest) {
      const up = this.#upcasters.get(type)?.get(v);
      if (!up) throw validationError('SCHEMA.NO_UPCASTER', 'missing upcaster', { type, version: v });
      v++;
      p = parse(versions.get(v) ?? z.never(), up(p), 'SCHEMA.INVALID_PAYLOAD');
    }
    return { version: v, payload: p };
  }

  types(): string[] {
    return [...this.#entries.keys()].sort();
  }
}
