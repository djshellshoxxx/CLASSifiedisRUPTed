/**
 * F10.S01.M03 data export. Every feature registers an exporter for its own area; a request builds a
 * JSON bundle with a manifest of per-section SHA-256 hashes so the person can verify completeness.
 * Only the account owner can request and download. A bundle stays available for seven days, then
 * its personal data is dropped and only the manifest remains. If any exporter fails the export is
 * marked failed instead of delivering an incomplete bundle that looks complete.
 */
import type { CommandContext, JsonValue } from '@classrup/kernel';
import { assertTransition, conflict, DAY, isDomainError, notFound, parse, precondition, runCommand, schemas, z } from '@classrup/kernel';
import { contentHash } from '@classrup/security';
import type { PrivacyEnv } from '../env';
import { authorize, checkFlag, EVENTS, event, FLAGS, ownerRef } from '../env';
import type { ExportManifest, ExportRecord, ExportStatus } from '../records';

export const EXPORT_TTL_MS = 7 * DAY;
export const EXPORT_FORMAT_VERSION = 1;

const TRANSITIONS: Readonly<Record<ExportStatus, readonly ExportStatus[]>> = {
  requested: ['available', 'failed'],
  available: ['expired'],
  failed: [],
  expired: [],
};

export interface ExportDto {
  readonly id: string;
  readonly status: ExportStatus;
  readonly requestedAt: number;
  readonly availableUntil?: number;
  readonly manifest?: ExportManifest;
  readonly failedAreas?: readonly string[];
  readonly downloads: number;
  readonly version: number;
}

export interface ExportBundle {
  readonly manifest: ExportManifest;
  readonly sections: Readonly<Record<string, JsonValue>>;
}

const downloadSchema = z.object({ exportId: schemas.id('dexp') }).strict();

export interface ExportService {
  request(ctx: CommandContext): ExportDto;
  status(ctx: CommandContext): ExportDto[];
  download(ctx: CommandContext, input: z.input<typeof downloadSchema>): ExportBundle;
  expireDue(ctx: CommandContext): { expired: number };
}

const toDto = (r: ExportRecord): ExportDto => ({
  id: r.id,
  status: r.status,
  requestedAt: r.requestedAt,
  ...(r.availableUntil !== undefined ? { availableUntil: r.availableUntil } : {}),
  ...(r.manifest !== undefined ? { manifest: r.manifest } : {}),
  ...(r.failedAreas !== undefined ? { failedAreas: r.failedAreas } : {}),
  downloads: r.downloads,
  version: r.version,
});

export const isLiveExport = (r: ExportRecord, now: number): boolean =>
  r.status === 'requested' || (r.status === 'available' && r.availableUntil !== undefined && now < r.availableUntil);

export function createExportService(env: PrivacyEnv): ExportService {
  const { deps, stores, ports, registry } = env;

  function collectSections(accountId: string): { sections: Record<string, JsonValue>; failedAreas: string[] } {
    const sections: Record<string, JsonValue> = {};
    const failedAreas: string[] = [];
    for (const [area, exporter] of registry.exporters()) {
      try {
        sections[area] = exporter(accountId);
      } catch (e) {
        failedAreas.push(area);
        deps.logger.log('warn', 'exporter failed', { area, code: isDomainError(e) ? e.code : 'UNEXPECTED' });
      }
    }
    return { sections, failedAreas };
  }

  function manifestFor(record: ExportRecord, sections: Record<string, JsonValue>, now: number): ExportManifest {
    const entries = Object.entries(sections).map(([area, value]) => ({ area, contentHash: contentHash(value) }));
    return {
      exportId: record.id,
      accountId: record.accountId,
      formatVersion: EXPORT_FORMAT_VERSION,
      generatedAt: now,
      availableUntil: now + EXPORT_TTL_MS,
      sections: entries,
      bundleHash: contentHash(entries),
    };
  }

  const ownerResource = (ctx: CommandContext, id?: string) => ownerRef('export', ctx.actor.id, ctx.actor.tenantId, id);

  return {
    request(ctx) {
      authorize(env, ctx, 'privacy.export:request', ownerResource(ctx));
      return runCommand(deps, ctx, { name: 'privacy.export.request', flag: FLAGS.export }, () => {
        const now = deps.clock.now();
        const active = stores.exports.list((r) => r.accountId === ctx.actor.id && isLiveExport(r, now));
        if (active.length > 0) throw conflict('PRIVACY.EXPORT_ACTIVE', 'an export is already available; download it or wait until it expires', { exportId: active[0]?.id ?? '' });

        const id = deps.ids.next('dexp');
        const requested = stores.exports.put(
          { id, tenantId: ctx.actor.tenantId, accountId: ctx.actor.id, status: 'requested', requestedAt: now, downloads: 0 },
          0,
        );
        const { sections, failedAreas } = collectSections(ctx.actor.id);
        const outcome: ExportStatus = failedAreas.length > 0 ? 'failed' : 'available';
        assertTransition('PRIVACY', requested.status, outcome, TRANSITIONS);
        const finished =
          outcome === 'available'
            ? stores.exports.put({ ...requested, status: 'available', sections, manifest: manifestFor(requested, sections, now), availableUntil: now + EXPORT_TTL_MS }, requested.version)
            : stores.exports.put({ ...requested, status: 'failed', failedAreas }, requested.version);
        if (outcome === 'available') {
          deps.store.afterCommit(() =>
            ports.notifier.notify({
              tenantId: ctx.actor.tenantId,
              recipientId: ctx.actor.id,
              topic: 'privacy.export',
              template: 'privacy.export_ready',
              data: { availableUntil: now + EXPORT_TTL_MS },
            }),
          );
        }
        const done =
          outcome === 'available'
            ? event(EVENTS.exportAvailable, 'export', id, finished.version, { exportId: id, accountId: ctx.actor.id, availableUntil: now + EXPORT_TTL_MS })
            : event(EVENTS.exportFailed, 'export', id, finished.version, { exportId: id, accountId: ctx.actor.id, failedAreas });
        return {
          result: toDto(finished),
          events: [event(EVENTS.exportRequested, 'export', id, requested.version, { exportId: id, accountId: ctx.actor.id }), done],
        };
      });
    },

    status(ctx) {
      authorize(env, ctx, 'privacy.export:read', ownerResource(ctx));
      checkFlag(env, ctx, FLAGS.export);
      return stores.exports.list((r) => r.accountId === ctx.actor.id).sort((a, b) => b.requestedAt - a.requestedAt).map(toDto);
    },

    download(ctx, input) {
      const i = parse(downloadSchema, input);
      const found = stores.exports.get(i.exportId);
      if (!found || found.tenantId !== ctx.actor.tenantId) throw notFound('PRIVACY.EXPORT_NOT_FOUND', 'export not found');
      authorize(env, ctx, 'privacy.export:download', ownerResource(ctx, found.id));
      if (found.accountId !== ctx.actor.id) throw notFound('PRIVACY.EXPORT_NOT_FOUND', 'export not found');
      // The idempotency key is dropped on purpose: replaying would copy the whole bundle into the idempotency store.
      const { idempotencyKey: _dropped, ...withoutKey } = ctx;
      return runCommand(deps, withoutKey, { name: 'privacy.export.download', flag: FLAGS.export }, () => {
        const record = stores.exports.require(i.exportId);
        const now = deps.clock.now();
        if (record.status === 'expired' || (record.availableUntil !== undefined && now >= record.availableUntil)) {
          throw conflict('PRIVACY.EXPORT_EXPIRED', 'export is no longer available; request a new one');
        }
        if (record.status !== 'available' || !record.manifest || !record.sections) throw precondition('PRIVACY.EXPORT_NOT_READY', 'export has no downloadable bundle');
        const stored = stores.exports.put({ ...record, downloads: record.downloads + 1 }, record.version);
        return {
          result: { manifest: record.manifest, sections: record.sections },
          events: [event(EVENTS.exportDownloaded, 'export', record.id, stored.version, { exportId: record.id, accountId: record.accountId })],
        };
      });
    },

    expireDue(ctx) {
      authorize(env, ctx, 'privacy.export:expire', { type: 'export', tenantId: ctx.actor.tenantId });
      return runCommand(deps, ctx, { name: 'privacy.export.expire_due', flag: FLAGS.export }, () => {
        const now = deps.clock.now();
        const due = stores.exports.list((r) => r.tenantId === ctx.actor.tenantId && r.status === 'available' && r.availableUntil !== undefined && r.availableUntil <= now);
        const events = due.map((r) => {
          assertTransition('PRIVACY', r.status, 'expired', TRANSITIONS);
          const { sections: _personalData, ...rest } = r;
          const stored = stores.exports.put({ ...rest, status: 'expired' }, r.version);
          return event(EVENTS.exportExpired, 'export', r.id, stored.version, { exportId: r.id, accountId: r.accountId });
        });
        return { result: { expired: due.length }, events };
      });
    },
  };
}
