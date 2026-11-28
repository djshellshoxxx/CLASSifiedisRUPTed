# PS-021-02 — Validation rules: Cycle consent

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S03.M01 Cycle consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/cycle_execution/consent` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-021-02.R01** Proposing a cycle requires a verified suggestion, a fresh feasibility report, no infeasible check, reachable participants and the coordinator's own reservation.
- **PS-021-02.R02** A consent is valid only if F08.S02.M02 accepted it with subjectType mutiny_cycle and statement key consent.mutiny.cycle.commit.v1 from a non-revoked registered device key of the signer, it names this cycle, the head revision number and the head digest cid as subjectRevisionHash, comms.consent.verify reports it valid, and it arrived before the deadline on the local clock.
- **PS-021-02.R03** Commit requires every condition simultaneously and is re-checked inside the same transaction that records the last piece of evidence.
- **PS-021-02.R04** Equivocation, overload and unknown-sender limits are evaluated only from data held in this vault and never disclose another vault's data or another participant's counts.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | suggestion exists, status suggested, verifiedLocally true, not expired, the coordinator is a participant, and a keyLinked suggestion carries the principal's explicit confirmation | MUTINY_CYCLE_SUGGESTION_UNUSABLE |
| V02 | feasibility report for the head hash is ≤ 10 min old and overall is not infeasible | MUTINY_CYCLE_INFEASIBLE |
| V03 | length 2..8 and participants unique with mailbox hints and no party in the principal's own block list (F07.S02.M02, own list only) | MUTINY_CYCLE_INFEASIBLE |
| V04 | consentDeadline between now + 1 h and now + 7 d (default 72 h); when more than one currency is involved it is ≤ now + 24 h and ≤ the earliest pinned quote expiry (N16), otherwise re-quote and fresh consent; executionWindowMs between 86400000 and 1987200000 and (consentDeadline − now) + executionWindowMs ≤ 2592000000 (F02.S01.M04 V09, F02.S03.M02 V02) | MUTINY_CYCLE_DEADLINE_INVALID |
| V05 | principal has ≤ 5 non-terminal cycles and proposals combined and is within the F12.S03.M04 local limit | MUTINY_CYCLE_LIMIT |
| V06 | a counted consent has subjectRevision equal to headRevisionNo and subjectRevisionHash equal to headRevisionHash (the same ID-3 cid, never hex); the consent command presents revisionNo and revisionHash equal to the head | MUTINY_CONSENT_STALE_REVISION |
| V07 | the consent was accepted by F08.S02.M02 (own comms.consent.signed or peer comms.consent.received), the signer is a participant, subjectRef equals the cycle id, subjectType is mutiny_cycle and statementKey is consent.mutiny.cycle.commit.v1; exception: for origin trade_proposal the two consents with subjectType mutiny_proposal and statementKey consent.mutiny.proposal.accept.v1 on the same head contentHash, imported when the cycle is opened, count | MUTINY_CONSENT_STATEMENT_INVALID |
| V08 | local now < consentDeadline, and receivedAtLocal, signedAtClaim and every relayReceiptAt of a counted consent are ≤ consentDeadline; each can only shorten the window and none extends it | MUTINY_CONSENT_LATE |
| V09 | the principal's own items were reserved through F02.S03.M02 (classrup.bazaar.reservation/v1, holder {type: cycle, id: cycleId}) for this head hash before the consent was signed | MUTINY_CYCLE_RESERVATION_FAILED |
| V10 | an accepted imbalance counts only as an acceptedImbalances entry {actorId, maxAmount} of the head snapshot naming that participant, signed through that participant's consent on the head digest; the consent command takes no unsigned acceptance | VALIDATION_FAILED |
| V11 | acting on a terminal or frozen cycle | MUTINY_CYCLE_FROZEN |
| V12 | a decline counts only as an F08 ConsentStatement of kind decline accepted by F08.S02.M02 and signed by a participant of the cycle | FORBIDDEN |
| V13 | inside the committing transaction comms.consent.verify returns valid for every participant on the head digest; stale or revoked results void the consent, missing blocks the commit and conflicted freezes the cycle | MUTINY_CONSENT_STALE_REVISION |
| V14 | a correctly signed participant consent accepted by F08 whose subjectRevision equals headRevisionNo but whose subjectRevisionHash differs from headRevisionHash is equivocation evidence: both hashes are stored, mutiny.revision.report_fork is called (F02.S01.M04 emits mutiny.revision.forked), the cycle freezes and the conflicting revision may be requested from the signer | MUTINY_CONSENT_EQUIVOCATION |
| V15 | the principal's own count of other non-terminal cycles in this vault is ≤ the effective length profile's maxOtherOpenCycles (2 for length 4, F02.S02.M02) before the principal's consent is signed; the count is never sent or shown to others | MUTINY_PARTICIPANT_OVERLOADED |
| V16 | at most 3 non-terminal incoming cycles per vault, across all senders, have a coordinator with no history in this vault (projection first seen < 30 d and no completed trade known through F07.S03.M01); further ones are kept quarantined silently until the user opts in | MUTINY_CYCLE_LIMIT |
| V17 | opening from mutiny.proposal.accepted re-verifies both mutiny_proposal consents with comms.consent.verify on the same head contentHash and both reservations active in F02.S03.M02; any failure moves opening to frozen | MUTINY_CONSENT_STATEMENT_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-021-09.T03 | unit | PS-021-02.R01, PS-021-02.R03 | each rule V01..V17 violated in turn | documented error code returned, nothing signed |
| TEST-PS-021-09.T07 | integration | PS-021-02.R02, PS-021-05.R02 | consent signed by revoked key, wrong subject, wrong subjectType, wrong statement key, wrong number, wrong hash, wrong signer | not accepted by F08 or not counted here with MUTINY_CONSENT_STATEMENT_INVALID or STALE |
| TEST-PS-021-09.T21 | integration | PS-021-03.R02, PS-021-02.R03, PS-021-01.R02 | 4-party: Bob revokes his consent through F08 before Dan's last consent arrives at Alice's vault | Bob's consent void with consent_revoked; comms.consent.verify inside the evaluating transaction returns revoked; Alice's vault never commits |
| TEST-PS-021-09.T23 | contract | PS-021-04.R05, PS-021-02.R02 | F11.S01.M01 registry lookup and comms.consent.sign payload | registered signer roles match; consent uses subjectType mutiny_cycle, key consent.mutiny.cycle.commit.v1, subjectRevision equal to the head number and subjectRevisionHash equal to the head contentHash cid (a hex-encoded digest is not counted); declines are kind decline |
| TEST-PS-021-09.T25 | unit | PS-021-02.R04, PS-021-04.R06 | principal with 2 other open cycles consents to a 4-party cycle; with 1 other open cycle | MUTINY_PARTICIPANT_OVERLOADED only in the principal's own vault and no count in any statement or event; second consent allowed; declined event carries participantIds |
| TEST-PS-021-09.T26 | abuse | PS-021-07.R06, PS-021-02.R04 | 2-Sybil ring: two fresh did:key identities sharing a device key invite a real member into a 3-party cycle | trust panel shows first seen 0 days and 0 completed trades, key-linked warning, consent requires confirmation, simultaneous handover recommended; quarantined when the unknown-coordinator cap is reached |
| TEST-PS-021-09.T27 | integration | PS-021-02.R03, PS-021-02.R02 | Carol's consent sits above tolerance without an acceptedImbalances entry, then the coordinator revises with acceptedImbalances naming Carol and Carol consents | first not committable (C05 fails); after the revision every vault verifies Carol's consent on the new digest as her signed acceptance and commits |
| TEST-PS-021-09.T28 | contract | PS-021-04.R08, PS-021-02.R02 | F08 shared SubjectCanonicalizerPort conformance suite against the mutiny_cycle registration for C3 and C2 (origin trade_proposal); comms.consent.received for Bob's consent then a duplicate whose aliasOf names it | canonicalBytes equals F02.S01.M04 canonicalBytes and its ID-3 cid equals headRevisionHash for both; currentRevision returns the head; partyRole returns participant for Alice, Bob and Carol and none for Dan; isCommitted false while proposed and true after the local commit; statementLocale stored; the alias is attached as aliasIds and Bob counts once |

## Dependencies

Module depends on: F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F07.S03.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
