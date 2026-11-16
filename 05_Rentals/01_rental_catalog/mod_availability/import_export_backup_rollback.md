# PS-039-10 — Import, export, backup and rollback: Rental availability

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M01 Rental availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-039-10.R01** The vault export contains offerings, reservations and all signed statements with their cids so evidence survives vault loss.
- **PS-039-10.R02** Import verifies every signature and cid before restoring; unverifiable items stay read-only history; overlap is re-validated for confirmed reservations and violations are frozen.
- **PS-039-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** Section rentals.reservations in classrup-export/v1 with offering, reservation lines and the original statement envelopes.
- **import:** Verified terminal records import as history; requested reservations import as expired so no stale claim is restored; confirmed, in_use and overdue reservations import as is after the overlap re-check.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext mailboxes and signed public projections (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback is safe because statements are immutable and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-039-09.T15 | integration | PS-039-10.R01, PS-039-10.R02, PS-039-10.R03 | export, import into fresh vault, restore | records round-trip; in-flight requests re-enter outbox; open requests import as expired |

## Dependencies

Module depends on: F01.S01.M01, F09.S01.M01, F09.S03.M01, F08.S01.M01, F07.S01.M01, F07.S02.M02, F11.S01.M03, F06.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
