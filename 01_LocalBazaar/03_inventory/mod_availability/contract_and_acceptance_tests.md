# PS-008-09 — Contract and acceptance tests: Inventory availability

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S03.M01 Inventory availability](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/inventory/availability` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-008-09.R01** Every requirement is covered by at least one automated test.
- **PS-008-09.R02** Contract tests validate port inputs, outputs, events and the reservation statement against the schema registry.
- **PS-008-09.R03** The race and fork scenarios are covered by deterministic tests with injected clock and ids.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault of seller S with listing L (quantity 1) and listing M with variants V1 (quantity 3) and V2 (quantity 0), second device D2 of S, buyer vaults B1 and B2 with the verified projection of L, a key K that is not S, open Deal D for an offer on L, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-008-09.T01 | unit | PS-008-01.R01, PS-008-01.R02, PS-008-02.R01, PS-008-02.R02 | hold 1 of L; hold 1 more | first held with expiry, second BAZAAR_INVENTORY_INSUFFICIENT; available never negative |
| TEST-PS-008-09.T02 | unit | PS-008-01.R03, PS-008-07.R01 | read public projection and event payloads | no quantities or holder ids outside P2 events; projection has only in-stock boolean |
| TEST-PS-008-09.T03 | unit | PS-008-02.R03 | violate each rule V01-V15 | documented error code returned and no state change |
| TEST-PS-008-09.T04 | property | PS-008-03.R01, PS-008-03.R02 | random hold/release/renew/convert/clock sequences | only declared transitions; onHand >= reserved; converted exactly once |
| TEST-PS-008-09.T05 | integration | PS-008-03.R02, PS-008-06.R02 | two tabs hold the last unit concurrently | exactly one hold succeeds, other gets INSUFFICIENT |
| TEST-PS-008-09.T06 | integration | PS-008-03.R03, PS-008-06.R02 | D2 holds the same last unit offline then syncs | both holds frozen, conflict event with linkedDealIds emitted, convert refused with FROZEN until owner releases one |
| TEST-PS-008-09.T07 | contract | PS-008-04.R01, PS-008-04.R02, PS-008-09.R02 | each command and the reservation and release statements | outputs, events and statements validate; signature verifies with owner key |
| TEST-PS-008-09.T08 | integration | PS-008-04.R03, PS-008-07.R02 | reservation travels via relay mailbox | relay sees ciphertext and routing metadata only; no network call from hold/release/convert |
| TEST-PS-008-09.T09 | abuse | PS-008-05.R01, PS-008-05.R02, PS-008-05.R03 | UI-context dispatch of hold; peer statement signed by non-owner | FORBIDDEN; statement quarantined; relay has no policy row |
| TEST-PS-008-09.T10 | integration | PS-008-06.R01 | replay hold with same key and same holder with new key | same hold returned, units taken once |
| TEST-PS-008-09.T11 | chaos | PS-008-06.R03 | abort caller transaction after hold | hold rolled back with it; signing failure leaves valid hold and queued retry |
| TEST-PS-008-09.T12 | integration | PS-008-06.R01, PS-008-06.R03 | offline reservation issued | outbox prepared, UI text says not yet received; peer_accepted only after signed ack |
| TEST-PS-008-09.T13 | integration | PS-008-07.R03 | deal completed event then listing deleted | hold converted once; evidence kept per class; non-converted holds removed |
| TEST-PS-008-09.T14 | abuse | PS-008-02.R01 | 201 hold commands in one hour | 201st returns RATE_LIMITED; holds above 14 d ttl refused |
| TEST-PS-008-09.T15 | load | PS-008-08.R01, PS-008-08.R02, PS-008-08.R03 | 500 active holds on Moto G profile | hold p95 <= 60 ms, sweep <= 100 ms, no telemetry requests |
| TEST-PS-008-09.T16 | unit | PS-008-09.R01, PS-008-09.R03 | traceability tool run, race test seed replay | every PS-008 requirement maps to a passing test; seeds printed on failure |
| TEST-PS-008-09.T17 | integration | PS-008-10.R01, PS-008-10.R02, PS-008-10.R03 | export, import to fresh vault with expired and frozen holds and peer reservations | items round-trip; expired imported as expired; frozen imported frozen; peer reservations read-only |
| TEST-PS-008-09.T18 | integration | PS-008-01.R04 | B1 records S's reservation for L although B1 has no InventoryItem for L, then a release signed by K, then a valid release | PeerReservation stored valid with provenance and no itemId; K's release quarantined; valid release marks it released |
| TEST-PS-008-09.T19 | contract | PS-008-02.R04 | F02.S03.M02 holds by inventoryItemId with holder {type: cycle, id: subjectId}; F01.S04.M01 requests holderType cycle | first succeeds with lines resolved; second FORBIDDEN |
| TEST-PS-008-09.T20 | property | PS-008-03.R04 | frozen holds under clock advance without owner decision | every frozen hold reaches expired at expiresAt or maxExpiresAt and emits released with reason expired |
| TEST-PS-008-09.T21 | integration | PS-008-03.R05 | hold for Deal D with ttl 7 d and maxExpiresAt 30 d; advance to day 6; then commerce.deal.cancelled for D | hold renewed by the sweep before lapsing; on cancellation released with reason deal_cancelled and a signed release queued to the buyer |
| TEST-PS-008-09.T22 | integration | PS-008-04.R04 | release with owner_override and listing archive before expiresAt for a hold with an issued reservation; B1 receives the release | releaseCid set and statement queued to the audience; B1's PeerReservation becomes released; cycle holds queue no bazaar release |
| TEST-PS-008-09.T23 | integration | PS-008-04.R05 | F01.S03.M02 adds the first variant of L inside its transaction via set_quantity, then a second variant | variant item created synchronously and the listing-level item superseded in the same transaction; with an active listing-level hold CONFLICT_STATE; bazaar.variant.changed creates nothing |
| TEST-PS-008-09.T24 | integration | PS-008-07.R04 | export sections, deletion plan, retention purge, then privacy.deletion.completed | sections present with field classes; buyer DID pseudonymized in retained evidence holds and peer reservations |

## Acceptance criteria

- All tests T01-T24 pass in CI.
- available never goes negative and a unit is never converted twice, including under concurrent tabs and forked devices.
- The UI and APIs never describe a reservation as guaranteed or as accepted by the peer without the signed acknowledgement, and every early release or freeze of an issued reservation reaches its audience as a signed release.

## Dependencies

Module depends on: F01.S01.M01, F16.S02.M03, F11.S01.M01, F11.S01.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
