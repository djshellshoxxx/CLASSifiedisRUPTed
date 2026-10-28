/**
 * F11.S03.M03 account migration: a statement {fromRelay, toRelay, oldKeyId, newKeyId, at} signed by both the
 * old and the new key. A verified statement (1) makes the new key an accepted successor of the old key for
 * records the old key authored, (2) when this relay is the old home, replaces the account's published records
 * with tombstones that redirect to the new relay, and (3) travels to peers inside those tombstones.
 * A statement with the same relay on both sides is a plain key rotation: successor only, no tombstones.
 */
import type { Actor, CommandContext, Operation } from '@classrup/kernel';
import { conflict, defineOperations, forbidden, parse, precondition, requireFeature, runCommand, validationError, z } from '@classrup/kernel';
import { hashRecord, keyIdSchema, migrationProofSchema } from '../protocol/records';
import { countersign, verifyMigrationProof } from '../protocol/signatures';
import type { FederatedEnvelope, FederatedRecord, MigrationProof, MigrationRow, StoredRecord } from '../types';
import type { Env } from '../support';
import { CLOCK_SKEW_MS, col, COLLECTIONS, FLAGS, relayKeyId } from '../support';
import { enqueueDeliveries } from '../sync/outbox';

const submitSchema = z.strictObject({ proof: migrationProofSchema });
const resolveSchema = z.strictObject({ keyId: keyIdSchema });
const MAX_CHAIN = 5;

export interface MigrationDto {
  readonly id: string;
  readonly fromRelay: string;
  readonly toRelay: string;
  readonly oldKeyId: string;
  readonly newKeyId: string;
  readonly at: number;
  readonly redirected: number;
}

const dto = (m: MigrationRow): MigrationDto => ({ id: m.id, ...m.statement, redirected: m.redirected });

export function createMigration(env: Env) {
  const { deps, ports } = env;
  const migrations = () => col<MigrationRow>(env, COLLECTIONS.migrations);
  const records = () => col<StoredRecord>(env, COLLECTIONS.records);

  const byOldKey = (tenantId: string, keyId: string): MigrationRow | undefined => migrations().list((m) => m.tenantId === tenantId && m.statement.oldKeyId === keyId)[0];

  /** Follows verified successor links (bounded, cycle-safe). */
  function successorChain(tenantId: string, keyId: string): MigrationRow[] {
    const chain: MigrationRow[] = [];
    const seen = new Set([keyId]);
    let current = keyId;
    while (chain.length < MAX_CHAIN) {
      const next = byOldKey(tenantId, current);
      if (!next || seen.has(next.statement.newKeyId)) break;
      chain.push(next);
      seen.add(next.statement.newKeyId);
      current = next.statement.newKeyId;
    }
    return chain;
  }

  /** True when `incomingKey` is the original author key or a migration-proven successor of it. */
  function isSameAuthor(tenantId: string, originalKey: string, incomingKey: string): boolean {
    return originalKey === incomingKey || successorChain(tenantId, originalKey).some((m) => m.statement.newKeyId === incomingKey);
  }

  function validateStatement(proof: MigrationProof): void {
    const { statement } = proof;
    if (!verifyMigrationProof(proof)) throw validationError('FEDERATION.MIGRATION_SIGNATURE_INVALID', 'both the old and the new key must sign the statement');
    if (statement.at > deps.clock.now() + CLOCK_SKEW_MS) throw validationError('FEDERATION.MIGRATION_FUTURE', 'statement is dated in the future');
  }

  /** Idempotent registration; a second statement for the same old key must name the same successor. */
  function register(tenantId: string, proof: MigrationProof, source: MigrationRow['source']): { row: MigrationRow; created: boolean } {
    const prior = byOldKey(tenantId, proof.statement.oldKeyId);
    if (prior) {
      if (prior.statement.newKeyId !== proof.statement.newKeyId) throw conflict('FEDERATION.MIGRATION_CONFLICT', 'the old key already migrated to a different key');
      return { row: prior, created: false };
    }
    const row = migrations().put(
      { id: deps.ids.next('fmig'), tenantId, statement: proof.statement, oldSig: proof.oldSig, newSig: proof.newSig, source, redirected: 0, createdAt: deps.clock.now() },
      0,
    );
    return { row, created: true };
  }

  /** Registers a migration learned from a peer's migrated tombstone. Verification already happened with the record. */
  const registerFromPeer = (tenantId: string, proof: MigrationProof): MigrationRow => register(tenantId, proof, 'peer').row;

  /** Replaces the old key's published records with relay-countersigned redirect tombstones and queues them for peers. */
  function tombstoneRecords(tenantId: string, proof: MigrationProof): number {
    const { statement } = proof;
    const targets = records().list((r) => r.tenantId === tenantId && r.source === 'local' && r.authorKeyId === statement.oldKeyId && r.state === 'active' && r.type !== 'tombstone');
    const keyId = relayKeyId(env);
    for (const r of targets) {
      const tomb: FederatedRecord = {
        v: 1, type: 'tombstone', recordId: r.recordId, revision: r.revision + 1, authorKeyId: r.authorKeyId, originRelay: r.originRelay, createdAt: deps.clock.now(),
        payload: { reason: 'migrated', redirect: { toRelay: statement.toRelay, newKeyId: statement.newKeyId }, migration: proof }, prevHash: r.contentHash,
      };
      const envelope: FederatedEnvelope = countersign(ports.relay.keys, keyId, { record: tomb, authorSig: proof.oldSig });
      const saved = records().put(
        { ...r, type: 'tombstone', revision: tomb.revision, contentHash: hashRecord(tomb), envelope, state: 'tombstoned', redirectTo: { toRelay: statement.toRelay, newKeyId: statement.newKeyId }, receivedAt: deps.clock.now() },
        r.version,
      );
      enqueueDeliveries(env, tenantId, saved);
    }
    return targets.length;
  }

  /** Account owners may submit statements that involve this relay; operators may register any verified statement. */
  function authorizeSubmit(actor: Actor, proof: MigrationProof): void {
    const { statement } = proof;
    if (deps.authz.can(actor, 'federation.migration:administer', { type: 'federation.migration', tenantId: actor.tenantId })) return;
    const account = ports.accounts.get(actor.id);
    const owns = account !== undefined && account.tenantId === actor.tenantId && (account.signingKeyIds.includes(statement.oldKeyId) || account.signingKeyIds.includes(statement.newKeyId));
    if (!owns) throw forbidden('FEDERATION.MIGRATION_NOT_OWNER', 'you do not control either key of this statement');
    if (statement.fromRelay !== ports.relay.relayId && statement.toRelay !== ports.relay.relayId) {
      throw precondition('FEDERATION.MIGRATION_NOT_LOCAL', 'this relay is neither the source nor the destination of the migration');
    }
  }

  function submit(ctx: CommandContext, input: unknown): MigrationDto {
    const req = parse(submitSchema, input);
    return runCommand(deps, ctx, { name: 'federation.migration.submit', flag: FLAGS.migration, request: req }, () => {
      const { actor } = ctx;
      deps.authz.authorize(actor, 'federation.migration:submit', { type: 'federation.migration', tenantId: actor.tenantId });
      const proof = req.proof as MigrationProof;
      authorizeSubmit(actor, proof);
      validateStatement(proof);
      const { statement } = proof;
      const { row, created } = register(actor.tenantId, proof, deps.authz.can(actor, 'federation.migration:administer') ? 'admin' : 'account');
      if (!created) return { result: dto(row) };
      const redirected = statement.fromRelay === ports.relay.relayId && statement.toRelay !== ports.relay.relayId ? tombstoneRecords(actor.tenantId, proof) : 0;
      const saved = redirected > 0 ? migrations().put({ ...row, redirected }, row.version) : row;
      return {
        result: dto(saved),
        events: [{ type: 'federation.migration.verified', aggregateType: 'migration', aggregateId: saved.id, revision: saved.version, payload: { migrationId: saved.id, fromRelay: statement.fromRelay, toRelay: statement.toRelay, oldKeyId: statement.oldKeyId, newKeyId: statement.newKeyId, redirected } }],
      };
    });
  }

  /** Public: where did this key move? Follows the chain to the newest key. */
  function resolveSuccessor(actor: Actor, input: unknown): { keyId: string; successor: { keyId: string; relay: string } | null } {
    const req = parse(resolveSchema, input);
    requireFeature(deps.flags, FLAGS.migration, actor.tenantId);
    deps.authz.authorize(actor, 'federation.migration:resolve', { type: 'federation.migration', tenantId: actor.tenantId });
    const last = successorChain(actor.tenantId, req.keyId).at(-1);
    return { keyId: req.keyId, successor: last ? { keyId: last.statement.newKeyId, relay: last.statement.toRelay } : null };
  }

  const operations: readonly Operation[] = defineOperations([
    { name: 'federation.migration.submit', kind: 'command', flag: FLAGS.migration, summary: 'Submit a dual-signed account migration statement', handler: submit },
    { name: 'federation.migration.resolve', kind: 'query', flag: FLAGS.migration, summary: 'Find where an author key moved to', public: true, handler: (ctx, input) => resolveSuccessor(ctx.actor, input) },
  ]);

  return { submit, resolveSuccessor, isSameAuthor, registerFromPeer, successorChain, operations };
}

export type Migration = ReturnType<typeof createMigration>;
