import { z } from '../../../packages/kernel/src/index.ts';
import { strictCanonicalJson, MAX_ENVELOPE_BYTES } from '../../../packages/federation/src/index.ts';
import { admitSignedGraph, type AdmissionOptions } from '../../../packages/mutiny/src/cycle_matching/admission.ts';
import { discoverCycles, type MatchResult } from '../../../packages/mutiny/src/cycle_matching/index.ts';

// Transport bounds are separate from the engine's unchanged 2,000-node / 20,000-edge caps.
// This is a serialized-input ceiling, not a claim about peak worker memory.
export const MATCH_INPUT_BYTES = 32 * 1024 * 1024;
const id = z.string().min(1).max(512);
const integer = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const admissionSchema = z.strictObject({
  now: integer, localPrincipal: id, optedIn: z.literal(true),
  includeUnknownIdentities: z.boolean().optional(),
  blockedOwners: z.array(id).max(2000).optional(), knownOwners: z.array(id).max(2000).optional(),
  maxDistanceBucket: z.number().int().min(0).max(4).optional(),
});
const searchSchema = z.strictObject({
  lmax: z.number().int().min(2).max(8).optional(),
  expansionBudget: z.number().int().min(1).max(100000).optional(),
  timeBudgetMs: z.number().int().min(1).max(250).optional(),
  maxSuggestions: z.number().int().min(1).max(500).optional(),
});
const requestSchema = z.strictObject({
  v: z.literal(1), kind: z.literal('match'), id: integer.min(1),
  listings: z.array(z.string().max(MAX_ENVELOPE_BYTES)).max(4000),
  wants: z.array(z.string().max(MAX_ENVELOPE_BYTES)).max(20000),
  admission: admissionSchema, search: searchSchema,
});
export type MatchingRequest = z.infer<typeof requestSchema>;
export interface MatchingInput {
  readonly listingStatements: readonly unknown[];
  readonly wantStatements: readonly unknown[];
  readonly options: AdmissionOptions;
  readonly search?: z.infer<typeof searchSchema>;
}
const edgeSchema = z.strictObject({
  giverId: id, receiverId: id, inventoryItemId: id, listingCid: id, wantCid: id,
  receiverOfferingListingCid: id.optional(), valueMinor: z.string().regex(/^(0|[1-9][0-9]{0,29})$/),
  currency: z.string().regex(/^[A-Z]{3}$/), distanceBucket: integer.max(4), wantCreatedAt: integer,
});
const digest = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
const outcomeSchema = z.strictObject({
  result: z.strictObject({
    suggestions: z.array(z.strictObject({ cycleKey: digest, legs: z.array(edgeSchema).min(2).max(8),
      score: z.strictObject({ participants: integer.min(2).max(8), imbalancePermille: integer.max(1000), maxDistanceBucket: integer.max(4), oldestWantAgeDays: integer }),
    })).max(500),
    inputHash: digest,
    stats: z.strictObject({ nodes: integer.max(2000), edges: integer.max(20000), expansions: integer.max(100000), durationMs: z.number().finite().min(0), cyclesFound: integer.max(100000), truncated: z.enum(['none', 'expansions', 'time', 'results']) }),
  }),
  rejected: integer.max(20000), oldestProjectionAt: integer.nullable(),
  trust: z.enum(['explicitly-including-unknown', 'known-owners-only']),
});
export interface MatchingOutcome extends Omit<z.infer<typeof outcomeSchema>, 'result'> { readonly result: MatchResult }
const responseSchema = z.discriminatedUnion('kind', [
  z.strictObject({ v: z.literal(1), kind: z.literal('result'), id: integer.min(1), outcome: outcomeSchema }),
  z.strictObject({ v: z.literal(1), kind: z.literal('error'), id: integer.min(1), code: z.enum(['INVALID_INPUT', 'MATCH_FAILED']) }),
]);
export type MatchingResponse = z.infer<typeof responseSchema>;
export const parseMatchingResponse = (value: unknown): MatchingResponse => responseSchema.parse(value);

/** Only the public signed statements and explicit policy cross the worker boundary. */
function* requestParts(input: MatchingInput, requestId: number): Generator<void, MatchingRequest> {
  const admission = admissionSchema.parse(input.options);
  const search = searchSchema.parse(input.search ?? {});
  if (!Array.isArray(input.listingStatements) || input.listingStatements.length > 4000
    || !Array.isArray(input.wantStatements) || input.wantStatements.length > 20000) throw new Error('Matching input exceeds its record limit');
  let size = new TextEncoder().encode(JSON.stringify({ admission, search })).length;
  const encode = (value: unknown): string => {
    const encoded = strictCanonicalJson(value);
    size += new TextEncoder().encode(encoded).length;
    if (size > MATCH_INPUT_BYTES) throw new Error('Matching input exceeds its byte limit');
    return encoded;
  };
  // Snapshot the arrays before yielding; payloads are detached by canonical encoding and
  // authenticated again inside the worker, never trusted because of their local source.
  const sources = [[...input.listingStatements], [...input.wantStatements]];
  const outputs: [string[], string[]] = [[], []];
  let processed = 0;
  let batchStart = size;
  for (let group = 0; group < sources.length; group++) for (const statement of sources[group]!) {
    outputs[group]!.push(encode(statement));
    // A few near-limit envelopes can be much larger than 25 ordinary listings.
    // Yield by bytes too; only one individually bounded envelope may cross this target.
    if (++processed % 25 === 0 || size - batchStart >= 256 * 1024) { batchStart = size; yield; }
  }
  return requestSchema.parse({ v: 1, kind: 'match', id: requestId, listings: outputs[0], wants: outputs[1], admission, search });
}

/** Synchronous helper for small fixtures; production uses cooperative preparation below. */
export function matchingRequest(input: MatchingInput, requestId: number): MatchingRequest {
  const parts = requestParts(input, requestId);
  let next = parts.next();
  while (!next.done) next = parts.next();
  return next.value;
}

/** Yield between bounded encoding batches so locking/cancellation and rendering can proceed. */
export async function prepareMatchingRequest(input: MatchingInput, requestId: number, checkActive: () => void, yieldNow: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 0))): Promise<MatchingRequest> {
  const parts = requestParts(input, requestId);
  for (;;) {
    checkActive();
    const next = parts.next();
    if (next.done) { checkActive(); return next.value; }
    await yieldNow();
  }
}

/** Worker-side validation is mandatory even when the main thread constructed the request. */
export async function executeMatchingRequest(input: unknown): Promise<MatchingResponse> {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { v: 1, kind: 'error', id: 1, code: 'INVALID_INPUT' };
  const request = parsed.data;
  try {
    let size = new TextEncoder().encode(JSON.stringify({ admission: request.admission, search: request.search })).length;
    const decode = (encoded: string): unknown => {
      const bytes = new TextEncoder().encode(encoded).length;
      size += bytes;
      if (bytes > MAX_ENVELOPE_BYTES || size > MATCH_INPUT_BYTES) throw new Error('Input limit');
      return JSON.parse(encoded) as unknown;
    };
    const listings = request.listings.map(decode);
    const wants = request.wants.map(decode);
    // Never accept a caller-provided admitted graph: every signature and projection is checked here.
    const graph = await admitSignedGraph(listings, wants, request.admission);
    const result = await discoverCycles(graph.edges, { ...request.search, now: request.admission.now, localPrincipal: request.admission.localPrincipal });
    const outcome = outcomeSchema.parse({ result, rejected: graph.rejected, oldestProjectionAt: graph.oldestProjectionAt, trust: graph.trust });
    return { v: 1, kind: 'result', id: request.id, outcome };
  } catch {
    // Native errors can include private payloads; only this fixed code leaves the worker.
    return { v: 1, kind: 'error', id: request.id, code: 'MATCH_FAILED' };
  }
}
