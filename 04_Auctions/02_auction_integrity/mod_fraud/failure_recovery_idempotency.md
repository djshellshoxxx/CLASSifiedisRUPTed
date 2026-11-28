# PS-037-06 — Failure recovery and idempotency: Auction fraud review

**Status:** SPECIFIED (Stage 3). **Module:** [F04.S02.M03 Auction fraud review](SPEC.md) · **Scope:** MVP · **Code:** `packages/auctions/src/auction_integrity/fraud` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-037-06.R01** Review commands are idempotent per review and expectedRevision; a repeated confirm returns the stored void statement.
- **PS-037-06.R02** Confirm, the void statement, the EnforcementAction, the events and the move of the host's own result row to voided commit in one host transaction; a failure leaves the review in void_proposed.
- **PS-037-06.R03** Delivery of the void statement to participants is at least once through mailboxes and idempotent by cid in vaults.
- **PS-037-06.R04** No lock spans vaults - the host never serializes a void against payments it cannot see; each vault applies the void against its own Deal state in one local transaction (F04.S01.M03).

## Specification

- **idempotency:** One open review per auction; trigger dedupe on (kind, ref); command ids stored 24 h on the host; confirm repeated with the same expectedRevision returns the same voidCid; rescind runs once per review; vault dedup by void and rescission cid.
- **concurrency:** expectedRevision on every command; each decision runs in one host SQLite transaction (BEGIN IMMEDIATE); two moderators confirming at once are serialized and the second gets CONFLICT_REVISION; no auction lease and no cross-vault lock are involved.
- **retries:** Void and rescission delivery retries 1 s, 2 s, 4 s, 8 s up to 8 attempts then hourly for 30 days; host triggers are consumed with EVT-6 retries.
- **offline:** Moderator commands need the host and are not queued; participant vaults show the last known state and the void arrives when the vault next connects.
- **partial failure:** If F12.S02.M01 cannot record the EnforcementAction, confirm fails with DEPENDENCY_UNAVAILABLE and the review stays void_proposed; no partial void exists. A void issued over a payment acknowledged in some vault is not a failure - that vault records void after payment (F04.S01.M03). Delivery failures never roll back the host decision; they retry from the mailbox outbox.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-037-09.T04 | integration | PS-037-06.R04, PS-037-04.R02 | vault-side race - in the winner vault a payment acknowledgement and the void statement arrive concurrently; in the seller vault the void arrives first | the local transaction that commits first decides; acknowledgement first gives void_after_payment with no state change; void first gives voided with the Deal kept; the host issued the same void in both cases and took no lock |
| TEST-PS-037-09.T07 | integration | PS-037-04.R02, PS-037-06.R01 | open auction cancel_auction then dismiss | auction cancelled through apply_cancel with host_policy, bids void, review closed once |
| TEST-PS-037-09.T09 | integration | PS-037-06.R03, PS-037-09.R03 | void delivery dropped, duplicated and reordered by hostile relay | vaults converge on the void; duplicates skipped; second-chance offer withdrawn |
| TEST-PS-037-09.T16 | chaos | PS-037-06.R02 | F12.S02.M01 fails during confirm; crash after statement signing before commit | review stays void_proposed; no void statement delivered, no EnforcementAction, host result row unchanged |

## Dependencies

Module depends on: F04.S01.M01, F04.S01.M02, F04.S01.M03, F04.S02.M01, F04.S02.M02, F12.S01.M01, F12.S01.M02, F12.S01.M03, F12.S02.M01, F11.S01.M01, F11.S01.M03, F07.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F13.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
