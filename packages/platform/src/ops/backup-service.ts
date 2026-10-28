/** F15.S03.M02 backup catalog and operations: signed snapshots, verification records and retention pruning. */
import type { Collection, Deps, Operation, Versioned } from '@classrup/kernel';
import { notFound, runCommand, unavailable, z } from '@classrup/kernel';
import type { SigningKeyPair } from '@classrup/security';
import { PERM } from '../policies';
import type { BackupStore } from '../ports';
import { authorize, operation, platformEvent, tenantIdSchema } from '../support';
import type { RetentionPolicy, SnapshotSource } from './backups';
import { backupSignerId, createBackup, DEFAULT_RETENTION, parseBackup, selectBackupsToPrune, serializeBackup, verifyBackup } from './backups';

const FLAG = 'platform.operations';
export const BACKUPS_COLLECTION = 'platform_backups';

export type BackupStatus = 'stored' | 'pruned';

export interface BackupRecord extends Versioned {
  readonly createdAt: number;
  readonly tenant?: string;
  readonly status: BackupStatus;
  readonly sha256: string;
  readonly sizeBytes: number;
  readonly collections: number;
  readonly records: number;
  readonly eventsLastPosition: number;
  readonly signer: string;
  readonly lastVerifiedAt?: number;
  readonly lastVerificationOk?: boolean;
}

export interface BackupServiceConfig {
  readonly source?: SnapshotSource;
  readonly key?: SigningKeyPair;
  readonly store: BackupStore;
  readonly retention?: RetentionPolicy;
}

export const backupDto = (r: BackupRecord): Record<string, unknown> => ({
  id: r.id,
  createdAt: r.createdAt,
  ...(r.tenant !== undefined ? { tenant: r.tenant } : {}),
  status: r.status,
  sha256: r.sha256,
  sizeBytes: r.sizeBytes,
  collections: r.collections,
  records: r.records,
  eventsLastPosition: r.eventsLastPosition,
  signer: r.signer,
  ...(r.lastVerifiedAt !== undefined ? { lastVerifiedAt: r.lastVerifiedAt, lastVerificationOk: r.lastVerificationOk } : {}),
  version: r.version,
});

const createSchema = z.strictObject({ tenant: tenantIdSchema.optional() });
const idSchema = z.strictObject({ backupId: z.string().regex(/^bkp_[0-9A-HJKMNP-TV-Z]{26}$/) });
const emptySchema = z.strictObject({});

export function backupOperations(deps: Deps, cfg: BackupServiceConfig): readonly Operation[] {
  const records: Collection<BackupRecord> = deps.store.collection<BackupRecord>(BACKUPS_COLLECTION);
  const retention = cfg.retention ?? DEFAULT_RETENTION;

  const requireSigner = (): { source: SnapshotSource; key: SigningKeyPair } => {
    if (!cfg.source || !cfg.key) throw unavailable('BACKUP.NOT_CONFIGURED', 'backups need a snapshot source and operator key');
    return { source: cfg.source, key: cfg.key };
  };

  return [
    operation({ name: 'platform.backup.create', kind: 'command', flag: FLAG, summary: 'Create and store a signed backup snapshot' }, createSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.backupCreate);
      return runCommand(deps, ctx, { name: 'platform.backup.create', flag: FLAG, request: input }, () => {
        const { source, key } = requireSigner();
        const now = deps.clock.now();
        const snapshot = createBackup(source, key, now, input.tenant);
        const text = serializeBackup(snapshot);
        const id = deps.ids.next('bkp');
        cfg.store.put(id, text);
        const stored = records.put(
          {
            id,
            createdAt: now,
            ...(input.tenant !== undefined ? { tenant: input.tenant } : {}),
            status: 'stored',
            sha256: snapshot.manifest.sha256,
            sizeBytes: text.length,
            collections: Object.keys(snapshot.manifest.collections).length,
            records: Object.values(snapshot.manifest.collections).reduce((n, c) => n + c.count, 0),
            eventsLastPosition: snapshot.manifest.eventsLastPosition,
            signer: backupSignerId(key),
          },
          0,
        );
        const payload = { backupId: id, sha256: stored.sha256, eventsLastPosition: stored.eventsLastPosition };
        return { result: backupDto(stored), events: [platformEvent('platform.backup.created', 'backup', id, stored.version, payload)] };
      });
    }),

    operation({ name: 'platform.backup.verify', kind: 'command', flag: FLAG, summary: 'Verify a stored backup and record the outcome' }, idSchema, (ctx, input) => {
      authorize(deps, ctx, PERM.backupVerify);
      return runCommand(deps, ctx, { name: 'platform.backup.verify', flag: FLAG, request: input }, () => {
        const { key } = requireSigner();
        const record = records.require(input.backupId);
        const text = record.status === 'stored' ? cfg.store.get(record.id) : undefined;
        if (text === undefined) throw notFound('BACKUP.BLOB_MISSING', 'backup content is not available', { backupId: record.id });
        const verification = verifyBackup(parseBackup(text), backupSignerId(key));
        const stored = records.put({ ...record, lastVerifiedAt: deps.clock.now(), lastVerificationOk: verification.ok }, record.version);
        const payload = { backupId: record.id, ok: verification.ok };
        return {
          result: { ...backupDto(stored), ok: verification.ok, problems: [...verification.problems] },
          events: [platformEvent('platform.backup.verified', 'backup', record.id, stored.version, payload)],
        };
      });
    }),

    operation({ name: 'platform.backup.purge_due', kind: 'command', flag: FLAG, summary: 'Prune backups outside the retention policy' }, emptySchema, (ctx, input) => {
      authorize(deps, ctx, PERM.backupPrune);
      return runCommand(deps, ctx, { name: 'platform.backup.purge_due', flag: FLAG, request: input }, () => {
        const live = records.list((r) => r.status === 'stored');
        const full = live.filter((r) => r.tenant === undefined);
        const scoped = live.filter((r) => r.tenant !== undefined);
        // Tenant-scoped exports are portability artifacts; each tenant keeps its own history.
        const groups = [full, ...[...new Set(scoped.map((r) => r.tenant))].map((t) => scoped.filter((r) => r.tenant === t))];
        const pruned = groups.flatMap((g) => selectBackupsToPrune(g, retention)).sort();
        const events = pruned.map((id) => {
          cfg.store.delete(id);
          const record = records.require(id);
          const updated = records.put({ ...record, status: 'pruned' }, record.version);
          return platformEvent('platform.backup.pruned', 'backup', id, updated.version, { backupId: id });
        });
        return { result: { pruned }, events };
      });
    }),

    operation({ name: 'platform.backup.list', kind: 'query', flag: FLAG, summary: 'List backups (newest first)' }, emptySchema, (ctx) => {
      authorize(deps, ctx, PERM.backupRead);
      return records
        .list()
        .sort((a, b) => b.createdAt - a.createdAt || (a.id < b.id ? 1 : -1))
        .map(backupDto);
    }),
  ];
}
