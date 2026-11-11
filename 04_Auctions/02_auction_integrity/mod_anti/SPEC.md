# F04.S02.M01 — Anti-shill controls

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F04.S02](../SPEC.md). **Process IDs:** PS-036-01…PS-036-10. **Code:** `packages/auctions/src/auction_integrity/anti`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The host relay of an auction keeps the seller and the seller's linked keys from bidding on that seller's auctions, and scores bidding patterns for shill suspicion. Linkage means evidence the host can actually hold - the same key, a device key that the in-process F07 reads identity.portable_doc.key_set and find_by_key list under both the seller DID and the bidder DID (active, revoked or removed keys, which stay linked; MVP has no account key rotation chain), a same_owner attestation signed by both DIDs (identity.attestation.list_linkage), or keys this host saw together in one signed device-link or registration request or in one relay access-token session (identity.session.linked_keys). IP addresses, network ranges, timing and device fingerprints are never linkage. A deterministic link or a revoked key denies the bid with a generic error. Statistical patterns, scored by the fixed table shill-v1 from host-local auction events, never deny a bid; they flag the bidder for human review in F04.S02.M03. A seller who uses a fresh unlinked key cannot be detected by linkage, and the UI and policy say so; pseudonymity is not anonymity, and the host is trusted to run this check honestly.

## Responsibilities

- Own ShillCheck records on the host - one per denied or flagged evaluation - with the verdict, reason codes, evidence type, score and scoring version.
- Provide the synchronous eligibility check used by the bid transaction (F04.S01.M02) with p95 ≤ 40 ms, reading linkage and known key revocations (classrup.security.keyrevocation/v1, the single device revocation type owned by F16.S02.M02) in-process from host-held F07 data through identity.portable_doc.key_set, find_by_key and key_status, identity.attestation.list_linkage and identity.session.linked_keys.
- Compute an asynchronous shill score with scoring table shill-v1 from consumed host-local auctions.bid.* and auction result events after each placed bid, and emit auctions.shill.suspected at score 60 or more.
- Keep the linkage evidence private - the bidder gets a generic denial, the seller sees nothing, the reviewers see evidence types and ids.
- Confirm or dismiss each check only from the per-check outcomes in auctions.review.closed.

## Not responsible for

- Bid placement and ledger (F04.S01.M02) and result voiding (F04.S02.M03 issues the host finding, F04.S01.M03 applies it in each vault).
- Creating or revoking keys and attestations (F07.S01.M01, F07.S03.M02) and identity documents (F07.S02.M01); this module only reads them.
- Account-level enforcement; a host may apply its own hosting policy through F12.S02.M01 on the host, and no global ban exists (ADR-0016 section 8).
- Future: cross-host linkage sharing between hosts under explicit peer agreements, machine-learned scoring, and rotation-chain linkage once account key rotation leaves Future in F07.S02.M01.

## User stories

- As a bidder, I am told only that I cannot bid on an auction when I am ineligible, and I know where to appeal to the host operator.
- As a seller, I know that my own keys, keys I revoked and keys I linked to myself cannot bid on my auctions.
- As a host moderator, I see flagged bidders with reasons and evidence types ranked by score and decide in the review.

## Edge cases

- A family member uses a distinct key that was registered on this host in the same signed device-link request as the seller's key (linked_host_registration); the bid is denied generically, the bidder appeals to the host operator, who can allow-list the pair for one auction with a recorded reason; the allow-list never applies to the seller's own key.
- The seller replaces a device key (the old key revoked with reason superseded); identity.portable_doc.key_set lists the new key as active and the old one as revoked, so both stay linked; no rotation chain is read because account key rotation is Future in F07.
- A same-owner attestation is revoked after a denial; the revoked attestation still links the two keys for this seller for 30 days and permanently for auctions scheduled before the revocation; past denials are kept as history.
- F07 linkage data on the host is older than 24 h or missing; the check uses cached data while it is at most 24 h old, and beyond that allows the bid with a linkage_stale flag for review, a counter and an operator alert; the seller-key equality and revoked-key checks still run on host-local data.
- Two honest friends alternate bids; the alternation feature gives 25 points and alone stays below the flag threshold of 60.
- A bidder bids on only one seller's auctions because it is the only local seller; concentration and price_pump points are halved when the host had fewer than 5 sellers in the last 30 days.
- A flagged bidder wins an auction before review; the result is not changed by the flag; F04.S02.M03 may void it later.
- Scoring job lags; flags may appear up to 5 minutes after the bid, and the bid decision never waits for the score.
- The seller revokes a device key and then bids with it; the host holds the classrup.security.keyrevocation/v1 statement, identity.portable_doc.key_status answers revoked, the key is refused as revoked, and it stays linked to the seller anyway.
- Two honest bidders bid from the same IP address within the same second; IP addresses, network ranges and timing are never linkage evidence, so both are allowed.
- An operator tries allow_pair for the seller's own key, or to override a seller_self or linked_identity_doc denial; refused with VALIDATION_FAILED because the allow-list never overrides V01 or V02.

## UX and accessibility

- Bidder denial message: You cannot bid on this auction. Contact the host operator; no detail about the reason is shown.
- Host moderator queue: flagged checks sorted by score with reasons, evidence types, scoring version, auction links and an Open review action; linkage_stale flags in their own tab.
- Auction page integrity note: Bids from the seller and keys linked to the seller are blocked by this host; linkage cannot see unlinked new keys.

**States:** loading; empty; allowed; denied; flagged; under-review; dismissed; confirmed; expired

**Accessibility:** Denial and integrity messages are plain text in a role=alert region and do not rely on colour.; Moderator queue is a table with column headers, sortable by keyboard, and rows have accessible names with auction and score.; Score is shown as a number and a text band (low, medium, high), never colour alone.

## Owned data

- `ShillCheck` (classrup.auctions.shill_check/v1, P3, RET-EVIDENCE)

## Interfaces

- Commands: `auctions.shill.check`, `auctions.shill.score`, `auctions.shill.allow_pair`
- Queries: `auctions.shill.list_for_review`, `auctions.shill.get_policy`
- Emits: `auctions.shill.suspected`
- Consumes: `auctions.bid.placed`, `auctions.bid.outbid`, `auctions.bid.retracted`, `auctions.auction.closed`, `auctions.auction.won`, `auctions.auction.scheduled`, `auctions.review.opened`, `auctions.review.closed`, `identity.attestation.added`, `identity.attestation.revoked`, `identity.portable_doc.published`, `privacy.deletion.completed`

## Dependencies

F04.S01.M01, F07.S01.M01, F07.S01.M02, F07.S02.M01, F07.S03.M02, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-036-01 | [Domain schema](domain_schema.md) | 4 |
| PS-036-02 | [Validation rules](validation_rules.md) | 4 |
| PS-036-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-036-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-036-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-036-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-036-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-036-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-036-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-036-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/auctions/src/auction_integrity/anti/index.ts`.

## Acceptance criteria

- All tests T01–T21 pass in CI.
- Deterministic linkage and revoked keys always deny and heuristics never deny.
- Denials are generic and indistinguishable in body and timing from other ineligibility.
- No IP address, network range, timing or device fingerprint is ever used as linkage evidence.
