# PS-061-10 — Import, export, backup and rollback: Conversation threads

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S01.M02 Conversation threads](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/messaging/threads` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-061-10.R01** A user's vault export contains the threads they participate in with roster, thread-open statements and own mute settings.
- **PS-061-10.R02** Import validates thread IDs, schema version and thread-open signatures; threads with invalid signatures become quarantined read-only history.
- **PS-061-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section comms.threads in classrup-export/v1; one line per Thread (schema classrup.comms.thread/v1) including the exporting user's mute fields; the export is the primary backup (IOX-6).
- **import:** Active threads whose context record is absent from the target vault import as archived with reason context_closed; existing IDs are skipped; the mute fields of the importer are applied.
- **backup:** Vault export is the backup; relays hold no thread data (CTR-IOX-001 IOX-6, IOX-7).
- **migration rollback:** Additive fields only in v1; rolling back is safe because older readers ignore new optional fields; the IndexedDB index on (contextType, contextId) is created in the same version upgrade as the code that uses it.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-061-09.T15 | integration | PS-061-10.R01, PS-061-10.R02, PS-061-10.R03 | export, import into fresh vault and restore from backup | threads round trip identical; import rejects unknown participants as read-only |

## Dependencies

Module depends on: F07.S02.M02, F07.S01.M01, F01.S01.M01, F02.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
