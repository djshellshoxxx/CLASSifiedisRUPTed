# PS-116-10 — Import, export, backup and rollback: Offline outbox

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S01.M01 Offline outbox](SPEC.md) · **Scope:** MVP · **Code:** `apps/pwa/src/platform/offline` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-116-10.R01** The outbox is device-local transient state; its ExportSectionPort contributes section platform.outbox with counts per state and destination and no payloads (CTR-IOX-001 IOX-1, IOX-6), and the export contains the signed statements already committed in the domain records.
- **PS-116-10.R02** Outbox entries are never imported; after an import the user sees imported records only, and unsent statements must be re-created from the records.
- **PS-116-10.R03** Storage schema upgrades are forward-only through F15.S02.M03 migrations with data kept, and a downgrade of the app leaves the database untouched and ignores entries it cannot read.

## Specification

- **export:** Section platform.outbox in classrup-export/v1 holds counts per state and destination only, so a restored vault shows that queued work existed; the Outbox sheet offers 'Copy as JSON' of the user's own unsent entries for support, payloads included only after a confirmation dialog. The storage panel's Export now action calls F10.S01.M03 and then platform.storage.record_export.
- **import:** Not applicable: import (CTR-IOX-001 IOX-2) creates vault records and never writes outbox entries; an imported platform.outbox section is informational only.
- **backup:** The vault export is the primary backup (IOX-6) and the PWA warns after 30 days without one (7 days without persistent storage). The outbox itself is not backed up: unsent actions are lost if the browser profile is wiped, which the pending help text states. Relays never store the outbox.
- **migration rollback:** Outbox records follow F15.S02.M03 forward-only migrations (expand/contract); on a schema version greater than the app supports, the module opens read-only, refuses enqueue with UNSUPPORTED_SCHEMA_VERSION and keeps entries intact so rolling back the app release is safe.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-116-09.T20 | integration | PS-116-09.R02, PS-116-10.R01, PS-116-10.R02, PS-116-10.R03 | upgrade the F15.S02.M03 schema with entries present; export vault; erase vault | entries preserved on upgrade; export section platform.outbox has counts and no payloads; erase removes them; suite identical on fake-indexeddb, Chromium, WebKit, Firefox |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S02.M01, F15.S04.M03, F11.S01.M01, F10.S02.M02, F14.S02.M01, CTR-ID-001, CTR-IDM-001, CTR-ERR-001, CTR-PRV-001, CTR-UX-001, CTR-OBS-001, CTR-CAP-001, CTR-FED-001, CTR-IOX-001, CTR-EVT-001. Predecessor: [domain_schema.md](domain_schema.md).
