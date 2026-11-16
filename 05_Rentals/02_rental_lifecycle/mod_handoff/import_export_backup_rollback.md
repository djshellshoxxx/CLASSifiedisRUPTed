# PS-042-10 — Import, export, backup and rollback: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-10.R01** The vault export contains handoffs, report revisions, attestations and photo references with hashes; photo bytes are exported by user choice as encrypted attachments.
- **PS-042-10.R02** Import verifies every signature and cid before restoring; unverifiable items stay read-only history.
- **PS-042-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section rentals.handoffs in classrup-export/v1; one line per RentalHandoff with the signed envelopes of each report revision and attestation.
- **import:** Attested handoffs import as history; drafting and awaiting_counterparty handoffs import as is if the reservation is confirmed, otherwise as cancelled.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback is safe because statements are immutable and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T14 | integration | PS-042-10.R01, PS-042-10.R02, PS-042-10.R03 | export, import into fresh vault, restore | reports, attestations and photo references round-trip; missing attachments shown as missing |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M03, F07.S01.M01, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
