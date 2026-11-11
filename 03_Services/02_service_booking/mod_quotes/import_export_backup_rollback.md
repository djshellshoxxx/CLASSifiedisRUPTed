# PS-032-10 — Import, export, backup and rollback: Service quotes and booking

**Status:** SPECIFIED (Stage 3). **Module:** [F03.S02.M01 Service quotes and booking](SPEC.md) · **Scope:** MVP · **Code:** `packages/services/src/service_booking/quotes` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-032-10.R01** The vault export contains requests, quotes, bookings and all signed statements with their cids so evidence survives vault loss.
- **PS-032-10.R02** Import verifies every statement signature and cid before restoring; unverifiable items are kept as read-only history.
- **PS-032-10.R03** Schema changes follow expand and contract and keep v1 readable for 180 days.

## Specification

- **export:** ExportSectionPort section services.bookings in classrup-export/v1 with request, quote and booking lines plus a statements array of the original envelopes and consent statements.
- **import:** Verified terminal records import as history; open requests and quotes import as expired; awaiting_confirmation bookings import as is and the confirmation timeout runs at once, so an expired one is cancelled with a signed confirmation_timeout statement rather than silently; confirmed, in_progress, conflicted and disputed bookings import as is.
- **backup:** The vault export is the primary backup (IOX-6); relays hold only ciphertext mailboxes (IOX-7).
- **migration rollback:** Additive optional fields only in v1; rollback is safe because statements are immutable and older readers ignore unknown fields.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-032-09.T14 | integration | PS-032-10.R01, PS-032-10.R02, PS-032-10.R03 | export, import into fresh vault, restore | records round-trip identical; in-flight statements re-enter outbox as prepared |

## Dependencies

Module depends on: F03.S01.M01, F03.S01.M02, F08.S01.M01, F08.S01.M03, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M03, F09.S03.M01, F09.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
