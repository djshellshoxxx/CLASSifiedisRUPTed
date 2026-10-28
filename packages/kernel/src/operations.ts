/**
 * Operation descriptors: the uniform RPC surface each feature exposes. The relay mounts every
 * operation at `POST /v1/ops/<name>` (JSON body = input, `Idempotency-Key` header for commands).
 * Handlers validate `input` themselves (zod) and return JSON-safe DTOs: no bigint (use MoneyJson
 * strings), no Uint8Array (use base64url), no undefined-vs-null ambiguity in arrays.
 */
import type { CommandContext } from './runtime';

export type OperationKind = 'command' | 'query';

export interface Operation {
  /** `<area>.<aggregate>.<verb>`, e.g. `bazaar.listing.create`. */
  readonly name: string;
  readonly kind: OperationKind;
  /** Feature flag gating the operation (checked by the handler via runCommand or requireFeature). */
  readonly flag: string;
  readonly summary: string;
  /** If true the relay lets anonymous actors call it (authorization still runs). */
  readonly public?: boolean;
  handler(ctx: CommandContext, input: unknown): unknown;
}

const OP_RE = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*){2,}$/;

export function defineOperations(ops: readonly Operation[]): readonly Operation[] {
  const seen = new Set<string>();
  for (const op of ops) {
    if (!OP_RE.test(op.name)) throw new TypeError(`invalid operation name ${op.name}`);
    if (seen.has(op.name)) throw new TypeError(`duplicate operation ${op.name}`);
    seen.add(op.name);
  }
  return Object.freeze([...ops]);
}
