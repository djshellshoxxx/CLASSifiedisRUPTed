// Spec-as-data model: loads the module catalog and per-module module.spec.yaml files (ADR-0015).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

export const PROCESSES = [
  ['01', 'domain_schema', 'Domain schema'],
  ['02', 'validation_rules', 'Validation rules'],
  ['03', 'workflow_state_machine', 'Workflow state machine'],
  ['04', 'commands_queries_events', 'Commands, queries and events'],
  ['05', 'authorization_capabilities', 'Authorization and capabilities'],
  ['06', 'failure_recovery_idempotency', 'Failure recovery and idempotency'],
  ['07', 'privacy_retention_abuse', 'Privacy, retention and abuse'],
  ['08', 'observability_performance', 'Observability and performance'],
  ['09', 'contract_and_acceptance_tests', 'Contract and acceptance tests'],
  ['10', 'import_export_backup_rollback', 'Import, export, backup and rollback'],
];

export const FEATURES = {
  F01: ['bazaar', 'LocalBazaar classifieds'], F02: ['mutiny', 'LocalMutiny barter and cyclic exchange'],
  F03: ['services', 'Services marketplace'], F04: ['auctions', 'Auctions'], F05: ['rentals', 'Rentals'],
  F06: ['discovery', 'Local discovery'], F07: ['identity', 'Identity and reputation'],
  F08: ['comms', 'Communications'], F09: ['commerce', 'Commerce and evidence'],
  F10: ['privacy', 'Privacy and data rights'], F11: ['federation', 'Federation and portability'],
  F12: ['moderation', 'Moderation and safety'], F13: ['notify', 'Notifications'],
  F14: ['i18n', 'Accessibility and localization'], F15: ['platform', 'Platform operations'],
  F16: ['security', 'Security architecture'], F17: ['quality', 'Quality engineering'],
  F18: ['governance', 'Governance and compliance'],
};

export const COMMON_ERRORS = new Set(['VALIDATION_FAILED', 'UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND',
  'CONFLICT_REVISION', 'CONFLICT_STATE', 'IDEMPOTENCY_KEY_REUSED', 'PRECONDITION_FAILED', 'EXPIRED',
  'RATE_LIMITED', 'FEATURE_DISABLED', 'PAYLOAD_TOO_LARGE', 'UNSUPPORTED_SCHEMA_VERSION', 'BLOCKED_PARTY',
  'DEPENDENCY_UNAVAILABLE', 'INTERNAL', 'ID_TIMESTAMP_SKEW']);

export const TEST_LEVELS = new Set(['unit', 'property', 'contract', 'integration', 'e2e', 'a11y', 'abuse', 'load', 'chaos', 'manual']);

export function featureOf(id) { return id.slice(0, 3); }
export function subfeatureOf(id) { return id.slice(0, 7); }
export function slugOf(id) { return FEATURES[featureOf(id)][0]; }

export function loadCatalog() {
  const doc = YAML.parse(readFileSync(join(ROOT, 'planning', 'modules.yaml'), 'utf8'));
  const byId = new Map();
  for (const m of doc.modules) byId.set(m.id, m);
  return byId;
}

export function contractIds() {
  return new Set(readdirSync(join(ROOT, 'planning', 'contracts')).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));
}

/** Loads module.spec.yaml for each catalog entry; returns { id -> {cat, spec|null, file, parseError} }. */
export function loadSpecs(catalog) {
  const out = new Map();
  for (const [id, cat] of catalog) {
    const file = join(ROOT, cat.path, 'module.spec.yaml');
    let spec = null; let parseError = null;
    if (existsSync(file)) {
      try { spec = YAML.parse(readFileSync(file, 'utf8')); } catch (e) { parseError = String(e.message || e); }
    }
    out.set(id, { cat, spec, file, parseError });
  }
  return out;
}

/** Splits a "a | b | c" row into trimmed cells. */
export function cells(row) { return String(row).split('|').map((s) => s.trim()); }

/** Global requirement ID for process index pp (e.g. '04') and local index i (0-based). */
export function reqId(ps, pp, i) { return `${ps}-${pp}.R${String(i + 1).padStart(2, '0')}`; }
