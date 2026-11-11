# PS-057-10 — Import, export, backup and rollback: Trust evidence

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M02 Trust evidence](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/evidence` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-057-10.R01** The vault export contains attestations issued by the principal and about the principal and those the user kept, with signatures and endorsements.
- **PS-057-10.R02** Import re-verifies every signature, endorsement and kind rule, recomputes effective expiry from the import time capped by the original claim, and skips invalid statements with a report.
- **PS-057-10.R03** Schema changes follow expand/contract and keep v1 readable for 180 days.

## Specification

- **export:** Section identity.attestations in classrup-export/v1 (schema classrup.identity.attestation/v1) including statements, endorsements, cosignatures and revocations; visibility settings are included.
- **import:** Each statement is re-verified; invalid ones are reported and skipped; effectiveExpiresAt is recomputed from the import time; revoked statements import as revoked; relay_email_check claims are re-checked against the relay key set.
- **backup:** The vault export is the primary backup (IOX-6); relays store public statements only and operator audit logs follow RET-AUDIT (IOX-7).
- **migration rollback:** Additive optional fields in v1 under ext for signed statements; the kind value relay_email_check is new in v1 and an older reader shows it as a Signed claim; rollback is safe because older readers ignore unknown ext keys and the signature covers them.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-057-09.T14 | integration | PS-057-10.R01, PS-057-10.R02, PS-057-10.R03 | export, import in a fresh vault, tombstone after import, statement with an unknown ext key | statements re-verified and round-trip; tombstoned attestation becomes revoked; unknown ext ignored |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S03.M01, F15.S02.M01, F16.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
