# PS-010-04 — Commands, queries and events: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-04.R01** counter, accept, reject, withdraw, discard and keep are vault commands; counter, reject and withdraw produce signed statements (classrup.bazaar.negotiation_round/v1, classrup.bazaar.negotiation_close/v1); acceptance is a consent statement signed through comms.consent.sign; receive handles inbound rounds, closes and confirmations; confirm is produced by the seller vault as classrup.bazaar.negotiation_confirm/v1.
- **PS-010-04.R02** Sync state of every outbound statement is prepared, transport_acknowledged (relay receipt) or peer_accepted (peer's signed acknowledgement); the UI shows no more than the reached state.
- **PS-010-04.R03** Events are emitted in each vault from local state changes after verification; the two vaults emit equivalent events independently.
- **PS-010-04.R04** Statements and signer roles are registered with F11.S01.M01 (N2): classrup.bazaar.negotiation_round/v1 signed by the proposer (buyer or seller of the chain), classrup.bazaar.negotiation_close/v1 signed by the closing party, classrup.bazaar.negotiation_confirm/v1 signed by the seller; the earlier name classrup.bazaar.negotiation_accept/v1 is an alias of the consent statement.
- **PS-010-04.R05** Acceptance is signed with comms.consent.sign {subjectType bazaar_negotiation, subjectRef negotiationId, subjectRevision roundNo, subjectRevisionHash = SHA-256 of JCS of the round statement, statementKey consent.bazaar.negotiation.accept.v1} and verified with comms.consent.verify; the module registers the SubjectCanonicalizerPort for bazaar_negotiation, and a conflicted status freezes the chain (N13).

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `bazaar.negotiation.counter` | bazaar.negotiation.counter | [vault-local + statement classrup.bazaar.negotiation_round/v1, encrypted to counterparty] { offerId \| negotiationId, expectedRevision?, amount (chain currency), note?, expiresInMs? (default 172800000) } | { negotiationId, roundNo, revision, statementCid, syncState: prepared } | VALIDATION_FAILED, NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BLOCKED_PARTY, BAZAAR_NEGOTIATION_ROUND_LIMIT, BAZAAR_NEGOTIATION_NOT_CONVERGING, BAZAAR_NEGOTIATION_LISTING_CHANGED, RATE_LIMITED | bazaar.negotiation.countered | yes (Idempotency-Key) |
| `bazaar.negotiation.accept` | bazaar.negotiation.decide | [vault-local; produces classrup.comms.consent/v1 through comms.consent.sign (statementKey consent.bazaar.negotiation.accept.v1); in the seller vault also classrup.bazaar.negotiation_confirm/v1, classrup.commerce.deal/v1 and classrup.bazaar.reservation/v1] { negotiationId, expectedRevision, roundNo, roundCid, listingRevision } | { negotiationId, revision, status: accept_sent\|accepted, consentCid, dealId?, holdId? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, EXPIRED, BLOCKED_PARTY, BAZAAR_NEGOTIATION_LISTING_CHANGED, BAZAAR_NEGOTIATION_HOLD_FAILED, DEPENDENCY_UNAVAILABLE, COMMS_CONSENT_SUBJECT_MISMATCH | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.reject` | bazaar.negotiation.decide | [vault-local + statement classrup.bazaar.negotiation_close/v1] { negotiationId, expectedRevision } | { negotiationId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.withdraw` | bazaar.negotiation.withdraw | [vault-local + statement classrup.bazaar.negotiation_close/v1] { negotiationId, expectedRevision } | { negotiationId, revision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.discard_frozen` | bazaar.negotiation.decide | [vault-local + statement classrup.bazaar.negotiation_close/v1] { negotiationId, expectedRevision } | { negotiationId, revision, cancelledDealId? } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE | bazaar.negotiation.closed | yes (Idempotency-Key) |
| `bazaar.negotiation.keep_frozen` | bazaar.negotiation.decide | [vault-local in the seller vault] { negotiationId, expectedRevision } | { negotiationId, revision, status: accepted } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, BAZAAR_NEGOTIATION_HOLD_FAILED |  | yes (Idempotency-Key) |
| `bazaar.negotiation.receive` | bazaar.negotiation.receive | [vault-local, inbound statement] { envelope: classrup.bazaar.negotiation_round/v1 \| classrup.bazaar.negotiation_close/v1 \| classrup.bazaar.negotiation_confirm/v1, provenance } | { negotiationId?, accepted: boolean, quarantineReason?, replyStatementCid? } | VALIDATION_FAILED, UNSUPPORTED_SCHEMA_VERSION, CONFLICT_STATE | bazaar.negotiation.countered, bazaar.negotiation.closed | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `bazaar.negotiation.get` | bazaar.negotiation.read | { negotiationId } | { negotiation: Negotiation, rounds: NegotiationRound[] } | NOT_FOUND |
| `bazaar.negotiation.list_mine` | bazaar.negotiation.read | { status?, listingId?, cursor?, limit <= 50 } | { items: Negotiation[], nextCursor? } | VALIDATION_FAILED |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `bazaar.negotiation.countered` | P2 | { negotiationId, listingId, variantId?, roundNo, proposerId, recipientId, amount, listingRevision, expiresAt } |
| `bazaar.negotiation.closed` | P2 | { negotiationId, listingId, variantId?, buyerId, sellerId, outcome: accepted\|rejected\|withdrawn\|expired\|superseded\|listing_unavailable\|blocked\|frozen_discarded\|timeout, finalAmount?, quantity, dealId?, holdId?, localRole } |

### Events consumed

| Type | Effect |
|---|---|
| `bazaar.listing.edited` | seller vault: when material, mark open chains listingChangedSinceRound; accept is then refused until the proposer sends a new round on the new revision |
| `bazaar.listing.unpublished` | seller vault: close open chains with outcome listing_unavailable and queue a signed close |
| `bazaar.listing.expired` | seller vault: close open chains with outcome listing_unavailable and queue a signed close |
| `bazaar.listing.closed` | seller vault: close open chains with outcome listing_unavailable and queue a signed close |
| `bazaar.inventory.depleted` | seller vault: close open chains on that variant with outcome superseded unless this chain holds the stock |
| `bazaar.inventory.conflict_detected` | seller vault: an accepted chain whose holdId is named moves to frozen with frozenReason hold_fork |
| `identity.block.added` | both vaults: close chains between the two parties with outcome blocked and send no revealing notification; the close statement reads rejected |
| `federation.record.accepted` | buyer vault: a newer verified projection of the chain's listing with a higher listingRevision and material changes marks the chain listingChangedSinceRound |
| `federation.tombstone.applied` | buyer vault: a tombstone of the chain's listing projection marks the listing unavailable; the chain waits for the seller's close or expiry |
| `comms.consent.received` | for subjectType bazaar_negotiation and this negotiationId: seller vault verifies the buyer's acceptance with comms.consent.verify and runs the accept transaction; buyer vault records the seller's consent next to the confirmation; conflicted freezes the chain |
| `commerce.deal.cancelled` | a frozen hold_fork chain whose dealId matches moves to expired |
| `privacy.deletion.completed` | replace the deleted principal's DID with the payload pseudonym in chains and rounds retained under RET-EVIDENCE and purge notes of non-evidence chains |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| BAZAAR_NEGOTIATION_ROUND_LIMIT | 409 | no | the chain already has 10 rounds |
| BAZAAR_NEGOTIATION_NOT_CONVERGING | 422 | no | the counter moves away from the other side's last amount |
| BAZAAR_NEGOTIATION_LISTING_CHANGED | 409 | no | the listing changed materially since the round; review and send a new round |
| BAZAAR_NEGOTIATION_HOLD_FAILED | 409 | no | seller could not reserve the item; chain closed as superseded |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements (N2, registered with F11.S01.M01): classrup.bazaar.negotiation_round/v1 {negotiationId, rootOfferId, roundNo, amount, quantity, note?, listingRevision, claimedAt, expiresAt, prev}, signer role proposer (buyer or seller of the chain); classrup.bazaar.negotiation_close/v1 {negotiationId, answersCid, outcome: rejected|withdrawn| expired|superseded|listing_unavailable|frozen_discarded|timeout}, signer role the closing party; classrup.bazaar.negotiation_confirm/v1 {negotiationId, roundCid, acceptanceConsentCid, dealId}, signer role seller; acceptance classrup.comms.consent/v1 (F08.S02.M02, subjectType bazaar_negotiation, statementKey consent.bazaar.negotiation.accept.v1), signer role the accepting party; plus classrup.commerce.deal/v1 and classrup.bazaar.reservation/v1 from the seller vault. Privacy ports (N6): the module registers ExportSectionPort (sections bazaar.negotiations and bazaar.negotiation_rounds), DeletionPort (plan: pseudonymize the deleted party in retained chains, purge notes of non-evidence chains) and RetentionPurgePort with F10.S01.M03, F10.S01.M04 and F10.S01.M02.

### Example

```
seller vault: vault.dispatch("bazaar.negotiation.counter", { "offerId": "0192f3a5-...", "amount": { "amount": "4800", "currency": "EUR" }, "note": "Includes helmet" })
=> { "negotiationId": "0192f3b0-...", "roundNo": 1, "revision": 1, "statementCid": "sha256-Zm9v...", "syncState": "prepared" }
   same transaction: bazaar.offer.reject { offerId, reason: "countered" }
buyer vault: vault.dispatch("bazaar.negotiation.accept", { "negotiationId": "0192f3b0-...", "expectedRevision": 2, "roundNo": 1, "roundCid": "sha256-Zm9v...", "listingRevision": 5 })
=> { "negotiationId": "0192f3b0-...", "revision": 3, "status": "accept_sent", "consentCid": "sha256-Cns..." }
   comms.consent.sign { subjectType: "bazaar_negotiation", subjectRef: "0192f3b0-...", subjectRevision: 1, statementKey: "consent.bazaar.negotiation.accept.v1" }
seller vault: comms.consent.received → comms.consent.verify valid → hold (ttl 7 d, maxExpiresAt = Deal expiry), commerce.deal.open, signed confirmation => buyer vault shows accepted with dealId.
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T08 | contract | PS-010-04.R01, PS-010-04.R03, PS-010-09.R02 | each command and inbound statement | statements validate and verify; countered and closed payloads contain no notes |
| TEST-PS-010-09.T09 | integration | PS-010-04.R02, PS-010-06.R03 | statements sent with relay down then up | states move prepared to transport_acknowledged to peer_accepted only on receipts; UI never shows more |
| TEST-PS-010-09.T11 | integration | PS-010-04.R03 | seller vault: listing edited materially, unpublished, depleted, blocked; buyer vault: newer verified projection | chain flagged or closed with documented outcomes; buyer flag set from the mirror event |
| TEST-PS-010-09.T24 | integration | PS-010-04.R05 | accept in both directions and a conflicted consent | consents signed with subjectType bazaar_negotiation and statementKey consent.bazaar.negotiation.accept.v1 over the round digest through the registered SubjectCanonicalizerPort; verified with comms.consent.verify; conflicted freezes the chain |
| TEST-PS-010-09.T25 | contract | PS-010-01.R05, PS-010-04.R04 | inspect stored records and the F11.S01.M01 registry | records validate as classrup.bazaar.negotiation/v1 and classrup.bazaar.negotiation_round_record/v1; statements as negotiation_round/v1, negotiation_close/v1 and negotiation_confirm/v1 with registered signer roles; negotiation_accept/v1 resolves to the consent statement |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
