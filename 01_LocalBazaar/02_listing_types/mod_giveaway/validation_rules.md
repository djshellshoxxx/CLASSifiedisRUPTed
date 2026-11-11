# PS-005-02 — Validation rules: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-02.R01** Incoming request statements are verified before queueing: signature, signer, schema, listing state, block lists and caps.
- **PS-005-02.R02** Selection is validated against queue state, available quantity and the anti-hoarding limits.
- **PS-005-02.R03** Every violation maps to one stable error code; blocked requesters get a silent drop, not a revealing error.
- **PS-005-02.R04** Each rule names the vault that runs it: the giver vault checks against its own records, the requester vault against the verified listing projection (F11.S01.M02 mirror view) and its own requests.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | giver vault receive: request envelope signature verifies, author equals requesterId, schema classrup.bazaar.giveaway_request/v1 | VALIDATION_FAILED |
| V02 | requester vault: the verified projection is a published giveaway before closesAt and not tombstoned; giver vault: giveaway is published, not past closesAt, and queue has fewer than queueLimit pending requests | BAZAAR_GIVEAWAY_CLOSED |
| V03 | both vaults: requester has no live request on this listing | BAZAAR_GIVEAWAY_DUPLICATE_REQUEST |
| V04 | both vaults: neither party blocks the other (F07.S02.M02 isBlockedEither) and requester is not the giver; the giver vault drops statements from blocked DIDs silently (N7) | BLOCKED_PARTY |
| V05 | giver vault: requester has at most 3 pending and 2 uncollected selected requests with this giver | BAZAAR_GIVEAWAY_LIMIT |
| V06 | giver vault: requester has collected fewer than 5 items from this giver in the last 7 days | BAZAAR_GIVEAWAY_LIMIT |
| V07 | both vaults: note <= 280 code points; quantity 1..10 | VALIDATION_FAILED |
| V08 | giver vault: select targets a pending request and quantity <= available stock | BAZAAR_GIVEAWAY_NOT_SELECTABLE |
| V09 | giver vault: closesAt between 1 h and 30 d from now; queueLimit 1..200 | VALIDATION_FAILED |
| V10 | both vaults: expectedRevision matches | CONFLICT_REVISION |
| V11 | giver vault receive: pending requests from keys never seen by this vault stay at most 50 % of queueLimit; further fresh-key requests are declined as full | BAZAAR_GIVEAWAY_LIMIT |
| V12 | requester vault receive: selection or decline signature verifies Ed25519 over JCS, the signer is the author did:key of the verified listing projection, the statement binds this requestId, requestCid and listingId (and selectedUntil for a selection), and its cid is new | VALIDATION_FAILED |
| V13 | giver vault: in first_come mode an automatic pick is applied only with one giver confirmation naming the proposed requestId | BAZAAR_GIVEAWAY_NOT_SELECTABLE |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T01 | unit | PS-005-01.R01, PS-005-01.R03, PS-005-02.R03 | define terms and receive a valid request | records stored; counters derived from stored requests |
| TEST-PS-005-09.T03 | unit | PS-005-02.R01, PS-005-02.R02 | violate each rule V01-V13 | documented error code returned; blocked requester dropped silently with no error to peer |
| TEST-PS-005-09.T12 | abuse | PS-005-02.R03, PS-005-07.R03 | requester sends 4th pending request and 6th collection within 7 days; 21 requests in an hour | BAZAAR_GIVEAWAY_LIMIT and RATE_LIMITED; the rejected requester learns nothing about the queue |
| TEST-PS-005-09.T20 | integration | PS-005-02.R04 | R1 requests after the verified projection's closesAt, and after its tombstone was applied | BAZAAR_GIVEAWAY_CLOSED in the requester vault without contacting the giver; pending request expires on tombstone |

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
