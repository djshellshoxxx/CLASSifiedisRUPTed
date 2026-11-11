# F11.S02.M03 — Federated conflicts

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S02](../SPEC.md). **Process IDs:** PS-086-01…PS-086-10. **Code:** `packages/federation/src/relay_sync/conflicts`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Detects forked or equivocating signed statements, quarantines them and drives review. A fork is two valid envelopes with the same chain key (author, signer key, stream) and seq but different cids, or a prev that contradicts a stored neighbour; a commitment conflict is two verified statements whose registry subject key is the same and whose digests differ under the registry predicate (consent, money, inventory, reservation, identity move); a key-compromise conflict is one commitment statement that this vault first received inside the claimed compromise window of its later revoked signer key. F11.S01.M02 calls detect inside the receive transaction and quarantines every candidate there, and domain modules check is_frozen synchronously before acting, so the freeze never fails open. Public projections follow an origin-wins policy after a 7-day review window, based on the relays listed in the author's own portable identity document, never on a relay binding. Commitments are never resolved by keeping one side: the vault principal can only release the freeze locally (drop_all) or close it with a renegotiated statement every required signer signed, with no last-writer-wins. In a vault the local principal reviews; on a relay the operator reviews public projections only.

## Responsibilities

- Own ConflictRecord and open one when F11.S02.M02 returns fork, when F11.S01.M02 finds a commitment conflict in its promise index or quarantines a commitment statement signed during a claimed key compromise, or when F11.S03.M03 receives conflicting move statements.
- Classify each conflict as public_projection or commitment from the statement-type registry in F11.S01.M01 and take its subject key and predicate from there.
- Freeze commitment conflicts in the detecting transaction, emit federation.conflict.detected with the frozen subject IDs, and answer the synchronous is_frozen check that domain modules call before acting (fail closed).
- Apply the origin-wins policy to public projections after 7 days without review, keeping the candidate first received from a relay listed in the author's latest verified portable document, and record that this is a policy choice, not proof.
- Record resolution (keep one cid or drop_all for public projections; drop_all or superseded by a statement signed by every required signer for commitments) and emit federation.conflict.resolved with candidateCids, statementClass and freezeScope.
- Attribute forks to the author with an author-level limit of 20 open conflicts, after which the author's further envelopes are quarantined; forwarding relays are never blamed.
- Register the N6 privacy ports and pseudonymize retained conflict evidence only in its F10.S01.M04 DeletionPort pseudonymize step, the only call that receives the pseudonym, never on privacy.deletion.completed (N6a).

## Not responsible for

- Fork arithmetic on seq and prev (F11.S02.M02 decides; this module records and drives review).
- Storing, holding or purging envelopes and the promise index itself (F11.S01.M02 consumes the conflict events and changes record status).
- Negotiating the new terms of a frozen commitment (the owning domain module, for example F01.S04.M01 offers, F02 proposals, F09 deals).
- Peer suspension (F11.S03.M01 acts only on conflicts among statements signed by a pinned relay key).
- Future: automated gossip of equivocation proofs between relays and cryptographic fork proofs published as signed statements.

## User stories

- As a user, when two conflicting signed acceptances arrive for the same offer, I see the dependent trade frozen with both statements side by side and I am asked to renegotiate or release it.
- As a relay operator, I can review a forked author's two listing versions, keep one and see that both signatures verify.
- As a reader of a public listing, I see a notice that the author published conflicting versions and that none is shown until review or the 7-day policy applies.
- As a domain module, I can ask synchronously whether a subject is frozen before I act, and I refuse to act if the answer is unavailable.

## Edge cases

- Both fork candidates arrive in one batch; one ConflictRecord is opened containing both cids, not two.
- A third candidate for the same chain key and seq arrives later; it is appended to the same open record (maximum 5 candidates).
- Author legitimately re-signs a corrected record with a new seq that supersedes both and names their cids in ext.supersedes; the public_projection conflict becomes superseded.
- Commitment conflict where a consent was signed twice with different proposal digests; frozen, never auto-resolved even after 30 days, and resolve with keep is refused.
- A party tries to settle a commitment conflict alone by superseding with a statement only it signed; refused with FEDERATION_CONFLICT_NOT_AUTO_RESOLVABLE until every required signer has signed the new digest.
- A relay operator tries to resolve a commitment conflict; refused with FORBIDDEN (relays hold public projections only).
- The author publishes a new portable document listing a different relay while a public conflict is open; the listed relays used by origin-wins are recomputed before the 7-day decision.
- Both candidates contain identical payload bytes but different createdAt claims; still treated as a fork because the cids differ.
- A device key is revoked with revocationEffectiveFrom 3 days back and this vault accepted a consent signed by it 2 days ago; F11.S01.M02 opens a key_compromise conflict with that single candidate, the proposal is frozen, and only drop_all or a consent re-signed with a current key by every required signer closes it.
- An author forks 21 times through two honest relays; the 21st puts the author's further envelopes in author-level quarantine, and neither relay's health changes.

## UX and accessibility

- Conflict review: two columns with each candidate's cid prefix, claimed time (labelled claim), relay receipt time if any (labelled evidence of that relay's clock), whether it came from a relay listed in the author's identity document, signer role verified and a diff of payload fields.
- Frozen coordination banner on the affected proposal or deal: 'Conflicting signed statements received; actions paused. Renegotiate with everyone involved, or release this locally.'
- Relay operator queue: open public-projection conflicts by age with 7-day auto-resolution countdown.

**States:** loading; empty; open; frozen; resolved; auto-resolved; superseded; check-unavailable

**Accessibility:** Candidate columns are a table with row and column headers and the diff is not conveyed by colour alone.; Keep and drop buttons are ≥ 44×44 px, name the cid prefix in their accessible names and ask for confirmation in a focus-trapping dialog.; Status changes announced through an aria-live polite region.

## Owned data

- `ConflictRecord` (classrup.federation.conflict/v1, P2, RET-EVIDENCE)

## Interfaces

- Commands: `federation.conflict.detect`, `federation.conflict.resolve`
- Queries: `federation.conflict.list`, `federation.conflict.get`, `federation.conflict.is_frozen`
- Emits: `federation.conflict.detected`, `federation.conflict.resolved`
- Consumes: `federation.account.moved`, `identity.portable_doc.published`, `federation.peer.suspended`, `privacy.deletion.completed`

## Dependencies

F11.S02.M02, F11.S01.M03, F11.S01.M01, F07.S02.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-086-01 | [Domain schema](domain_schema.md) | 5 |
| PS-086-02 | [Validation rules](validation_rules.md) | 5 |
| PS-086-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-086-04 | [Commands, queries and events](commands_queries_events.md) | 4 |
| PS-086-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-086-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-086-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 5 |
| PS-086-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-086-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-086-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/relay_sync/conflicts/index.ts`.

## Acceptance criteria

- All tests T01–T24 pass in CI.
- No commitment (consent, money, inventory, identity) conflict is ever resolved by keep, last-writer-wins, timeout or a unilateral supersede.
- Forged role-less statements cannot freeze a trade, and is_frozen fails closed (abuse and integration tests).
