# F04.S02.M01 — Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S02](../SPEC.md). **Process IDs:** PS-036-01…PS-036-10. **Code:** `packages/auctions/src/auction_integrity/anti`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The host relay of an auction keeps the seller and the seller's linked keys from bidding on that seller's auctions, and scores bidding patterns for shill suspicion. Linkage means evidence the host can actually hold - the same key, a key listed in the seller's published portable identity document (including key rotation chains), a signed same-owner attestation, or keys the host itself saw registered or authenticated together. A deterministic link denies the bid with a generic error. Statistical patterns never deny a bid; they flag the bidder for human review in F04.S02.M03. A seller who uses a fresh unlinked key cannot be detected by linkage, and the UI and policy say so; pseudonymity is not anonymity, and the host is trusted to run this check honestly.

## Responsibilities

- Own ShillCheck records on the host - one per denied or flagged evaluation - with the verdict, reason codes, evidence type and score.
- Provide the synchronous eligibility check used by the bid transaction (F04.S01.M02) with p95 ≤ 40 ms, reading linkage from local F07 data on the host.
- Compute an asynchronous shill score after each placed bid from the host ledger signals and emit auctions.shill.suspected at score 60 or more.
- Keep the linkage evidence private - the bidder gets a generic denial, the seller sees nothing, the reviewers see evidence types and ids.

## Not responsible for

- Bid placement and ledger (F04.S01.M02) and result voiding (F04.S02.M03 decides, F04.S01.M03 applies).
- Creating or revoking keys and attestations (F07.S01.M01, F07.S03.M02) and identity documents (F07.S02.M01); this module only reads them.
- Account-level enforcement; a host may apply its own hosting policy through F12.S02.M01 on the host, and no global ban exists (ADR-0016 section 8).
- Future: cross-host linkage sharing between hosts under explicit peer agreements, and machine-learned scoring.

## User stories

- As a bidder, I am told only that I cannot bid on an auction when I am ineligible, and I know where to appeal to the host operator.
- As a seller, I know that my own keys and keys I linked to myself cannot bid on my auctions.
- As a host moderator, I see flagged bidders with reasons and evidence types ranked by score and decide in the review.

## Edge cases

- A family shares one device key in good faith with the seller; the bid is denied generically and the bidder appeals to the host operator, who can allow-list a pair for one auction with a recorded reason.
- The seller rotates a device key; the old and new key are both in the identity document chain, so both are linked.
- An attestation of same ownership is revoked after a denial; future checks allow the key and past denials are kept as history.
- Portable identity document is unavailable on the host; the check uses cached data up to 24 h old and records evidence age, and fails open for linkage but not for the direct key equality check.
- Two honest friends alternate bids; the alternation score is 25 and alone stays below the flag threshold of 60.
- A bidder bids on only one seller's auctions because it is the only local seller; concentration scores are damped when the host has fewer than 5 sellers in the last 30 days.
- A flagged bidder wins an auction before review; the result is not changed by the flag; F04.S02.M03 may void it later.
- Scoring job lags; flags may appear up to 5 minutes after the bid, and the bid decision never waits for the score.

## UX and accessibility

- Bidder denial message: You cannot bid on this auction. Contact the host operator; no detail about the reason is shown.
- Host moderator queue: flagged checks sorted by score with reasons, evidence types, auction links and a Open review action.
- Auction page integrity note: Bids from the seller and keys linked to the seller are blocked by this host; linkage cannot see unlinked new keys.

**States:** loading; empty; allowed; denied; flagged; under-review; dismissed; confirmed

**Accessibility:** Denial and integrity messages are plain text in a role=alert region and do not rely on colour.; Moderator queue is a table with column headers, sortable by keyboard, and rows have accessible names with auction and score.; Score is shown as a number and a text band (low, medium, high), never colour alone.

## Owned data

- `ShillCheck` (classrup.auctions.shill_check/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.shill.check`, `auctions.shill.score`, `auctions.shill.allow_pair`
- Queries: `auctions.shill.list_for_review`, `auctions.shill.get_policy`
- Emits: `auctions.shill.suspected`
- Consumes: `auctions.bid.placed`, `auctions.bid.retracted`, `auctions.review.opened`, `auctions.review.closed`, `auctions.result.voided`, `identity.device_key.revoked`, `identity.attestation.added`, `identity.attestation.revoked`, `identity.portable_doc.published`

## Dependencies

F04.S01.M01, F07.S01.M01, F07.S02.M01, F07.S03.M02, F11.S01.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-036-01 | [Domain schema](domain_schema.md) | 3 |
| PS-036-02 | [Validation rules](validation_rules.md) | 3 |
| PS-036-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-036-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-036-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-036-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-036-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-036-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-036-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-036-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_integrity/anti/index.ts`.

## Acceptance criteria

- All tests T01–T14 pass in CI.
- Deterministic linkage always denies and heuristics never deny.
- Denials are generic and indistinguishable in body and timing from other ineligibility.
