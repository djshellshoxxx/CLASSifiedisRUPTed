# F02.S03.M01 — Cycle consent

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S03](../SPEC.md). **Process IDs:** PS-021-01…PS-021-10. **Code:** `packages/mutiny/src/cycle_execution/consent`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Turns a suggestion (or an accepted two-party proposal) into a Cycle that every participant holds in their own vault. Each participant consents through F08.S02.M02 comms.consent.sign (subjectType mutiny_cycle, statement key consent.mutiny.cycle.commit.v1) on the exact immutable revision digest, carried as subjectRevisionHash equal to the revision contentHash cid itself (CTR-ID-001 ID-3 form sha256-<base64url>, F02.S01.M04, N13), and each vault decides on its own whether the cycle is committed. A vault commits only when comms.consent.verify reports every participant's consent on the head digest and head revision number valid, every giver's classrup.bazaar.reservation/v1 (F02.S03.M02) is valid and unexpired, feasibility is fresh, and the vault's own clock is before the consent deadline (default 72 h, range 1 h to 7 d, at most 24 h when more than one currency is involved). Any clock disagreement counts as expired. There is no distributed lock and no atomic cross-vault commit. A signature evidences an assertion, not delivery of goods, and nothing is ever silently rerouted. This module ingests no envelope itself: consents, declines and revocations are accepted by F08.S02.M02, reservations by F02.S03.M02, revisions by F02.S01.M04 and withdrawals by F02.S03.M03, and this module reacts to their events.

## Responsibilities

- Own the Cycle aggregate and CycleConsent records as seen by one vault, with states opening, proposed, committed, executing, completed, partially_executed, declined, cancelled and frozen.
- Create a cycle from a verified suggestion (coordinator), from a peer revision 1 accepted by F02.S01.M04 (participant), or from an accepted TradeProposal, with participants, legs, revision and reservations built through the owning modules.
- React to consents, declines and revocations accepted by F08.S02.M02, reservations accepted by F02.S03.M02 and revisions accepted by F02.S01.M04, and compute the local commit verdict whenever evidence or the clock changes, re-checking every consent with comms.consent.verify inside the committing transaction.
- Freeze the cycle on forks, coordinator equivocation, conflicted consents or conflicting promises, and mirror terminal states reported by dropout and recovery modules.
- Enforce the consent-time overload guard of the length profile from local counts only, show a trust panel per participant, and cap open cycle proposals from identities with no history across all senders.
- Register the module's export section, deletion and retention purge handlers with F10 (N6) and pseudonymize erased participants in retained evidence.
- Register the F08.S02.M02 SubjectCanonicalizerPort for subjectType mutiny_cycle by inverted registration: canonicalBytes(ref, rev) from F02.S01.M04, currentRevision(ref), partyRole(ref, did) and isCommitted(ref).

## Not responsible for

- Matching and suggestions (F02.S02.M03) and feasibility checks (F02.S02.M05).
- Consent statement format, ingest, revocation and key verification primitives (F08.S02.M02, F16.S02.M03, F07.S01.M01).
- Reservations (F02.S03.M02), timeouts, withdrawals and dropouts (F02.S03.M03), handover attestations and recovery (F02.S03.M04).
- Future: threshold consent for large cycles with designated alternates, which would require explicit pre-consented alternates and is excluded now to avoid silent rerouting.

## User stories

- As a participant in a 3-party cycle, I read exactly what I give, what I receive, from whom and the value gaps, and I sign consent on that exact revision; nothing happens to my item until I sign.
- As a coordinator, I see which participants have signed, whose reservation statement is missing, and the true delivery state of every statement I sent.
- As a participant, if anyone changes the terms, revokes their consent or the deadline passes before all have signed, my consent becomes void or the cycle ends, and my reservation is released automatically.
- As a participant invited by people I have never traded with, I see how long this device has known each of them, how many completed trades it knows of, and a warning when two of them share keys.

## Edge cases

- Three of four participants signed and the fourth's consent arrives after the deadline on my clock; my vault does not commit and expires the cycle, even if the fourth's vault considers it in time.
- The coordinator revises the cycle while I am reviewing; my signing is refused with a stale revision error and I must review the new revision.
- A consent signed with a device key that was revoked yesterday arrives; F08 rejects it and the participant is shown as not consented.
- Bob revokes his consent through F08 before Dan's last consent arrives at my vault; Bob's consent is void with reason consent_revoked and my vault does not commit.
- Two participants propose the same cycleKey concurrently; the vault keeps the proposal it consented to first, and the other is stored as duplicate and cannot be consented because the item is already reserved in this vault.
- A participant declines (F08 kind decline) after signing consent; vaults that have not yet committed move to declined, and vaults that already committed hand the case to dropout handling.
- The coordinator sent revision 2 with one digest to Bob and another digest to Carol; Carol's correctly signed consent on revision 2 reaches Bob's vault with a different hash, which is equivocation evidence and freezes the cycle.
- An accepted 2-party proposal is opened as a cycle but the imported consent of one party no longer verifies; the cycle moves from opening to frozen instead of staying in opening.
- The device is offline when the last consent arrives; the verdict is computed when the vault next processes it, and the UI says 'waiting for sync' rather than committed.
- I already have 2 other open cycles and am invited to a 4-party cycle; my own vault refuses my consent with MUTINY_PARTICIPANT_OVERLOADED and nobody else learns my count.
- The cycle has 8 participants and one has maxCycleLength 6; feasibility fails and the cycle cannot be proposed.

## UX and accessibility

- Cycle review screen: ring diagram, per-participant give and receive with values, gap versus tolerance, compensation legs, accepted imbalances that name a participant, deadline in local time, feasibility checklist with basis chips, trust panel per participant (first seen here N days ago, completed trades known here, linked keys warning) and a simultaneous-handover recommendation next to new identities, the plain statement 'I agree to exchange exactly this and I understand nothing is guaranteed by ClassRup', buttons Sign and consent, Decline.
- Cycle status screen: consent chips per participant (signed, waiting, void, revoked, late), reservation chips per giver, per-statement sync state, countdown to consent deadline.
- Revision-changed banner explaining that all consents were voided and a diff of what changed.

**States:** loading; opening; reviewing; signing; awaiting-others; committed-here; declined; cancelled; expired; frozen; pending-offline; error

**Accessibility:** The consent statement is real text immediately before the Sign button, and the button name is 'Sign and consent to revision N of M participants'.; Chips for consent and reservation state use text labels and icons; changes are announced in an aria-live polite region.; Countdown is available as absolute time text and the screen is fully keyboard operable with 44 by 44 px targets.

## Owned data

- `Cycle` (classrup.mutiny.cycle/v1, P2, RET-EVIDENCE)
- `CycleConsent` (classrup.mutiny.cycle_consent/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.cycle.propose`, `mutiny.cycle.consent`, `mutiny.cycle.decline`, `mutiny.cycle.evaluate`
- Queries: `mutiny.cycle.get`, `mutiny.cycle.list_mine`, `mutiny.cycle.explain_verdict`
- Emits: `mutiny.cycle.proposed`, `mutiny.cycle.consent_recorded`, `mutiny.cycle.committed`, `mutiny.cycle.declined`
- Consumes: `mutiny.proposal.accepted`, `mutiny.proposal.revised`, `mutiny.cycle.locked`, `mutiny.cycle.unlocked`, `comms.consent.signed`, `comms.consent.received`, `comms.consent.revoked`, `mutiny.revision.forked`, `mutiny.lock.conflict_detected`, `mutiny.cycle.cancelled`, `mutiny.leg.handed_over`, `mutiny.leg.received`, `mutiny.cycle.completed`, `mutiny.cycle.partially_executed`, `identity.reputation.recomputed`, `privacy.deletion.completed`

## Dependencies

F02.S03.M02, F02.S02.M03, F02.S02.M05, F02.S01.M02, F02.S01.M03, F02.S01.M04, F02.S04.M02, F08.S02.M02, F07.S01.M01, F07.S02.M02, F07.S03.M01, F12.S03.M04, F16.S02.M03, F15.S01.M01, F11.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-021-01 | [Domain schema](domain_schema.md) | 4 |
| PS-021-02 | [Validation rules](validation_rules.md) | 4 |
| PS-021-03 | [Workflow state machine](workflow_state_machine.md) | 5 |
| PS-021-04 | [Commands, queries and events](commands_queries_events.md) | 8 |
| PS-021-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-021-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 4 |
| PS-021-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 6 |
| PS-021-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-021-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 4 |
| PS-021-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/cycle_execution/consent/index.ts`.

## Acceptance criteria

- All tests T01–T30 pass in CI.
- A cycle is committed in a vault only when every participant's valid signed consent on the head number and hash and every giver's valid unexpired reservation statement were verified in that vault before the deadline on its own clock.
- No code path adds, removes or replaces a participant of an existing cycle, and forks, equivocation or conflicting promises always freeze rather than merge.
