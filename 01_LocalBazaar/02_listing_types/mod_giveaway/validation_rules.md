# PS-005-02 — Validation rules: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-02.R01** Incoming request statements are verified before queueing: signature, signer, schema, listing state, block lists and caps.
- **PS-005-02.R02** Selection is validated against queue state, available quantity and the anti-hoarding limits.
- **PS-005-02.R03** Every violation maps to one stable error code; blocked requesters get a silent drop, not a revealing error.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | request envelope signature verifies, author equals requesterId, schema classrup.bazaar.giveaway_request/v1 | VALIDATION_FAILED |
| V02 | giveaway is published, not past closesAt, and queue has fewer than queueLimit pending requests | BAZAAR_GIVEAWAY_CLOSED |
| V03 | requester has no live request on this listing | BAZAAR_GIVEAWAY_DUPLICATE_REQUEST |
| V04 | requester is not blocked by the giver (F07.S02.M02) and is not the giver | BLOCKED_PARTY |
| V05 | requester has at most 3 pending and 2 uncollected selected requests with this giver | BAZAAR_GIVEAWAY_LIMIT |
| V06 | requester has collected fewer than 5 items from this giver in the last 7 days | BAZAAR_GIVEAWAY_LIMIT |
| V07 | note <= 280 code points; quantity 1..10 | VALIDATION_FAILED |
| V08 | select targets a pending request and quantity <= available stock | BAZAAR_GIVEAWAY_NOT_SELECTABLE |
| V09 | closesAt between 1 h and 30 d from now; queueLimit 1..200 | VALIDATION_FAILED |
| V10 | expectedRevision matches | CONFLICT_REVISION |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T01 | unit | PS-005-01.R01, PS-005-01.R03, PS-005-02.R03 | define terms and receive a valid request | records stored; counters derived from stored requests |
| TEST-PS-005-09.T03 | unit | PS-005-02.R01, PS-005-02.R02 | violate each rule V01-V10 | documented error code returned; blocked requester dropped silently with no error to peer |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
