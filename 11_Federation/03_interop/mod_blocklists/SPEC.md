# F11.S03.M02 — Federation blocklists

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F11.S03](../SPEC.md). **Process IDs:** PS-089-01…PS-089-10. **Code:** `packages/federation/src/interop/blocklists`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

Holds block rules that keep unwanted federated statements out of a vault or relay before anything is stored. A rule matches a peer relay id, an author did:key, a statement cid or a content hash, with action reject or hide. Rules are local choices of the vault owner or the relay operator (local filtering and hosting policy, no global takedown). Shared blocklists from other publishers arrive as signed statements and are never applied without explicit review. The block list of a person is private data and is not shared unless the owner publishes a list on purpose.

## Responsibilities

- Own BlockRule records of four types (peer, author, cid, content_hash) with action reject or hide, optional expiry and a reason from a fixed enum.
- Provide evaluate(envelope, peer) used by F11.S01.M02 before storage and by F11.S02.M01 before sending, with precedence peer, author, cid, content_hash and reject over hide.
- Import a signed shared blocklist statement (classrup.federation.blocklist/v1, at most 10000 entries) into pending_review rules and apply only the entries a person or operator approves.
- Publish an owner-selected subset of own rules as a signed blocklist statement on explicit request.
- Emit federation.block_rule.changed for every add, activate, disable and remove so mirrors matching a new rule are purged.

## Not responsible for

- Per-user social blocking and mute (F07.S02.M02 owns the block relationship; this module only mirrors it as a hide rule for federated content).
- Content moderation decisions and appeals (F12).
- Relay-wide legal removal workflow (F18 and the relay operator procedure); this module only enforces the resulting rule.
- Future: subscribing to live advisory feeds with automatic updates and signed reputation scores; MVP has manual import only.

## User stories

- As a user, I can hide everything from an author or a relay in my vault and undo it, without telling anyone.
- As a relay operator, I can import a shared blocklist, review each entry and approve only the ones I agree with.
- As a relay operator, I can block a specific cid after a legal notice and see matching mirrors purged within 1 h.

## Edge cases

- Imported list has 10001 entries; refused whole with FEDERATION_BLOCKLIST_TOO_LARGE.
- Imported entry duplicates an existing active rule; skipped and counted as duplicate in the import report.
- A rule blocks the operator's own relay id; refused with FEDERATION_BLOCK_SELF.
- Rule on an author did removes mirrors but a later tombstone by that author is still processed so the tombstone chain stays consistent.
- Rule expires while a batch is in flight; evaluation uses the rule set snapshot taken at batch start.
- Imported list signed by a key the operator has never trusted; allowed to import to review only, shown with an unverified-publisher warning.
- Two rules of different types match one envelope; the highest-precedence rule decides and both are recorded as matched.

## UX and accessibility

- Block list: tabs by rule type with value (shortened), reason, source (mine or imported from publisher), action, expiry and remove.
- Import review: publisher did and fingerprint, entry count, per-entry checkboxes with reason, 'Approve selected' and 'Reject all'.
- Hidden-content notice in feeds: 'Hidden by your rules' with an undo link; relay operators see counts only.

**States:** loading; empty; pending-review; active; disabled; expired; removed; import-too-large

**Accessibility:** Import review table has header cells and checkboxes with labels including the shortened value.; Approve and reject controls are ≥ 44×44 px and bulk actions confirm in a focus-trapping dialog.; Rule changes are announced through an aria-live polite region.

## Owned data

- `BlockRule` (classrup.federation.block_rule/v1, P3, RET-STANDARD)

## Interfaces

- Commands: `federation.block_rule.add`, `federation.block_rule.import_list`, `federation.block_rule.review`, `federation.block_rule.disable`, `federation.block_rule.enable`, `federation.block_rule.remove`, `federation.block_rule.publish_list`
- Queries: `federation.block_rule.list`, `federation.block_rule.evaluate`
- Emits: `federation.block_rule.changed`
- Consumes: `identity.block.added`, `identity.block.removed`

## Dependencies

F11.S01.M03, F07.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-089-01 | [Domain schema](domain_schema.md) | 3 |
| PS-089-02 | [Validation rules](validation_rules.md) | 3 |
| PS-089-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-089-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-089-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-089-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-089-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-089-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-089-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-089-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/federation/src/interop/blocklists/index.ts`.

## Acceptance criteria

- All tests T01–T16 pass in CI.
- Block rules are evaluated before any record is stored (integration test with storage spy).
- An imported list never activates a rule without explicit per-rule review.
