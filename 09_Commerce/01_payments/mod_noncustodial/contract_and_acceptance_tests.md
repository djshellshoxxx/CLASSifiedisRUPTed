# PS-069-09 — Contract and acceptance tests: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-09.R01** Every requirement is covered by at least one automated test.
- **PS-069-09.R02** Contract tests validate command outputs, statement envelopes and event payloads against the schema registry.
- **PS-069-09.R03** Fork, quarantine and idempotent open scenarios are covered by deterministic two-vault integration tests.

## Specification

See the module test table below (all processes).

**Fixtures:** Two in-memory vaults A (buyer, payer) and B (seller, payee) with a test relay double; Deal for EUR 45.00 from an accepted offer; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T01 | unit | PS-069-01.R01, PS-069-01.R02, PS-069-02.R02 | open a Deal in vault A twice for the same contextRef | one Deal, same dealId derived deterministically, second call returns the existing Deal |
| TEST-PS-069-09.T02 | unit | PS-069-01.R02, PS-069-02.R03 | schema inspection and attempts to set a paid field | no paid field exists; unknown field rejected with VALIDATION_FAILED |
| TEST-PS-069-09.T03 | unit | PS-069-02.R01, PS-069-02.R03 | each rule V01 to V06 and V10 to V11 violated in turn | documented error code returned and nothing stored |
| TEST-PS-069-09.T04 | property | PS-069-03.R01 | random command and event sequences on a claim | only declared transitions succeed; others return CONFLICT_STATE |
| TEST-PS-069-09.T05 | unit | PS-069-03.R02 | try to move a claim to confirmed or final through user input | refused; only crypto events can set it |
| TEST-PS-069-09.T06 | integration | PS-069-03.R03 | clock advanced 14 days without progress | claimed, disputed, pending_confirmation, confirmed and reorged claims become expired and emit commerce.payment.expired |
| TEST-PS-069-09.T07 | integration | PS-069-03.R04 | dispute opened then resolved with a refund-claimed outcome | Deal goes disputed then open; no claim status changed; no money movement API invoked |
| TEST-PS-069-09.T08 | contract | PS-069-04.R01, PS-069-04.R02, PS-069-09.R02 | execute each command in vault A and ingest in vault B | outputs, envelopes and events validate against registry schemas |
| TEST-PS-069-09.T09 | integration | PS-069-04.R03 | deliver crypto and dispute events | claim and Deal statuses follow the machine |
| TEST-PS-069-09.T10 | abuse | PS-069-05.R01, PS-069-05.R02, PS-069-07.R01 | forged statement, wrong-role signer, third party reading | statement quarantined with reason, no state change, NOT_FOUND for non-parties, no deal data in public payloads |
| TEST-PS-069-09.T11 | contract | PS-069-05.R03, PS-069-01.R03 | inspect relay double traffic | only ciphertext and routing metadata observed |
| TEST-PS-069-09.T12 | integration | PS-069-06.R01, PS-069-06.R02 | same command ID replayed; delivery interrupted at each sync state | original result returned; UI state equals the highest sync state reached |
| TEST-PS-069-09.T13 | chaos | PS-069-06.R03, PS-069-07.R03, PS-069-09.R03 | vault B receives two claims with the same prev | claim frozen with COMMERCE_STATEMENT_FORK, both retained, no auto-resolution; flood of 21 statements in an hour quarantines the 21st |
| TEST-PS-069-09.T14 | integration | PS-069-07.R02 | principal deletion completes | retained records carry the pseudonym, signatures flagged unverifiable-after-pseudonymization, counterparty copy untouched |
| TEST-PS-069-09.T15 | load | PS-069-08.R02, PS-069-08.R03 | 10 000 claims and a batch of 100 statements | p95 ≤ 120 ms commit; batch ≤ 2 s; sweep ≤ 1 s |
| TEST-PS-069-09.T16 | integration | PS-069-08.R01, PS-069-09.R01 | local diagnostics and traceability run | no network telemetry sent; every PS-069 requirement maps to a passing test |
| TEST-PS-069-09.T17 | e2e | PS-069-01.R03, PS-069-03.R03 | buyer claims cash payment, seller acknowledges on another device, both screens checked | labels read claimed (unverified) then acknowledged by payee; Deal completed; axe zero serious issues |
| TEST-PS-069-09.T18 | integration | PS-069-10.R01, PS-069-10.R02, PS-069-10.R03 | export vault A, import into fresh vault, roll back one release | Deals and claims round-trip identical; open Deals import as open with sync state local_committed; conflicting IDs rejected |

## Acceptance criteria

- All tests T01 to T18 pass in CI.
- No state or label ever shows a payment as completed on the strength of a payer claim alone.
- Two independent vaults converge on the same Deal and claim statuses after exchanging the same signed statements in any order.
- A forked claim is frozen and never silently resolved.

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
