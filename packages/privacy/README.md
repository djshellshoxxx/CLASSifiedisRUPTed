# @classrup/privacy (F10)

Consent, retention and legal holds, data export, deletion, and the privacy threat model and metadata-minimisation toolkit. Area `privacy`, ID prefixes `cns dexp ddel hold`.

```ts
const privacy = createPrivacy(deps, { notifier });
privacy.registerExporter('bazaar', (accountId) => jsonValue);
privacy.registerEraser('bazaar', (accountId) => ({ erased: 3, retained: ['commerce_evidence:receipts, counterparties pseudonymised'] }));
privacy.consent.hasConsent(accountId, 'analytics');
privacy.retention.assertNotHeld(tenantId, 'record', recordId);
```

## Module map

| Module | Code | Tests |
|---|---|---|
| F10.S01.M01 consent | `src/consent/consent.ts` | `test/consent.test.ts` |
| F10.S01.M02 retention | `src/retention/retention.ts` | `test/retention.test.ts` |
| F10.S01.M03 export | `src/data/export.ts`, `registry.ts`, `builtin.ts` | `test/export.test.ts` |
| F10.S01.M04 delete | `src/data/delete.ts` | `test/delete.test.ts` |
| F10.S02.M01 threat | `src/boundaries/threats.ts`, `view.ts` | `test/boundaries.test.ts` |
| F10.S02.M02 model | `src/boundaries/model.ts` | `test/boundaries.test.ts` |
| F10.S02.M03 metadata | `src/boundaries/metadata.ts` | `test/boundaries.test.ts` |

`test/contract.test.ts` checks that every event is emitted and declared, payloads pass `assertNoSensitiveKeys`, and flags/permissions line up.

## Operations

| Operation | Kind | Permission |
|---|---|---|
| privacy.consent.grant / withdraw | C | privacy.consent:grant / withdraw (owner) |
| privacy.consent.list_mine / history | Q | privacy.consent:read |
| privacy.retention.get_policy | Q | privacy.retention:read |
| privacy.retention.set_policy | C | privacy.retention:configure (admin, system) |
| privacy.retention.plan_sweep | Q | privacy.retention:plan (system) |
| privacy.hold.place / release / list | C / C / Q | privacy.hold:manage (admin, system) |
| privacy.export.request | C | privacy.export:request (owner) |
| privacy.export.status | Q | privacy.export:read |
| privacy.export.download | C | privacy.export:download (owner) |
| privacy.export.expire_due | C | privacy.export:expire (system) |
| privacy.deletion.request / cancel | C | privacy.deletion:request / cancel (owner) |
| privacy.deletion.status | Q | privacy.deletion:read |
| privacy.deletion.process_due | C | privacy.deletion:process (system) |
| privacy.threat.catalog | Q | privacy.threat:read (signed in) |
| privacy.model.describe | Q | privacy.model:read (signed in) |

No operation is anonymous-safe.

## Collections and events

Collections: `privacy_consent_entries` (append-only), `privacy_consent_states`, `privacy_retention_policies`, `privacy_holds`, `privacy_exports`, `privacy_deletions`.

Events: `privacy.consent.{granted,withdrawn}`, `privacy.retention.policy_changed`, `privacy.hold.{placed,released}`, `privacy.export.{requested,available,failed,downloaded,expired}`, `privacy.deletion.{requested,cancelled,blocked,completed,failed}`.

Flags: `privacy.consent|retention|export|delete|threat|model|metadata`.

## Ports

Provided to other features: `consent.hasConsent`, `retention.assertNotHeld / activeHolds / expiryFor`, `registerExporter`, `registerEraser`, and the exported utilities `filterByDisclosure`, `coarsenTimestamp`, `truncateIp`, `assertNoSensitiveKeys`, `canDisclose`.

Consumed: `NotifyPort` (optional): `privacy.export_ready`, `privacy.deletion_scheduled`.

## Workflows

- Consent purposes: analytics, federation, notifications_email, notifications_push, location_precise, marketing.
- Retention defaults: ephemeral 1d, session 30d, content until deletion, commerce_evidence 7y, moderation 2y, audit 1y, legal_hold frozen. Fixed classes can be tuned by admins within `RETENTION_BOUNDS`.
- Export: request builds a bundle at once (`manifest` with per-section `contentHash` and `bundleHash`), available 7 days, one live export per account; a failing exporter makes the export `failed`.
- Deletion: `requested -> grace (7d) -> executing -> completed`; `blocked_by_hold` while a legal hold covers the account (re-evaluated by `process_due`); `failed` after an eraser throws (the attempt rolls back, `process_due` retries). Erasers return retained items as `<retentionClass>:<what>` and the report adds the policy reason.

## Limits

- `process_due` runs each request in its own transaction and does not forward an idempotency key; `export.download` drops its key so bundles never enter the idempotency store.
- The sweep planner only plans; each feature purges its own data.
- Export builds are synchronous and held in the record until expiry; encrypt storage at rest in the relay.
- Erasers must be idempotent and atomic on their own area (no savepoints in the store).
- Tests read source files with `node:fs` to verify threat register code references; `src/` has no `node:` imports.
