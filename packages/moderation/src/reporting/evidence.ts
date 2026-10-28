/** F12.S01.M02 evidence: append-only items per case forming a SHA-256 hash chain. */
import type { CommandContext } from '@classrup/kernel';
import { contentHash } from '@classrup/security';
import { parse, runCommand, schemas, z } from '@classrup/kernel';
import { authorize, event, inTenant, operation } from '../common';
import type { Env } from '../common';
import type { EvidenceKind, EvidenceRecord } from '../types';

export const GENESIS_HASH = 'sha256:genesis';
const HASH_RE = /^sha256:[A-Za-z0-9_-]{43}$/;
/** Kinds staff may add by hand; `report` and `decision` are written by the system only. */
const MANUAL_KINDS = ['message_excerpt', 'screenshot_ref', 'listing_snapshot', 'transaction_ref', 'note'] as const satisfies readonly EvidenceKind[];

const addSchema = z
  .object({
    caseId: schemas.id('mcase'),
    kind: z.enum(MANUAL_KINDS),
    ref: schemas.text(1, 200),
    contentHash: z.string().regex(HASH_RE).optional(),
    /** Hashed server-side and discarded; only the hash is retained. */
    content: schemas.text(1, 5000).optional(),
  })
  .refine((v) => (v.contentHash === undefined) !== (v.content === undefined), 'provide exactly one of contentHash or content');
const caseSchema = z.object({ caseId: schemas.id('mcase') });

export type AddEvidenceInput = z.input<typeof addSchema>;

export interface EvidenceDto {
  readonly id: string;
  readonly caseId: string;
  readonly seq: number;
  readonly kind: EvidenceKind;
  readonly contentHash: string;
  readonly ref: string;
  readonly addedBy: string;
  readonly at: number;
  readonly prevHash: string;
  readonly hash: string;
}

export type ChainBreak = 'sequence_gap' | 'prev_hash_mismatch' | 'hash_mismatch' | 'head_mismatch';

export interface ChainVerification {
  readonly caseId: string;
  readonly valid: boolean;
  readonly length: number;
  readonly brokenAtSeq?: number;
  readonly reason?: ChainBreak;
}

type Link = Pick<EvidenceRecord, 'caseId' | 'seq' | 'kind' | 'contentHash' | 'ref' | 'addedBy' | 'at' | 'prevHash'>;

const linkHash = (l: Link): string =>
  contentHash({ caseId: l.caseId, seq: l.seq, kind: l.kind, contentHash: l.contentHash, ref: l.ref, addedBy: l.addedBy, at: l.at, prevHash: l.prevHash });

const toDto = (e: EvidenceRecord): EvidenceDto => ({
  id: e.id,
  caseId: e.caseId,
  seq: e.seq,
  kind: e.kind,
  contentHash: e.contentHash,
  ref: e.ref,
  addedBy: e.addedBy,
  at: e.at,
  prevHash: e.prevHash,
  hash: e.hash,
});

export interface NewEvidence {
  readonly caseId: string;
  readonly kind: EvidenceKind;
  readonly contentHash: string;
  readonly ref: string;
  readonly addedBy: string;
}

/** Appends one link; callers run inside a command transaction so item and chain head commit together. */
export function appendEvidence(env: Env, input: NewEvidence): EvidenceRecord {
  return env.deps.store.transaction(() => {
    const head = env.cols.evidenceHeads.get(input.caseId);
    const link: Link = {
      caseId: input.caseId,
      seq: (head?.count ?? 0) + 1,
      kind: input.kind,
      contentHash: input.contentHash,
      ref: input.ref,
      addedBy: input.addedBy,
      at: env.deps.clock.now(),
      prevHash: head?.hash ?? GENESIS_HASH,
    };
    const hash = linkHash(link);
    const record = env.cols.evidence.put({ id: env.deps.ids.next('mevd'), ...link, hash }, 0);
    env.cols.evidenceHeads.put({ id: input.caseId, hash, count: link.seq }, head?.version ?? 0);
    return record;
  });
}

const chainOf = (env: Env, caseId: string): EvidenceRecord[] =>
  env.cols.evidence.list((e) => e.caseId === caseId).sort((a, b) => a.seq - b.seq);

export function verifyChain(env: Env, caseId: string): ChainVerification {
  const items = chainOf(env, caseId);
  let prevHash = GENESIS_HASH;
  for (const [i, item] of items.entries()) {
    const broken = (reason: ChainBreak): ChainVerification => ({ caseId, valid: false, length: items.length, brokenAtSeq: item.seq, reason });
    if (item.seq !== i + 1) return broken('sequence_gap');
    if (item.prevHash !== prevHash) return broken('prev_hash_mismatch');
    if (linkHash(item) !== item.hash) return broken('hash_mismatch');
    prevHash = item.hash;
  }
  const head = env.cols.evidenceHeads.get(caseId);
  const headOk = items.length === 0 ? head === undefined : head?.count === items.length && head.hash === prevHash;
  return headOk ? { caseId, valid: true, length: items.length } : { caseId, valid: false, length: items.length, reason: 'head_mismatch' };
}

export function createEvidence(env: Env) {
  const requireCase = (ctx: CommandContext, caseId: string): void => {
    inTenant(env.cols.cases.get(caseId), ctx.actor, 'MODERATION.CASE_NOT_FOUND', 'case');
  };

  function add(ctx: CommandContext, input: AddEvidenceInput): EvidenceDto {
    authorize(env, ctx, 'moderation.evidence:add', 'case');
    const v = parse(addSchema, input);
    requireCase(ctx, v.caseId);
    return runCommand(env.deps, ctx, { name: 'moderation.evidence.add', flag: 'moderation.evidence', request: v }, () => {
      const hash = v.contentHash ?? contentHash(v.content ?? '');
      const rec = appendEvidence(env, { caseId: v.caseId, kind: v.kind, contentHash: hash, ref: v.ref, addedBy: ctx.actor.id });
      const payload = { evidenceId: rec.id, caseId: rec.caseId, seq: rec.seq, kind: rec.kind };
      return { result: toDto(rec), events: [event('moderation.evidence.added', 'evidence', rec.id, rec.version, payload)] };
    });
  }

  function list(ctx: CommandContext, input: z.input<typeof caseSchema>): EvidenceDto[] {
    authorize(env, ctx, 'moderation.evidence:read', 'case');
    const v = parse(caseSchema, input);
    requireCase(ctx, v.caseId);
    return chainOf(env, v.caseId).map(toDto);
  }

  function verify(ctx: CommandContext, input: z.input<typeof caseSchema>): ChainVerification {
    authorize(env, ctx, 'moderation.evidence:read', 'case');
    const v = parse(caseSchema, input);
    requireCase(ctx, v.caseId);
    return verifyChain(env, v.caseId);
  }

  const operations = [
    operation('moderation.evidence.add', 'command', 'moderation.evidence', 'Append an evidence item to a case hash chain', add),
    operation('moderation.evidence.list', 'query', 'moderation.evidence', 'List a case evidence chain', list),
    operation('moderation.evidence.verify', 'query', 'moderation.evidence', 'Verify a case evidence hash chain', verify),
  ];
  return { add, list, verify, operations };
}
