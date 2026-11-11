# PS-010-09 — Contract and acceptance tests: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-09.R01** Every requirement is covered by at least one automated test.
- **PS-010-09.R02** Contract tests validate statements, commands and events against the registry and verify signatures.
- **PS-010-09.R03** Race, fork and expiry scenarios are covered by deterministic two-vault tests with injected clocks and ids.
- **PS-010-09.R04** The negotiation card and accept dialog pass automated accessibility checks with zero serious or critical issues and keyboard-only operation.

## Specification

See the module test table below (all processes).

**Fixtures:** Two vaults: seller S with published listing L (EUR 50.00, quantity 1, negotiable) and buyer B with Offer EUR 40.00 and the verified projection of L; a third buyer B2; relay stub with a moderator; clocks 2026-11-04T10:00:00Z with injectable skew; policy of 10 rounds.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T01 | unit | PS-010-01.R01, PS-010-01.R03, PS-010-02.R01 | S counters EUR 48.00 then B counters EUR 44.00 | rounds stored immutable with prev chain; ordering by roundNo not clock |
| TEST-PS-010-09.T02 | unit | PS-010-01.R02, PS-010-07.R01 | inspect projection, relay payload, logs and notifications | no amounts or notes outside encrypted statements |
| TEST-PS-010-09.T03 | unit | PS-010-02.R02, PS-010-02.R03 | violate each rule V01-V17 in turn in the vault the rule names | documented error code returned or statement quarantined with reason; state unchanged |
| TEST-PS-010-09.T04 | property | PS-010-03.R01 | random statements in random order and duplicated | only declared transitions; terminal states never regress; same final state in both vaults when all delivered |
| TEST-PS-010-09.T05 | integration | PS-010-03.R02, PS-010-06.R02 | B accepts S's round 1; S vault holds and confirms | B shows accept_sent then accepted only after verified confirmation; S has a Deal-linked hold (ttl 7 d, maxExpiresAt = Deal expiry) and the Deal |
| TEST-PS-010-09.T06 | integration | PS-010-03.R03, PS-010-06.R03 | S and B counter simultaneously | both vaults freeze on exchange, no hold taken, discard needed to continue |
| TEST-PS-010-09.T07 | integration | PS-010-03.R02, PS-010-02.R03 | last unit held for B2 while B's acceptance is in transit | S sends signed close superseded; B shows rejected superseded; no double hold |
| TEST-PS-010-09.T08 | contract | PS-010-04.R01, PS-010-04.R03, PS-010-09.R02 | each command and inbound statement | statements validate and verify; countered and closed payloads contain no notes |
| TEST-PS-010-09.T09 | integration | PS-010-04.R02, PS-010-06.R03 | statements sent with relay down then up | states move prepared to transport_acknowledged to peer_accepted only on receipts; UI never shows more |
| TEST-PS-010-09.T10 | abuse | PS-010-05.R01, PS-010-05.R02, PS-010-05.R03 | non-party counters; statement signed by a third key; relay reads the F08.S01.M01 mailbox; capability list inspected | FORBIDDEN or quarantined role_mismatch; relay sees ciphertext; no bazaar.negotiation.relay_mailbox capability exists |
| TEST-PS-010-09.T11 | integration | PS-010-04.R03 | seller vault: listing edited materially, unpublished, depleted, blocked; buyer vault: newer verified projection | chain flagged or closed with documented outcomes; buyer flag set from the mirror event |
| TEST-PS-010-09.T12 | chaos | PS-010-06.R01, PS-010-06.R03 | replay accept with same key; crash after hold before confirmation | one confirmation; hold and Negotiation consistent after restart |
| TEST-PS-010-09.T13 | integration | PS-010-03.R03 | a frozen chain without any decision until the hard deadline; a hold_fork chain kept with keep_frozen | first expires at hardDeadline with bazaar.negotiation.closed (expired); second returns to accepted |
| TEST-PS-010-09.T14 | abuse | PS-010-02.R03 | 21 counters in an hour; 11th round | RATE_LIMITED; BAZAAR_NEGOTIATION_ROUND_LIMIT |
| TEST-PS-010-09.T15 | integration | PS-010-07.R02 | principal deletion of the buyer (privacy.deletion.completed in B) | B's retained chains carry the pseudonym; S's copy keeps amounts; retention evidence respected |
| TEST-PS-010-09.T16 | load | PS-010-08.R01, PS-010-08.R02, PS-010-08.R03 | 50 chains, 500 statements on Moto G profile | counter and receive p95 <= 100 ms, accept p95 <= 200 ms, no telemetry |
| TEST-PS-010-09.T17 | unit | PS-010-09.R01, PS-010-09.R03 | traceability tool run, seed replay | every PS-010 requirement maps to a passing test; seeds printed on failure |
| TEST-PS-010-09.T18 | integration | PS-010-10.R01, PS-010-10.R02, PS-010-10.R03 | export, import to fresh vault, import chain with invalid signature | chains round-trip; open chains import as expired; invalid signature quarantined |
| TEST-PS-010-09.T19 | a11y | PS-010-09.R04 | axe run on negotiation card and accept dialog | zero serious or critical issues; keyboard-only counter works |
| TEST-PS-010-09.T20 | abuse | PS-010-07.R03 | a round note containing a URL is shown in both vaults, then reported | URL rendered as plain text without a link; the report stores the signed round statements and their cids as evidence |
| TEST-PS-010-09.T21 | unit | PS-010-01.R04, PS-010-02.R04 | EUR root offer, then a USD counter, then a EUR counter with quantity 2 | both refused with VALIDATION_FAILED; chain currency and quantity unchanged |
| TEST-PS-010-09.T22 | integration | PS-010-03.R04 | two vaults with clocks skewed +10 and -10 min; S confirms 5 min before expiry and delivery is delayed 3 h, then a second chain with delivery delayed 25 h | first: B applies the confirmation inside the grace and both show accepted; second: B expires, sends a timeout close, S moves accepted to expired and calls commerce.deal.cancel, and the hold is released |
| TEST-PS-010-09.T23 | integration | PS-010-03.R05 | S counters B's offer; separately B withdraws the root offer while round 1 is in transit | root offer rejected countered in the counter transaction; in the crossing case B closes the chain as withdrawn and S closes it on the signed close |
| TEST-PS-010-09.T24 | integration | PS-010-04.R05 | accept in both directions and a conflicted consent | consents signed with subjectType bazaar_negotiation, statementKey consent.bazaar.negotiation.accept.v1, statementLocale and subjectRevisionHash equal to the round statementCid (ID-3 cid) through the registered ConsentSubjectPort, which passes the F08.S02.M02 conformance suite; the receiving vault echoes each received consent before committing; verified with comms.consent.verify; conflicted freezes the chain |
| TEST-PS-010-09.T25 | contract | PS-010-01.R05, PS-010-04.R04 | inspect stored records and the F11.S01.M01 registry | records validate as classrup.bazaar.negotiation/v1 and classrup.bazaar.negotiation_round_record/v1; statements as negotiation_round/v1, negotiation_close/v1 and negotiation_confirm/v1 with registered signer roles; negotiation_accept/v1 resolves to the consent statement |
| TEST-PS-010-09.T26 | integration | PS-010-07.R04 | export sections, deletion plan and retention purge through the F10 ports | sections present with field classes; deletion plan pseudonymizes retained chains and purges notes of non-evidence chains |
| TEST-PS-010-09.T27 | contract | PS-010-04.R07 | S counters, then B counters, then F01.S04.M01's ContextTermsPort asks the registered NegotiationTermsPort for an accepted round | each bazaar.negotiation.countered payload validates and carries rootOfferId equal to the chain's root offer; roundTerms returns buyer, seller, amount and quantity of the accepted round and accepted false for an unaccepted one |
| TEST-PS-010-09.T28 | contract | PS-010-04.R06 | counter, close and confirm through the StatementPublisherPort test double; B's vault receives round 1 | every statement is created by federation.record.publish with audience participants, recipients [{did, mailboxId}], ext.stream equal to streamId and a ciphertext of at most 12288 bytes; the module calls no signing primitive; B's F11.S01.M02 signs classrup.federation.ack/v1 and S's entry reaches peer_accepted |
| TEST-PS-010-09.T29 | integration | PS-010-02.R05 | federation.conflict.detected freezes consent:bazaar_negotiation for an open chain, then counter, accept and an inbound round are attempted, then discard_frozen; a second chain while the conflict store fails; a third chain frozen and resolved drop_all | CONFLICT_STATE for counter, accept and the inbound round, discard_frozen allowed; DEPENDENCY_UNAVAILABLE with the failing store; drop_all closes the chain frozen_discarded |

## Acceptance criteria

- All tests T01-T29 pass in CI.
- An acceptance is never shown as agreed until the seller's signed confirmation with hold and Deal reference is verified, and a late confirmation never leaves an open Deal behind an expired chain.
- Conflicting signed rounds freeze the chain and never resolve by timestamp or last writer; amounts and notes never leave the two parties' encrypted channel.

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
