# PS-042-02 — Validation rules: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-02.R01** Statements are validated in the order schema, signature, signer role, referenced reservation and report cids, staleness, window, evidence, business rules, and the first failure decides the error.
- **PS-042-02.R02** Report content limits are enforced before signing in the vault and again on receipt, including the decrypted photo bytes.
- **PS-042-02.R03** Every violation maps to one stable error code; quarantined statements store the code.
- **PS-042-02.R04** Inbound statements are judged against their signed createdAt - inside the pickup window and received within 72 hours of createdAt - while local commands use the local clock, so a statement signed on time is never rejected for late delivery within the bound.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | statement signature verifies and signer is the owner or renter of the reservation | RENTALS_STATEMENT_INVALID |
| V02 | window: a local command runs between startsAt − 2 h and startsAt + 24 h by the local clock; an inbound statement has createdAt in that window, not later than receipt + 5 min, and is received within 72 h of createdAt | RENTALS_HANDOFF_WINDOW |
| V03 | checklist has 1..30 items whose ids come from the reservation checklistTemplate, photos at most 20 each referencing a MediaBlob id, notes at most 1000 code points | VALIDATION_FAILED |
| V04 | attestation or changes request names the cid of the latest report revision | RENTALS_REPORT_STALE |
| V05 | changeRounds is below 5 | RENTALS_CHANGE_LIMIT |
| V06 | readings have at most 5 entries with finite numbers | VALIDATION_FAILED |
| V07 | an attestation by the same signer for the same cid does not already exist | CONFLICT_STATE |
| V08 | attestation or changes request is signed by the party that did not author the report | RENTALS_STATEMENT_INVALID |
| V09 | each photo is at most 5 MiB (5 242 880 bytes) after processing | COMMS_ATTACHMENT_TOO_LARGE |
| V10 | before attest or request_changes, every photo the report references is fetched, decrypted, SHA-256 verified against its MediaBlob id and stored locally | RENTALS_EVIDENCE_MISSING |
| V11 | decrypted photo bytes carry no EXIF, XMP or GPS metadata (F10.S02.M03 verification check) | RENTALS_PHOTO_METADATA |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T01 | unit | PS-042-01.R01, PS-042-01.R02, PS-042-01.R03, PS-042-02.R03 | build a report with 20 photos, strip metadata through F10.S02.M03 before encryption, sign it | MediaBlob ids computed over the stripped bytes; no metadata in stored or sent bytes; cid stable |
| TEST-PS-042-09.T02 | unit | PS-042-02.R02, PS-042-02.R03 | each rule V01–V11 violated in turn with every other check passing | the documented code is returned and nothing stored; bad statements quarantined with that code |
| TEST-PS-042-09.T16 | unit | PS-042-02.R01 | inbound attestation with a bad signature naming a stale cid; inbound attestation signed by the author with a createdAt outside the window | RENTALS_STATEMENT_INVALID for both; the staleness and window failures are never reported |
| TEST-PS-042-09.T17 | integration | PS-042-02.R04, PS-042-03.R04 | two vaults - attestation signed at +23 h delivered at +25 h; both parties sign at +1 h and the signatures arrive at +30 h; a statement signed at +20 h delivered at +100 h | first two attested in both vaults with no expiry or cancellation in either; the third refused with RENTALS_HANDOFF_WINDOW |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
