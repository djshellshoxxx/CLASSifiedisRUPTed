/**
 * F11.S03.M02 blocklists: operator blocklists for peers, domains and author keys, plus import of signed
 * blocklists shared by trusted peers. Imported entries never take effect until an operator reviews them.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { assertTransition, conflict, defineOperations, notFound, parse, requireFeature, runCommand, schemas, validationError, z } from '@classrup/kernel';
import type { SignedEnvelope } from '@classrup/security';
import { signEnvelope, verifyEnvelope } from '@classrup/security';
import { keyIdSchema, relayIdSchema, signatureSchema } from '../protocol/records';
import { BLOCKLIST_CONTEXT } from '../protocol/signatures';
import type { BlockEntry, BlockKind, BlockStatus, Peer } from '../types';
import type { Env } from '../support';
import { col, COLLECTIONS, FLAGS } from '../support';

const TRANSITIONS: Readonly<Record<BlockStatus, readonly BlockStatus[]>> = {
  pending_review: ['active', 'rejected'],
  active: ['revoked'],
  rejected: [],
  revoked: [],
};

export const MAX_IMPORT_ENTRIES = 500;
const BLOCK_KINDS = ['peer', 'domain', 'author_key'] as const;

const entrySchema = z.strictObject({ kind: z.enum(BLOCK_KINDS), value: z.string().min(1).max(253), reason: schemas.text(1, 200) });
const removeSchema = z.strictObject({ entryId: schemas.id('fblk'), expectedVersion: z.number().int().min(0).optional() });
const reviewSchema = z.strictObject({ entryId: schemas.id('fblk'), approve: z.boolean(), expectedVersion: z.number().int().min(0).optional() });
const listSchema = z.strictObject({ status: z.enum(['active', 'pending_review', 'rejected', 'revoked']).optional() });
const importSchema = z.strictObject({
  signed: z.strictObject({
    v: z.literal(1),
    ctx: z.literal(BLOCKLIST_CONTEXT),
    signer: keyIdSchema,
    payload: z.strictObject({
      issuer: relayIdSchema,
      issuedAt: schemas.timestamp(),
      entries: z.array(entrySchema).min(1).max(MAX_IMPORT_ENTRIES),
    }),
    sig: signatureSchema,
  }),
});

export interface BlocklistPayload {
  readonly issuer: string;
  readonly issuedAt: number;
  readonly entries: readonly { readonly kind: BlockKind; readonly value: string; readonly reason: string }[];
}

export function normalizeBlockValue(kind: BlockKind, value: string): string {
  if (kind === 'author_key') {
    if (!keyIdSchema.safeParse(value).success) throw validationError('FEDERATION.BLOCK_VALUE_INVALID', 'invalid author key id');
    return value;
  }
  const v = value.trim().toLowerCase();
  if (!relayIdSchema.safeParse(v).success) throw validationError('FEDERATION.BLOCK_VALUE_INVALID', 'invalid relay or domain name');
  return kind === 'domain' ? v.replace(/:\d+$/, '') : v;
}

export interface BlockDto {
  readonly id: string;
  readonly kind: BlockKind;
  readonly value: string;
  readonly reason: string;
  readonly status: BlockStatus;
  readonly source: 'local' | 'imported';
  readonly importedFrom?: string;
  readonly version: number;
}

const dto = (b: BlockEntry): BlockDto => ({
  id: b.id, kind: b.kind, value: b.value, reason: b.reason, status: b.status, source: b.source, version: b.version,
  ...(b.importedFrom ? { importedFrom: b.importedFrom } : {}),
});

const blockEvent = (type: string, b: BlockEntry) => ({
  type, aggregateType: 'blocklist_entry', aggregateId: b.id, revision: b.version, payload: { entryId: b.id, kind: b.kind, status: b.status, source: b.source },
});

export function createBlocklists(env: Env) {
  const { deps, ports } = env;
  const blocks = () => col<BlockEntry>(env, COLLECTIONS.blocks);
  const peers = () => col<Peer>(env, COLLECTIONS.peers);
  const exists = (tenantId: string, kind: BlockKind, value: string): boolean =>
    blocks().list((b) => b.tenantId === tenantId && b.kind === kind && b.value === value && (b.status === 'active' || b.status === 'pending_review')).length > 0;

  /** Active entries only. A domain entry also blocks all of its subdomains. */
  function isBlocked(tenantId: string, kind: BlockKind, rawValue: string): boolean {
    const value = kind === 'author_key' ? rawValue : rawValue.toLowerCase().replace(/:\d+$/, '');
    return blocks().list((b) => b.tenantId === tenantId && b.kind === kind && b.status === 'active').some((b) => (kind === 'domain' ? value === b.value || value.endsWith(`.${b.value}`) : value === b.value));
  }

  function add(ctx: CommandContext, input: unknown): BlockDto {
    const req = parse(entrySchema, input);
    return runCommand(deps, ctx, { name: 'federation.blocklist.add', flag: FLAGS.blocklists, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'federation.blocklist:manage', { type: 'federation.blocklist', tenantId: actor.tenantId });
      const value = normalizeBlockValue(req.kind, req.value);
      if (exists(actor.tenantId, req.kind, value)) throw conflict('FEDERATION.BLOCK_EXISTS', 'already blocked or pending review');
      const now = deps.clock.now();
      const saved = blocks().put({ id: deps.ids.next('fblk'), tenantId: actor.tenantId, kind: req.kind, value, reason: req.reason, status: 'active', source: 'local', createdBy: actor.id, createdAt: now, updatedAt: now }, 0);
      return { result: dto(saved), events: [blockEvent('federation.blocklist.added', saved)] };
    });
  }

  function remove(ctx: CommandContext, input: unknown): BlockDto {
    const req = parse(removeSchema, input);
    return runCommand(deps, ctx, { name: 'federation.blocklist.remove', flag: FLAGS.blocklists, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'federation.blocklist:manage', { type: 'federation.blocklist', tenantId: actor.tenantId });
      const saved = transitionEntry(actor, req.entryId, 'revoked', req.expectedVersion);
      return { result: dto(saved), events: [blockEvent('federation.blocklist.removed', saved)] };
    });
  }

  function transitionEntry(actor: Actor, entryId: string, to: BlockStatus, expectedVersion?: number): BlockEntry {
    const entry = blocks().get(entryId);
    if (!entry || entry.tenantId !== actor.tenantId) throw notFound('FEDERATION.BLOCK_NOT_FOUND', 'blocklist entry not found');
    assertTransition('FEDERATION_BLOCK', entry.status, to, TRANSITIONS);
    if (expectedVersion !== undefined && expectedVersion !== entry.version) throw conflict('STORE.VERSION_CONFLICT', 'entry changed since it was read');
    return blocks().put({ ...entry, status: to, updatedAt: deps.clock.now() }, entry.version);
  }

  function review(ctx: CommandContext, input: unknown): BlockDto {
    const req = parse(reviewSchema, input);
    return runCommand(deps, ctx, { name: 'federation.blocklist.review', flag: FLAGS.blocklists, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'federation.blocklist:manage', { type: 'federation.blocklist', tenantId: actor.tenantId });
      const saved = transitionEntry(actor, req.entryId, req.approve ? 'active' : 'rejected', req.expectedVersion);
      return { result: dto(saved), events: [blockEvent('federation.blocklist.reviewed', saved)] };
    });
  }

  /** Signed export of the active local entries, for sharing with peers. */
  function exportList(actor: Actor): SignedEnvelope<BlocklistPayload> {
    requireFeature(deps.flags, FLAGS.blocklists, actor.tenantId);
    deps.authz.authorize(actor, 'federation.blocklist:manage', { type: 'federation.blocklist', tenantId: actor.tenantId });
    const entries = blocks()
      .list((b) => b.tenantId === actor.tenantId && b.status === 'active' && b.source === 'local')
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((b) => ({ kind: b.kind, value: b.value, reason: b.reason }));
    const payload: BlocklistPayload = { issuer: ports.relay.relayId, issuedAt: deps.clock.now(), entries };
    return signEnvelope(ports.relay.keys, BLOCKLIST_CONTEXT, payload);
  }

  /** Only a list signed by the pinned key of a trusted peer is accepted, and only into the review queue. */
  function importList(ctx: CommandContext, input: unknown): { imported: number; skipped: number } {
    const req = parse(importSchema, input);
    return runCommand(deps, ctx, { name: 'federation.blocklist.import', flag: FLAGS.blocklists, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'federation.blocklist:manage', { type: 'federation.blocklist', tenantId: actor.tenantId });
      const { signed } = req;
      const peer = peers().list((p) => p.tenantId === actor.tenantId && p.relayId === signed.payload.issuer)[0];
      if (!peer || peer.status !== 'trusted') throw conflict('FEDERATION.BLOCKLIST_ISSUER_UNTRUSTED', 'blocklist issuer is not a trusted peer');
      if (!verifyEnvelope(signed as SignedEnvelope<unknown>, BLOCKLIST_CONTEXT, peer.publicKeyId)) {
        throw conflict('FEDERATION.BLOCKLIST_SIGNATURE_INVALID', 'blocklist signature does not match the pinned peer key');
      }
      const now = deps.clock.now();
      const created: BlockEntry[] = [];
      let skipped = 0;
      for (const e of signed.payload.entries) {
        const value = normalizeBlockValue(e.kind, e.value);
        const selfTarget = (e.kind === 'peer' || e.kind === 'domain') && value === ports.relay.relayId;
        if (exists(actor.tenantId, e.kind, value) || selfTarget) {
          skipped++;
          continue;
        }
        created.push(
          blocks().put(
            { id: deps.ids.next('fblk'), tenantId: actor.tenantId, kind: e.kind, value, reason: e.reason, status: 'pending_review', source: 'imported', importedFrom: peer.relayId, createdBy: actor.id, createdAt: now, updatedAt: now },
            0,
          ),
        );
      }
      return { result: { imported: created.length, skipped }, events: created.map((b) => blockEvent('federation.blocklist.imported', b)) };
    });
  }

  function list(actor: Actor, input: unknown): { entries: BlockDto[] } {
    const req = parse(listSchema, input ?? {});
    requireFeature(deps.flags, FLAGS.blocklists, actor.tenantId);
    deps.authz.authorize(actor, 'federation.blocklist:manage', { type: 'federation.blocklist', tenantId: actor.tenantId });
    const found = blocks().list((b) => b.tenantId === actor.tenantId && (req.status === undefined || b.status === req.status)).sort((a, b) => a.id.localeCompare(b.id));
    return { entries: found.map(dto) };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'federation.blocklist.add', kind: 'command', flag: FLAGS.blocklists, summary: 'Block a peer, domain or author key', handler: add },
    { name: 'federation.blocklist.remove', kind: 'command', flag: FLAGS.blocklists, summary: 'Revoke a blocklist entry', handler: remove },
    { name: 'federation.blocklist.review', kind: 'command', flag: FLAGS.blocklists, summary: 'Approve or reject an imported entry', handler: review },
    { name: 'federation.blocklist.import', kind: 'command', flag: FLAGS.blocklists, summary: 'Import a signed blocklist from a trusted peer', handler: importList },
    { name: 'federation.blocklist.export', kind: 'query', flag: FLAGS.blocklists, summary: 'Export active local entries, signed', handler: (ctx) => exportList(ctx.actor) },
    { name: 'federation.blocklist.list', kind: 'query', flag: FLAGS.blocklists, summary: 'List blocklist entries', handler: (ctx, input) => list(ctx.actor, input) },
  ]);

  return { isBlocked, add, remove, review, importList, exportList, list, operations };
}

export type Blocklists = ReturnType<typeof createBlocklists>;
