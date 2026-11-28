# PS-126-10 — Import, export, backup and rollback: Authorization policy

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M01 Authorization policy](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/authorization` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-126-10.R01** Relay operators can export role assignments and the audit log with its anchors as JSON lines, and the vault owner can export the local audit log.
- **PS-126-10.R02** Import of roles from another relay is never active; it creates imported_inactive records until an admin of the new relay activates them, which re-signs them with the new relay's key.
- **PS-126-10.R03** Audit schema changes follow expand/contract, keep v1 readable for 180 days and never break chain verification.

## Specification

- **export:** Sections security.roles and security.audit in the relay export (with anchors); vault export contains the local audit log only (quarantined statements are exported by F11.S01.M02).
- **import:** Audit imports are accepted only as a separate verified segment with its anchors and never merged into the live chain; role imports create imported_inactive records.
- **backup:** Covered by relay SQLite backup (CTR-IOX-001 IOX-3); restore re-verifies the chain against the latest anchor held by vaults or peers; the audit pepper is restored by the operator from the secret store (F16.S01.M02); vault audit is included in the vault export (IOX-6).
- **migration rollback:** Additive fields only in v1; entryHash covers JCS bytes of the v1 field set so added optional fields are excluded from the hash and rollback keeps the chain valid; new role and status values are read as no grant by older releases (fail closed).

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-126-09.T15 | integration | PS-126-10.R01, PS-126-10.R02, PS-126-10.R03 | export audit and roles, import into a fresh relay, restore backup | chain verifies after round trip; imported roles stay imported_inactive until activate_import by an admin of the new relay |

## Dependencies

Module depends on: F16.S01.M02, F10.S02.M02, CTR-CAP-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
