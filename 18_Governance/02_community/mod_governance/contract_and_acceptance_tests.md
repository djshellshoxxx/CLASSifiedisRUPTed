# PS-147-09 — Contract and acceptance tests: Community governance

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S02.M01 Community governance](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/community/governance` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-147-09.R01** Every requirement is covered by at least one automated test.
- **PS-147-09.R02** Contract tests validate statements, commands and events against the registry and verify signatures.
- **PS-147-09.R03** Time-based behaviour is tested with injected clocks for vault and relay separately.

## Specification

See the module test table below (all processes).

**Fixtures:** Publisher vault P (key KP), decider vault D (key KD listed as decider 30 days before), co-signer vault C (KC listed as cosigner), late key KL listed 3 days before the proposal, member vaults M1 and M2, third vault V, relay stub R with its own clock and receipt key, 200 generated keys from 203.0.113.0/24, clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-147-09.T01 | unit | PS-147-01.R01, PS-147-02.R01, PS-147-02.R02 | draft a proposal with valid and invalid fields | stored with revision 1 and changeDigest; invalid length, target or change keys give documented error |
| TEST-PS-147-09.T02 | unit | PS-147-01.R02, PS-147-01.R03, PS-147-02.R03 | violate each rule V01-V16 | documented error code returned; no statement produced or accepted |
| TEST-PS-147-09.T03 | property | PS-147-03.R01, PS-147-03.R03 | random command, receive and clock sequences in authoring and mirror vaults | only declared transitions; conflicted never leaves; a decision is never reversed |
| TEST-PS-147-09.T04 | integration | PS-147-03.R02, PS-147-02.R03, PS-147-02.R04 | comment accepted by relay clock after the publisher clock ended; publisher clock skewed by 2 days | relay receipt decides acceptance and commentEndsAt = proposal receipt + period; UI labels other times as claims |
| TEST-PS-147-09.T05 | contract | PS-147-04.R01, PS-147-04.R02, PS-147-04.R06, PS-147-09.R02 | open, request_cosign, cosign, decide, withdraw, authority_list release, post and withdraw comment, receive | statements validate against their schemas and F11.S01.M01 registry rows (audience, signer role, resolution, maxAge); every signing command returns syncState prepared and takes relayIds |
| TEST-PS-147-09.T06 | integration | PS-147-04.R03, PS-147-02.R03, PS-147-02.R04 | verify with the exact targets, a subset, another target, publisher B citing publisher A's decision, a changed digest, asOf 31 days after the decision anchor, a prior decision cid | valid only for subset with matching publisher and digest inside the window; reasons target_mismatch, publisher_mismatch, content_mismatch, expired and already_used |
| TEST-PS-147-09.T07 | abuse | PS-147-05.R01, PS-147-05.R03, PS-147-01.R05 | proposer decides own proposal; KL decides; an unlisted key decides; untrusted publisher decision | GOVERNANCE_PROPOSAL_SELF_DECISION or decider_unauthorized; statements quarantined |
| TEST-PS-147-09.T08 | abuse | PS-147-05.R02, PS-147-07.R03 | non-registered key comments; sixth comment; 11 comments in an hour; moderator hides; anonymous relay_list | relay refuses; GOVERNANCE_COMMENT_LIMIT; RATE_LIMITED; hide affects that relay only; relay_list returns UNAUTHENTICATED; notifications carry only reference and template key |
| TEST-PS-147-09.T09 | integration | PS-147-06.R01, PS-147-06.R02 | replay decide with the same key; crash after signing in the decider vault | one decision statement; consistent state after restart; no other vault changed |
| TEST-PS-147-09.T10 | integration | PS-147-06.R03, PS-147-03.R04 | two conflicting decisions delivered to a receiver | proposal marked conflicted; verify returns false with reason conflicted; decided event with outcome conflicted |
| TEST-PS-147-09.T11 | chaos | PS-147-06.R04 | relay down while a comment is posted and a decision is queued; relay recovers; later decision lists the comment cid | states prepared, then transport_acknowledged labelled 'accepted for hosting by relay R' on the receipt, then peer_accepted only after the verified decision lists the cid |
| TEST-PS-147-09.T12 | abuse | PS-147-07.R01, PS-147-07.R02, PS-147-07.R03 | scan notifications, logs and exports; assert UI strings | no comment content in notifications or logs; retention classes as specified; hidden comment kept for audit; comment form shows 'pseudonymity is not anonymity' |
| TEST-PS-147-09.T13 | load | PS-147-08.R01, PS-147-08.R02, PS-147-08.R03 | 1 000 comments on Moto G profile, relay at 50 req/s | verify p95 <= 20 ms, receive p95 <= 80 ms, relay p95 <= 300 ms, no telemetry |
| TEST-PS-147-09.T14 | unit | PS-147-09.R01, PS-147-09.R03 | traceability tool run | every PS-147 requirement maps to a passing test |
| TEST-PS-147-09.T15 | integration | PS-147-10.R01, PS-147-10.R02, PS-147-10.R03 | export, import to fresh vault, import tampered decision | proposals, decisions, authority lists and trusted publishers round-trip; tampered statement quarantined |
| TEST-PS-147-09.T16 | a11y | PS-147-01.R01 | axe run on proposal detail, comment form and trust dialog | zero serious or critical issues; keyboard-only commenting works |
| TEST-PS-147-09.T17 | integration | PS-147-03.R04, PS-147-06.R02, PS-147-06.R03 | publisher P withdraws while decider D, offline, approves; deliver both to third vault V in both orders | V marks conflicted with both cids in either order; verify returns conflicted; a new proposal is required |
| TEST-PS-147-09.T18 | abuse | PS-147-02.R04, PS-147-04.R03, PS-147-03.R02 | proposal with openedAt backdated by 3 days; decision received 1 h after the proposal receipt; decision without a receipt | openedAt rejected (below receipt - 10 min); verify returns period_not_elapsed for both decisions |
| TEST-PS-147-09.T19 | abuse | PS-147-07.R05 | 200 fresh keys from one /24 each comment on one proposal; a blocked author comments | at most 25 accepted, the rest RATE_LIMITED; the blocked author's comment is dropped silently from comment.list |
| TEST-PS-147-09.T20 | integration | PS-147-07.R04, PS-147-04.R02 | author withdraws a comment; DeletionPort plan and sign step for a deleting principal with 3 comments; privacy.deletion.requested then cancelled | tombstone signed; relay removes the body and returns tombstone stubs in relay_list; mirrors delete it; sign step signs 3 tombstones; posting paused then resumed |
| TEST-PS-147-09.T21 | integration | PS-147-01.R04, PS-147-03.R05, PS-147-04.R05 | untrusted pack held; trust added from the dialog; sync ingestion calls trusted_publisher.add; another pending item expires; owner refuses one; owner pauses a trusted publisher, a new statement arrives, owner resumes | held item applied through PendingApplyPort; ingestion call FORBIDDEN; expired item discarded after 30 days; refused item refused; paused statement held with paused_publisher and applied on resume while applied configuration stayed in force |
| TEST-PS-147-09.T22 | unit | PS-147-01.R05, PS-147-05.R04 | expedited proposal without co-signature, with a co-signature by KC, with a co-signature by an unlisted key; inspect the proposal detail UI string | GOVERNANCE_PROPOSAL_PERIOD_INVALID, accepted, rejected; UI shows 'a different key, not proof of a different person' |
| TEST-PS-147-09.T23 | contract | PS-147-04.R04 | decided event delivered to an F12.S02.M03 fixture for targetType platform_policy | payload validates; fixture builds a draft PolicyRule from proposedChange without calling get |

## Acceptance criteria

- All tests T01-T23 pass in CI.
- No policy change is applied by a consuming module without a verified approved decision from a delegated key different from the publisher, for that publisher, those targets and that exact content, at an anchored activation time inside the 30-day window.
- The UI never presents a proposal decision as binding beyond the publishers a user trusts, times from other parties are labelled as claims, and contradicting statements are shown as conflicted.

## Dependencies

Module depends on: F16.S02.M03, F11.S01.M01, F15.S02.M01, F12.S03.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
