import { defineModules } from '@classrup/kernel';
import { EVENTS, FLAGS } from './env';
import { COLLECTIONS } from './records';

export const MODULES = defineModules([
  {
    id: 'F10.S01.M01',
    path: '10_Privacy/01_data_controls/mod_consent',
    flag: FLAGS.consent,
    summary: 'Purpose-based consent with policy version, append-only history and hasConsent for other features',
    permissions: ['privacy.consent:grant', 'privacy.consent:withdraw', 'privacy.consent:read'],
    events: [EVENTS.consentGranted, EVENTS.consentWithdrawn],
    collections: [COLLECTIONS.consentLog, COLLECTIONS.consentState],
  },
  {
    id: 'F10.S01.M02',
    path: '10_Privacy/01_data_controls/mod_retention',
    flag: FLAGS.retention,
    summary: 'Retention table per class with bounded tenant overrides, legal holds and a sweep planner',
    permissions: ['privacy.retention:read', 'privacy.retention:configure', 'privacy.retention:plan', 'privacy.hold:manage'],
    events: [EVENTS.retentionPolicyChanged, EVENTS.holdPlaced, EVENTS.holdReleased],
    collections: [COLLECTIONS.retention, COLLECTIONS.holds],
  },
  {
    id: 'F10.S01.M03',
    path: '10_Privacy/01_data_controls/mod_export',
    flag: FLAGS.export,
    summary: 'Owner-only data export via an exporter registry; hashed manifest; seven-day availability',
    permissions: ['privacy.export:request', 'privacy.export:read', 'privacy.export:download', 'privacy.export:expire'],
    events: [EVENTS.exportRequested, EVENTS.exportAvailable, EVENTS.exportFailed, EVENTS.exportDownloaded, EVENTS.exportExpired],
    collections: [COLLECTIONS.exports],
  },
  {
    id: 'F10.S01.M04',
    path: '10_Privacy/01_data_controls/mod_delete',
    flag: FLAGS.delete,
    summary: 'Deletion workflow with seven-day grace, legal-hold blocking, registered erasers and a retained-data report',
    permissions: ['privacy.deletion:request', 'privacy.deletion:read', 'privacy.deletion:cancel', 'privacy.deletion:process'],
    events: [EVENTS.deletionRequested, EVENTS.deletionCancelled, EVENTS.deletionBlocked, EVENTS.deletionCompleted, EVENTS.deletionFailed],
    collections: [COLLECTIONS.deletions],
  },
  {
    id: 'F10.S02.M01',
    path: '10_Privacy/02_security_boundaries/mod_threat',
    flag: FLAGS.threat,
    summary: 'Typed threat register with mitigations, code references and residual risk',
    permissions: ['privacy.threat:read'],
    events: [],
    collections: [],
  },
  {
    id: 'F10.S02.M02',
    path: '10_Privacy/02_security_boundaries/mod_model',
    flag: FLAGS.model,
    summary: 'Typed privacy model: assets, adversaries, trust boundaries and the disclosure matrix',
    permissions: ['privacy.model:read'],
    events: [],
    collections: [],
  },
  {
    id: 'F10.S02.M03',
    path: '10_Privacy/02_security_boundaries/mod_metadata',
    flag: FLAGS.metadata,
    summary: 'Metadata minimisation utilities: filterByDisclosure, coarsenTimestamp, truncateIp, assertNoSensitiveKeys',
    permissions: [],
    events: [],
    collections: [],
  },
]);
