/**
 * @classrup/privacy (F10): consent, retention and legal holds, data export, deletion and the
 * privacy threat/model/metadata toolkit.
 *
 * Relay wiring:
 *  - For every feature call `privacy.registerExporter(area, accountId => JsonValue)` and
 *    `privacy.registerEraser(area, accountId => { erased, retained })` once at startup. The
 *    `privacy` area (consents, exports) is registered here. Identity: see @classrup/identity index docs.
 *  - Schedule `privacy.export.expire_due` and `privacy.deletion.process_due` with a system actor.
 *  - Other features call `consent.hasConsent(accountId, purpose)` before optional processing,
 *    `retention.assertNotHeld(tenantId, 'record', id)` before purging, and use the exported
 *    metadata utilities (`filterByDisclosure`, `coarsenTimestamp`, `truncateIp`, `assertNoSensitiveKeys`).
 */
import type { Deps, Operation } from '@classrup/kernel';
import { createThreatsView } from './boundaries/view';
import { createConsentService } from './consent/consent';
import { eraseOwnData, exportOwnData, PRIVACY_AREA } from './data/builtin';
import { createDeletionService } from './data/delete';
import { createExportService } from './data/export';
import type { PrivacyEnv } from './env';
import { buildOperations } from './operations';
import type { PrivacyServices } from './operations';
import type { PrivacyPorts } from './ports';
import { resolvePorts } from './ports';
import { openStores } from './records';
import { DataRegistry } from './registry';
import type { Eraser, Exporter } from './registry';
import { createRetentionService } from './retention/retention';

export interface Privacy extends PrivacyServices {
  registerExporter(area: string, exporter: Exporter): void;
  registerEraser(area: string, eraser: Eraser): void;
  readonly operations: readonly Operation[];
}

export function createPrivacy(deps: Deps, ports: PrivacyPorts = {}): Privacy {
  const registry = new DataRegistry();
  const env: PrivacyEnv = { deps, ports: resolvePorts(ports), stores: openStores(deps), registry };
  registry.registerExporter(PRIVACY_AREA, (accountId) => exportOwnData(env, accountId));
  registry.registerEraser(PRIVACY_AREA, (accountId) => eraseOwnData(env, accountId));
  const retention = createRetentionService(env);
  const services: PrivacyServices = {
    consent: createConsentService(env),
    retention,
    exports: createExportService(env),
    deletion: createDeletionService(env, retention),
    boundaries: createThreatsView(env),
  };
  return {
    ...services,
    registerExporter: (area, exporter) => registry.registerExporter(area, exporter),
    registerEraser: (area, eraser) => registry.registerEraser(area, eraser),
    operations: buildOperations(services),
  };
}

export { POLICIES } from './policies';
export { MODULES } from './modules';
export { COLLECTIONS } from './records';
export { EVENTS as PRIVACY_EVENTS, FLAGS as PRIVACY_FLAGS } from './env';
export { CONSENT_PURPOSES } from './records';
export type { ConsentPurpose, ConsentDecision, DeletionStatus, ExportStatus, ExportManifest, DeletionReport, RetainedItem } from './records';
export type { PrivacyPorts } from './ports';
export type { Eraser, EraserResult, Exporter } from './registry';
export { DEFAULT_RETENTION, RETENTION_BOUNDS, computeExpiry, describeRule } from './retention/retention';
export type { RetentionRule, RetentionTable, SweepItem, SweepPlan, HoldDto } from './retention/retention';
export { DELETION_GRACE_MS, DELETION_TRANSITIONS } from './data/delete';
export type { DeletionDto, ProcessSummary } from './data/delete';
export { EXPORT_TTL_MS } from './data/export';
export type { ExportBundle, ExportDto } from './data/export';
export type { ConsentStateDto, ConsentEntryDto } from './consent/consent';
export { filterByDisclosure, coarsenTimestamp, truncateIp, assertNoSensitiveKeys, findSensitiveKeys, isSensitiveKey } from './boundaries/metadata';
export type { TimestampGranularity } from './boundaries/metadata';
export { canDisclose, ASSETS, ADVERSARIES, TRUST_BOUNDARIES, VIEWER_RELATIONS, DISCLOSURE_CLASSES, describeModel } from './boundaries/model';
export type { ViewerRelation, Asset, Adversary, TrustBoundary, ModelDescription } from './boundaries/model';
export { THREATS, validateThreatRegister } from './boundaries/threats';
export type { Threat, CodeRef } from './boundaries/threats';
