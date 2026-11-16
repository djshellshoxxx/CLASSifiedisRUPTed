# PS-010-09 — Contract and acceptance tests: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-09.R01** Every requirement is covered by at least one automated test.
- **PS-010-09.R02** Contract tests validate statements, commands and events against the registry and verify signatures.
- **PS-010-09.R03** Race, fork and expiry scenarios are covered by deterministic two-vault tests with injected clocks and ids.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults: seller S with published listing L (EUR 50.00, quantity 1, negotiable) and buyer B with Offer EUR 40.00; a third buyer B2; relay stub; clocks 2026-11-04T10:00:00Z; policy of 10 rounds.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T01 | unit | PS-010-01.R01, PS-010-01.R03, PS-010-02.R01 | S counters EUR 48.00 then B counters EUR 44.00 | rounds stored immutable with prev chain; ordering by roundNo not clock |
| TEST-PS-010-09.T02 | unit | PS-010-01.R02, PS-010-07.R01 | inspect projection, relay payload, logs and notifications | no amounts or notes outside encrypted statements |
| TEST-PS-010-09.T03 | unit | PS-010-02.R02, PS-010-02.R03 | violate each rule V01-V12 in turn | documented error code returned or statement quarantined with reason; state unchanged |
| TEST-PS-010-09.T04 | property | PS-010-03.R01 | random statements in random order and duplicated | only declared transitions; terminal states never regress; same final state in both vaults when all delivered |
| TEST-PS-010-09.T05 | integration | PS-010-03.R02, PS-010-06.R02 | B accepts S's round 1; S vault holds and confirms | B shows accept_sent then accepted only after verified confirmation; S has hold and Deal handoff |
| TEST-PS-010-09.T06 | integration | PS-010-03.R03, PS-010-06.R03 | S and B counter simultaneously | both vaults freeze on exchange, no hold taken, discard needed to continue |
| TEST-PS-010-09.T07 | integration | PS-010-03.R02, PS-010-02.R03 | last unit held for B2 while B's acceptance is in transit | S sends signed close superseded; B shows rejected superseded; no double hold |
| TEST-PS-010-09.T08 | contract | PS-010-04.R01, PS-010-04.R03, PS-010-09.R02 | each command and inbound statement | statements validate and verify; countered and closed payloads contain no notes |
| TEST-PS-010-09.T09 | integration | PS-010-04.R02, PS-010-06.R03 | statements sent with relay down then up | states move prepared to transport_acknowledged to peer_accepted only on receipts; UI never shows more |
| TEST-PS-010-09.T10 | abuse | PS-010-05.R01, PS-010-05.R02, PS-010-05.R03 | non-party counters; statement signed by a third key; relay reads mailbox | FORBIDDEN or quarantined role_mismatch; relay sees ciphertext |
| TEST-PS-010-09.T11 | integration | PS-010-04.R03 | listing edited materially, unpublished, depleted, blocked | chain flagged or closed with documented outcomes |
| TEST-PS-010-09.T12 | chaos | PS-010-06.R01, PS-010-06.R03 | replay accept with same key; crash after hold before confirmation | one confirmation; hold and Negotiation consistent after restart |
| TEST-PS-010-09.T13 | integration | PS-010-03.R03 | round expiry according to receiver clock vs sender claim | accept after receiver-clock expiry gets EXPIRED |
| TEST-PS-010-09.T14 | abuse | PS-010-07.R02, PS-010-07.R03 | 21 counters in an hour; 11th round | RATE_LIMITED; BAZAAR_NEGOTIATION_ROUND_LIMIT |
| TEST-PS-010-09.T15 | integration | PS-010-07.R01, PS-010-07.R02 | account deletion of buyer | seller copy keeps amounts with pseudonym; retention evidence respected |
| TEST-PS-010-09.T16 | load | PS-010-08.R01, PS-010-08.R02, PS-010-08.R03 | 50 chains, 500 statements on Moto G profile | counter and receive p95 <= 100 ms, accept p95 <= 200 ms, no telemetry |
| TEST-PS-010-09.T17 | unit | PS-010-09.R01, PS-010-09.R03 | traceability tool run, seed replay | every PS-010 requirement maps to a passing test; seeds printed on failure |
| TEST-PS-010-09.T18 | integration | PS-010-10.R01, PS-010-10.R02, PS-010-10.R03 | export, import to fresh vault, import chain with invalid signature | chains round-trip; open chains import as expired; invalid signature quarantined |
| TEST-PS-010-09.T19 | a11y | PS-010-01.R01 | axe run on negotiation card and accept dialog | zero serious or critical issues; keyboard-only counter works |

## Acceptance criteria

- All tests T01-T19 pass in CI.
- An acceptance is never shown as agreed until the seller's signed confirmation with hold and Deal reference is verified.
- Conflicting signed rounds freeze the chain and never resolve by timestamp or last writer; amounts and notes never leave the two parties' encrypted channel.

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M03, F07.S02.M02, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
