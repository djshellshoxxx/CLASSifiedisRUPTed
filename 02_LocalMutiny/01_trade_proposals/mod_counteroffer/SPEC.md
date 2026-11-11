# F02.S01.M04 — Barter counteroffers

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S01](../SPEC.md). **Process IDs:** PS-012-01…PS-012-10. **Code:** `packages/mutiny/src/trade_proposals/counteroffer`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

A ProposalRevision is an immutable, author-signed statement that freezes the exact terms of a direct trade proposal or an N-party cycle proposal: parties, legs, compensation legs, normalized values with pinned quotes, deadlines and the feasibility evidence. Its content hash (cid of the RFC 8785 JCS bytes of the snapshot) is the digest every consent signs. Any change creates a new revision with a higher number and voids all earlier consents. At most 20 revisions exist per subject. Counteroffers on direct proposals alternate between the two parties; a cycle is revised only by its coordinator and only for terms that do not change participants or items, so no revision can silently reroute a cycle.

## Responsibilities

- Build the canonical snapshot, compute contentHash, sign it with the author's Ed25519 key and store it; ingest and verify revisions authored by others.
- Enforce revision numbering 1..20, the prev hash chain, turn-taking on direct proposals, coordinator-only revisions on cycles and the closed-subject rule.
- Detect forks (two valid revisions with the same subject and number but different hash) and signal them so consent modules freeze the subject.
- Provide diff between two revisions for the consent screen and verify that a presented digest equals the stored snapshot.

## Not responsible for

- Collecting or verifying consent signatures (F02.S01.M01 for direct proposals, F02.S03.M01 for cycles, F08.S02.M02 ConsentStatement).
- Defining legs (F02.S01.M03), roster (F02.S01.M02), compensation (F02.S04.M01) and normalization (F02.S04.M02); it only references and seals them.
- Delivery of statements (F15.S01.M01 sync outbox and user-selected relays).
- Future: revision branches merged by explicit three-way review, and zero-knowledge proofs of tolerance compliance.

## User stories

- As a proposal recipient, I can counter by changing the items I give, and the other party sees a diff of exactly what changed and must consent again to the new revision.
- As a cycle coordinator, I can add a compensation leg or refresh an expired quote, and every participant is asked to consent again to the new digest.
- As any participant, I can verify that the digest I sign equals the hash of the terms I am looking at.

## Edge cases

- The twenty-first revision is attempted; it is refused with MUTINY_REVISION_LIMIT and the parties must start a new proposal.
- Both parties of a direct proposal counter at the same time while offline; both revisions claim number 3, the vault detects a fork and freezes the proposal for explicit renegotiation, with no last-writer-wins.
- A cycle participant other than the coordinator tries to revise; the vault refuses it and the statement received from such an author is quarantined.
- A revision arrives whose snapshot hash does not match its contentHash; it is quarantined as tampered.
- A revision is created after the subject was accepted or cancelled; it is refused with CONFLICT_STATE.
- A revision claims a createdAt more than 5 minutes in the local future; it is quarantined because other parties' timestamps are claims.
- A cycle revision tries to remove or replace a participant; it is refused as MUTINY_REVISION_MATERIAL_FORBIDDEN because a different set of people is a new cycle with fresh consent.

## UX and accessibility

- Counter sheet on a direct proposal: current legs, editable items and compensation, 'what changes' diff preview, Send counter (signs the revision).
- Revision history list: numbered revisions 1..20, author pseudonym, reason, time claimed, signature status and sync state.
- Diff view between two revisions with added, removed and changed lines in plain language.

**States:** loading; draft; signing; prepared; transport-acknowledged; peer-accepted; quarantined; forked; closed

**Accessibility:** Diff lines are real list items with text 'Added', 'Removed' or 'Changed' in addition to color and icons.; Sync state labels are text and announced through an aria-live polite region when they change.; Send counter is a button of at least 44 by 44 px whose accessible name includes the revision number.

## Owned data

- `ProposalRevision` (classrup.mutiny.proposal_revision/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.revision.create`, `mutiny.revision.ingest`
- Queries: `mutiny.revision.get`, `mutiny.revision.list_for_subject`, `mutiny.revision.diff`
- Emits: `mutiny.proposal.revised`, `mutiny.revision.forked`
- Consumes: `mutiny.proposal.accepted`, `mutiny.proposal.rejected`, `mutiny.proposal.expired`, `mutiny.cycle.committed`, `mutiny.cycle.declined`, `mutiny.cycle.cancelled`, `mutiny.normalization.expired`

## Dependencies

F02.S01.M02, F02.S01.M03, F02.S02.M05, F02.S04.M01, F02.S04.M02, F07.S01.M01, F16.S02.M03, F15.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-012-01 | [Domain schema](domain_schema.md) | 4 |
| PS-012-02 | [Validation rules](validation_rules.md) | 3 |
| PS-012-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-012-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-012-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-012-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-012-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-012-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-012-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-012-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/trade_proposals/counteroffer/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI.
- A consent can only ever bind a contentHash that equals the hash of the displayed snapshot.
- No revision can add, remove or replace a participant of an existing cycle, and forks always freeze the subject.
