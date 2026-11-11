# PS-055-10 — Import, export, backup and rollback: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-10.R01** The vault export contains the owner's document history and the documents of contacts, each with provenance, so the identity can move between relays and devices.
- **PS-055-10.R02** Import re-verifies every signature, possession proof, chain and size, keeps valid documents with their original provenance and firstSeenAt and rejects invalid ones with a report.
- **PS-055-10.R03** Schema changes follow expand/contract with v1 readable for 180 days, and a new major carries a signed migration statement.

## Specification

- **export:** Section identity.portable_docs in classrup-export/v1 (schema classrup.identity.portable_doc/v1), own history and received documents with provenance, firstSeenAt and revokedUnion.
- **import:** Each document is verified; valid ones are stored with origin received or own (when the DID matches the vault principal); a chain gap follows the gap rule and is reported; revokedUnion entries from the export are merged, never removed.
- **backup:** The vault export is the primary backup (IOX-6); relay backups (IOX-3, IOX-7) hold public documents only, so losing a relay loses nothing the owner cannot republish.
- **migration rollback:** Additive optional fields in v1 under ext only; rollback is safe because verifiers ignore unknown ext keys and the signature covers them.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T15 | integration | PS-055-10.R01, PS-055-10.R02, PS-055-10.R03 | export, import in a fresh vault, relay backup restore, and a document with an unknown ext key | documents round-trip with provenance and firstSeenAt; invalid signatures rejected on import; unknown ext keys ignored and covered by the signature |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M03, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
