# PS-062-10 — Import, export, backup and rollback: Explicit consent capture

**Status:** SPECIFIED (Stage 3). **Module:** [F08.S02.M02 Explicit consent capture](SPEC.md) · **Scope:** MVP · **Code:** `packages/comms/src/negotiation/consent` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-062-10.R01** A user's vault export contains all consent statements they signed or received with provenance and first-seen time.
- **PS-062-10.R02** Import re-verifies every statement against keys and subjects present in the target vault using the firstSeenAt carried in the signed export manifest, never the import time, and quarantines those that cannot be verified.
- **PS-062-10.R03** Schema changes follow expand and contract; the signed payload field set is frozen in v1 and any change creates classrup.comms.consent/v2 with v1 readable for 180 days.

## Specification

- **export:** Section comms.consents in classrup-export/v1, registered through ExportSectionPort; one JSON line per ConsentStatement (schema classrup.comms.consent/v1) including the full signed envelope, aliases, provenance and firstSeenAt covered by the signed manifest.
- **import:** Each statement is re-verified with its exported firstSeenAt; existing cids are skipped; duplicates are re-resolved by the lowest-cid rule; statements failing verification are quarantined with a reason and never marked valid; statements are never re-signed.
- **backup:** The vault export is the backup (IOX-6); relays hold no consent data.
- **migration rollback:** The signed payload is never migrated in place; new versions are new schemas; rollback is safe because v1 statements remain valid and unknown future kinds are stored quarantined.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-062-09.T13 | integration | PS-062-10.R01, PS-062-10.R02, PS-062-10.R03 | export, import into fresh vault, restore from backup | statements round trip byte identical with firstSeenAt from the signed manifest and re-verify; tampered file entries are rejected |
| TEST-PS-062-09.T17 | integration | PS-062-02.R05, PS-062-10.R02 | key K of P1 revoked; a statement by K backdated before the revocation reaches P2 afterwards; P2 exports and re-imports after the revocation | the backdated statement is rejected; consents first seen before the revocation stay valid after import because firstSeenAt is restored from the manifest |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M02, F16.S02.M02, F16.S02.M03, F11.S01.M01, F11.S02.M01, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-COM-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
