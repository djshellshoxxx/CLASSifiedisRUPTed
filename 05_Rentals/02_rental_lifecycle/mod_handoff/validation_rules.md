# PS-042-02 — Validation rules: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-02.R01** Statements are validated in the order schema, signature, signer role, referenced reservation and report cids, state, business rules.
- **PS-042-02.R02** Report content limits are enforced before signing in the vault and again on receipt.
- **PS-042-02.R03** Every violation maps to one stable error code; quarantined statements store the code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the owner or renter of the reservation | RENTALS_STATEMENT_INVALID |
| V02 | reservation is confirmed, and now is between startsAt minus 2 hours and startsAt plus 24 hours | RENTALS_HANDOFF_WINDOW |
| V03 | checklist has 1..30 items, photos at most 20, each photo has a SHA-256 and metadata-stripped flag, notes at most 1000 code points | VALIDATION_FAILED |
| V04 | attestation or changes request names the cid of the latest report and comes from the party that did not author it | RENTALS_REPORT_STALE |
| V05 | changeRounds is below 5 | RENTALS_CHANGE_LIMIT |
| V06 | readings have at most 5 entries with finite numbers | VALIDATION_FAILED |
| V07 | an attestation by the same signer for the same cid does not already exist | CONFLICT_STATE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T01 | unit | PS-042-01.R01, PS-042-01.R02, PS-042-01.R03, PS-042-02.R03 | build a report with 20 photos, strip EXIF, sign it | hashes computed after stripping; no GPS in stored bytes; cid stable |
| TEST-PS-042-09.T02 | unit | PS-042-02.R01, PS-042-02.R02 | each rule V01–V07 violated in turn | documented code returned and nothing stored; bad statements quarantined |
| TEST-PS-042-09.T15 | e2e | PS-042-01.R01, PS-042-02.R01 | mobile owner and renter complete a handoff in two browsers | both show attested with the same fingerprint; axe zero serious issues |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
