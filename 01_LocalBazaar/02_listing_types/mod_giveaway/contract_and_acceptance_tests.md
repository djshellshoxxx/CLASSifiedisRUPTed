# PS-005-09 — Contract and acceptance tests: Giveaway listing type

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S02.M03 Giveaway listing type](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/listing_types/giveaway` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-005-09.R01** Every requirement is covered by at least one automated test.
- **PS-005-09.R02** Contract tests validate statements, commands and the recipient_selected event against the registry and verify signatures.
- **PS-005-09.R03** Anti-hoarding limits and ordering are tested with injected clock and receipt sequence.

## Specification

See the module test table below (all processes).

**Fixtures:** Giver vault G with giveaway listing L (quantity 2, first_come, queueLimit 50) and its verified projection mirrored in requester vaults R1..R4 (R4 blocked by G), 200 fresh requester keys, a key K that is not the listing author, second giveaway L2, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-005-09.T01 | unit | PS-005-01.R01, PS-005-01.R03, PS-005-02.R03 | define terms and receive a valid request | records stored; counters derived from stored requests |
| TEST-PS-005-09.T02 | unit | PS-005-01.R02, PS-005-07.R01 | inspect projection, relay payload and logs | notes and queue only in encrypted statements; projection has mode, queueLimit and closesAt only |
| TEST-PS-005-09.T03 | unit | PS-005-02.R01, PS-005-02.R02 | violate each rule V01-V13 | documented error code returned; blocked requester dropped silently with no error to peer |
| TEST-PS-005-09.T04 | property | PS-005-03.R01, PS-005-03.R02, PS-005-03.R03 | random commands, withdrawals and clock advances | only declared transitions; selected implies active hold; terminal states never regress |
| TEST-PS-005-09.T05 | integration | PS-005-03.R02, PS-005-06.R02 | two tabs select different requests for last unit | one selected, other BAZAAR_GIVEAWAY_NOT_SELECTABLE |
| TEST-PS-005-09.T06 | integration | PS-005-03.R03 | selected recipient does not collect for 72 h | request expired, hold released, second selection possible |
| TEST-PS-005-09.T07 | contract | PS-005-01.R04, PS-005-04.R01, PS-005-04.R03, PS-005-09.R02 | request, select, decline, withdraw run in both vaults | statements validate and verify; recipient_selected payload has no notes; stored records validate as classrup.bazaar.giveaway_request_record/v1 with localRole giver or requester and never as the statement schema |
| TEST-PS-005-09.T08 | integration | PS-005-04.R02, PS-005-05.R02 | statement with wrong signer, tampered body, unknown schema | all quarantined with reasons; none queued |
| TEST-PS-005-09.T09 | abuse | PS-005-05.R01, PS-005-05.R03 | non-giver selects; relay reads mailbox | FORBIDDEN; relay holds ciphertext only |
| TEST-PS-005-09.T10 | integration | PS-005-06.R01, PS-005-06.R03 | replay select with same key; fail signing | one selection; failure rolls back hold |
| TEST-PS-005-09.T11 | chaos | PS-005-06.R03 | giver offline 3 days, relay mailbox holds requests | processed in receipt order on unlock with tie groups per sync batch; requester sees pending until signed receipt |
| TEST-PS-005-09.T12 | abuse | PS-005-02.R03, PS-005-07.R03 | requester sends 4th pending request and 6th collection within 7 days; 21 requests in an hour | BAZAAR_GIVEAWAY_LIMIT and RATE_LIMITED; the rejected requester learns nothing about the queue |
| TEST-PS-005-09.T13 | abuse | PS-005-07.R02 | terminal request older than 30 days | note purged, evidence fields retained |
| TEST-PS-005-09.T14 | load | PS-005-08.R01, PS-005-08.R02, PS-005-08.R03 | 200 queued requests on Moto G profile | select p95 <= 120 ms, receive p95 <= 80 ms, list p95 <= 150 ms, no telemetry |
| TEST-PS-005-09.T15 | unit | PS-005-09.R01, PS-005-09.R03 | traceability tool run | every PS-005 requirement maps to a passing test |
| TEST-PS-005-09.T16 | integration | PS-005-10.R01, PS-005-10.R02, PS-005-10.R03 | export, import to fresh vault, import request with invalid signature | round-trip identical; invalid signature quarantined; selected imports as expired if past selectedUntil |
| TEST-PS-005-09.T17 | abuse | PS-005-04.R04, PS-005-03.R04 | R1 receives a selection signed by K, then a valid selection of its older withdrawn request replayed against its new request, then a valid selection | first two quarantined (signer_not_listing_author, binding_mismatch) and the request stays pending; the valid one moves it to selected with selectedUntil; expiry by R1's clock afterwards |
| TEST-PS-005-09.T18 | abuse | PS-005-03.R05 | 200 fresh keys send requests within 60 s to L | at most 25 queued (50 % of queueLimit), all in one tie group ordered by the recorded draw, no selection until the giver confirms the proposed pick; queue label states relays can influence order |
| TEST-PS-005-09.T19 | integration | PS-005-07.R03 | R1 and R2 each request L; R1 calls list_mine and the giver calls list_for_listing | R1 sees only its own request; only the giver vault returns the queue |
| TEST-PS-005-09.T20 | integration | PS-005-02.R04 | R1 requests after the verified projection's closesAt, and after its tombstone was applied | BAZAAR_GIVEAWAY_CLOSED in the requester vault without contacting the giver; pending request expires on tombstone |
| TEST-PS-005-09.T21 | integration | PS-005-07.R04 | export sections, deletion plan and retention purge through the F10 ports, then privacy.deletion.completed for R2 | sections present with field classes; R2's DID replaced by the pseudonym in retained requests and notes purged |

## Acceptance criteria

- All tests T01-T21 pass in CI.
- A recipient is never shown as selected before a selection statement signed by the listing author for that exact request is verified, and handover is never described as proven.
- Per-requester limits and the fresh-key share hold under retries, replays, Sybil swarms and concurrent tabs.

## Dependencies

Module depends on: F01.S01.M01, F01.S03.M01, F07.S02.M02, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
