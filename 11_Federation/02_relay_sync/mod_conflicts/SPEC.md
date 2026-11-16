# F11.S02.M03 — Federated conflicts

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S02](../SPEC.md). **Process IDs:** PS-086-01…PS-086-10. **Code:** `packages/federation/src/relay_sync/conflicts`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Detects forked or equivocating signed statements, quarantines them and drives review. A fork is two valid envelopes by the same author with the same seq but different cids, a prev that does not match the stored chain, or two conflicting signed promises (consent, money, inventory, reservation, identity revocation) about the same subject. Public projections follow an origin-wins policy after a 7-day review window. Commitments are never auto-resolved: dependent coordination is frozen and the parties must renegotiate, with no last-writer-wins. In a vault the local principal reviews; on a relay the relay operator reviews.

## Responsibilities

- Own ConflictRecord and open one when F11.S02.M02 returns fork or when a commitment conflict is detected against the vault's signed promise index.
- Classify each conflict as public_projection or commitment from the statement type registry in F11.S01.M01.
- Freeze commitment conflicts by emitting federation.conflict.detected with the frozen subject IDs so domain modules (proposals, reservations, consents) stop acting until renegotiation.
- Apply the origin-wins policy to public projections after 7 days without review, keeping the version first received from the relay bound to the author, and record that this is a policy choice, not proof.
- Record resolution (keep one cid, drop all, or superseded by a renegotiated statement) and emit federation.conflict.resolved.

## Not responsible for

- Fork arithmetic on seq and prev (F11.S02.M02 decides; this module records and drives review).
- Storing or purging envelopes (F11.S01.M02 consumes the conflict events and changes record status).
- Negotiating the new terms of a frozen commitment (the owning domain module, for example F02 mutiny, F09 deals).
- Peer suspension for equivocating relays (F11.S03.M01 consumes the detected event as a health signal).
- Future: automated gossip of equivocation proofs between relays and cryptographic fork proofs published as signed statements.

## User stories

- As a user, when two conflicting signed acceptances arrive for the same offer, I see the dependent trade frozen with both statements side by side and I am asked to renegotiate.
- As a relay operator, I can review a forked author's two listing versions, keep one and see that both signatures verify.
- As a reader of a public listing, I see a notice that the author published conflicting versions and that none is shown until review or the 7-day policy applies.

## Edge cases

- Both fork candidates arrive in one batch; one ConflictRecord is opened containing both cids, not two.
- A third candidate for the same author and seq arrives later; it is appended to the same open record (maximum 5 candidates).
- Author legitimately re-signs a corrected record with a new seq that supersedes both and names their cids in ext.supersedes; the conflict becomes superseded.
- Commitment conflict where a consent was signed twice with different proposal digests; frozen, never auto-resolved even after 30 days.
- Operator resolves a conflict while the relay's bound origin for the author changes by a move record; the resolution is recorded with the binding at decision time.
- Both candidates contain identical payload bytes but different createdAt claims; still treated as a fork because the cids differ.

## UX and accessibility

- Conflict review: two columns with each candidate's cid prefix, claimed time (labelled claim), relay receipt time if any (labelled evidence of that relay's clock), signer role verified and a diff of payload fields.
- Frozen coordination banner on the affected proposal or deal: 'Conflicting signed statements received; actions paused. Renegotiate or ask the counterparty to resend.'
- Relay operator queue: open conflicts by age with 7-day auto-resolution countdown for public projections.

**States:** loading; empty; open; frozen; resolved; auto-resolved; superseded

**Accessibility:** Candidate columns are a table with row and column headers and the diff is not conveyed by colour alone.; Keep and drop buttons are ≥ 44×44 px, name the cid prefix in their accessible names and ask for confirmation in a focus-trapping dialog.; Status changes announced through an aria-live polite region.

## Owned data

- `ConflictRecord` (classrup.federation.conflict/v1, P1, RET-EVIDENCE)

## Interfaces

- Commands: `federation.conflict.detect`, `federation.conflict.resolve`
- Queries: `federation.conflict.list`, `federation.conflict.get`
- Emits: `federation.conflict.detected`, `federation.conflict.resolved`
- Consumes: `federation.account.moved`, `federation.peer.suspended`

## Dependencies

F11.S02.M02, F11.S01.M03, F11.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-086-01 | [Domain schema](domain_schema.md) | 3 |
| PS-086-02 | [Validation rules](validation_rules.md) | 3 |
| PS-086-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-086-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-086-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-086-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-086-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-086-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-086-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-086-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/relay_sync/conflicts/index.ts`.

## Acceptance criteria

- All tests T01–T17 pass in CI.
- No commitment (consent, money, inventory) conflict is ever resolved by last-writer-wins or by timeout.
- Forged role-less statements cannot freeze a trade (abuse test).
