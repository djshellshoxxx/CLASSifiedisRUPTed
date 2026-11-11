# F02.S01.M02 — Proposal party roster

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F02.S01](../SPEC.md). **Process IDs:** PS-014-01…PS-014-10. **Code:** `packages/mutiny/src/trade_proposals/party`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The roster of a proposal or cycle as one vault sees it: 2..8 distinct parties identified by DID with a fixed ring position, a role (coordinator or participant), the mailbox hints needed to reach them, and a status of active, left or removed. The roster is part of the signed revision snapshot, so every vault holds the same canonical list; this module keeps the local view, enforces uniqueness and runs the local block checks without revealing who blocked whom.

## Responsibilities

- Create and hold the roster for a subject, enforcing 2..8 unique parties, a single coordinator and ring positions 0..N-1.
- Check pairwise local blocks and the principal's account limits before the principal joins, and reject without disclosing which pair or which block.
- Mark parties left or removed when a signed notice, a local block, a decline or a timeout says so, emitting joined and left events for local consumers.
- Own the error code MUTINY_PARTICIPANT_DUPLICATE (N1), which F02.S02.M05 references, and register export, deletion and retention handlers with F10 (N6).

## Not responsible for

- Which items each party gives or receives (F02.S01.M03) and the revision snapshot (F02.S01.M04).
- Consent and reservation of each party (F02.S03.M01, F02.S03.M02) and dropout handling (F02.S03.M03).
- Block list storage (F07.S02.M02) and local rate or participation limits (F12.S03.M04).
- Future: adding a participant to an open proposal; in the MVP this always means a new subject with fresh consent.

## User stories

- As a proposer, I see the roster of everyone in the cycle with their pseudonyms and positions before I send the proposal.
- As a member who blocked someone, I am never put in a cycle with them and nobody is told why.
- As a participant, I can see who has left or been removed and that the cycle is not rerouted around them.

## Edge cases

- The same DID appears twice in a candidate roster; creation is refused with a duplicate error.
- A participant has no reachable mailbox hint; creation is refused because no statement could be delivered to them.
- The principal has blocked one participant locally; creation is refused with a generic blocked error that does not name the participant.
- A participant blocks another after both joined; the blocking party's vault marks itself left with reason unavailable and the other vaults learn only through a signed notice or timeout, with no reason given.
- The roster would exceed 8 parties; refused.
- A party leaves; the roster never substitutes a new party, so the subject cannot proceed unanimously and moves to cancellation in the owning module.

## UX and accessibility

- Roster list: ring position, pseudonym, avatar, role badge (coordinator), status and consent/reservation chips supplied by other modules.
- Ring diagram with N nodes and arrows from giver to receiver.

**States:** loading; ready; party-left; party-removed; error

**Accessibility:** The roster is an ordered list; the ring diagram has a text alternative with each arrow stated in words.; Status chips contain text such as 'left' in addition to color.

## Owned data

- `ProposalParty` (classrup.mutiny.proposal_party/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `mutiny.party.join`, `mutiny.party.leave`
- Queries: `mutiny.party.list_for_subject`, `mutiny.party.check_roster`
- Emits: `mutiny.party.joined`, `mutiny.party.left`
- Consumes: `identity.block.added`, `mutiny.proposal.revised`, `mutiny.cycle.declined`, `mutiny.cycle.participant_dropped`, `privacy.deletion.completed`

## Dependencies

F07.S01.M01, F07.S02.M02, F12.S03.M04, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-PRV-001, CTR-SCH-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-014-01 | [Domain schema](domain_schema.md) | 3 |
| PS-014-02 | [Validation rules](validation_rules.md) | 3 |
| PS-014-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-014-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-014-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-014-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-014-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-014-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-014-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-014-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/mutiny/src/trade_proposals/party/index.ts`.

## Acceptance criteria

- All tests T01–T15 pass in CI.
- No error, event or log reveals who blocked whom.
- A left party is never replaced and ring positions never change after a revision is sealed.
