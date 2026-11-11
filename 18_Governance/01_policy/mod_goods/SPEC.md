# F18.S01.M03 — Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S01](../SPEC.md). **Process IDs:** PS-144-01…PS-144-10. **Code:** `packages/governance/src/policy/goods`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The hierarchical goods taxonomy (maximum depth 4) with stable category ids, localized names and a restricted flag. It is configuration, not law. A taxonomy is authored by a publisher (the project's bundled seed pack, or a relay operator's own vault) and distributed as a signed taxonomy pack statement (classrup.governance.taxonomy_pack/v1, Ed25519 over JCS). Each user vault verifies the pack against the publishers the user trusts for scope taxonomy (F18.S02.M01), verifies the approved policy decision behind every restricted-flag change and retirement, and keeps a read-only mirror of the Category records, so listing, search and matching work offline. A relay applies its operator's pack as its own hosting taxonomy. Category ids never change meaning and are never shared between publishers; retiring a category requires a prior deprecation and a merge target.

## Responsibilities

- [object Object]
- Author and release signed taxonomy packs in a publisher vault (create, update, move, deprecate, retire, release_pack) with at most 2 000 categories and 50 children per node, embedding the decisions that approve restricted-flag changes and retirements.
- [object Object]
- Serve read queries to other modules (get, list_children, tree, resolve alias) from the local mirror, and serve the operator's pack from a relay (relay_upload, relay_latest).
- Ship the bundled seed pack (12 top-level groups, about 300 categories) so a vault works with no relay.

## Not responsible for

- Prohibited-item rules (F18.S01.M02) and jurisdiction profiles (F18.S01.M01); this module only holds the restricted flag they reference.
- Listings that use categories (F01.S01.M01) and search facets (F06.S01.M03).
- Deciding policy changes (F18.S02.M01); restricted-flag changes and retirements require an approved decision verified through governance.policy_proposal.verify.
- The trusted-publisher list and the pending inbox (F18.S02.M01).
- Translating names into every language; locales beyond the shipped set are contributed by publishers.
- Future: attribute schemas per category and cross-pack category mapping.

## User stories

- As a seller, I choose a category from a tree up to four levels deep, in my own language.
- As a relay operator, I publish a taxonomy with my own extra categories and the users who trust my relay get it.
- As a user, I can see who published the taxonomy I use and which version it is, and I review changes to restricted flags before they apply.

## Edge cases

- A pack arrives signed by an untrusted key; it is held in the F18.S02.M01 pending inbox with the publisher fingerprint and applied only after the owner trusts that publisher for scope taxonomy in the trust dialog.
- A pack skips versions; it is accepted only if it is a full snapshot with a higher version, and the diff is shown before applying.
- A pack would move a category to depth 5 or create a parent cycle; the whole pack is rejected with GOVERNANCE_CATEGORY_TREE_INVALID.
- A pack retires a category in use by published listings; the category becomes retired with mergedInto set, and listings keep working through resolve alias.
- The restricted flag is switched on without an approved proposal reference; the author command fails with GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED, and a receiving vault that gets such a pack keeps the previous flag and marks the change pending with the same code.
- Two publishers use the same key string for different categories; ids, not keys, identify categories, and the second pack is namespaced by publisher id.
- A second publisher's pack reuses a category id that the vault already holds for another publisher; the pack is rejected with GOVERNANCE_CATEGORY_TREE_INVALID.
- A pack retires an active category directly, or one deprecated less than 30 days earlier; the pack is rejected with GOVERNANCE_CATEGORY_TREE_INVALID.
- A trusted publisher's pack flips restricted flags with valid decisions; the user vault holds it for owner review with the diff and Apply and Refuse actions.
- The vault is offline for months; the last applied pack keeps working, the UI shows the pack age, and the next pack applies because decisions are checked at the pack's anchored activation time, not at the vault's clock.

## UX and accessibility

- Category picker: expandable tree with search, localized names, breadcrumb of the path, restricted badge with explanation, deprecated categories hidden for new listings.
- Taxonomy settings: current pack, publisher fingerprint, version, age, held changes waiting for a decision, pending packs with diff summary, Apply and Refuse actions (trust is granted only in the F18.S02.M01 trust dialog).
- Publisher editor (operators): tree editor with add, rename, move, deprecate and retire; proposal reference field for restricted and retire changes; release pack button with change summary.

**States:** loading; empty; offline-cached; pack-pending; pack-review; pack-applied; pack-rejected; change-held; restricted; deprecated

**Accessibility:** Tree uses the ARIA tree pattern with keyboard navigation and announces level and position.; Moving a category has a Move to button flow as the single-pointer alternative to drag (WCAG 2.5.7).; Restricted status is shown with text and icon, not colour alone; the review diff is a table with headers.

## Owned data

- `Category` (classrup.governance.category/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `governance.category.create`, `governance.category.update`, `governance.category.move`, `governance.category.set_status`, `governance.category.release_pack`, `governance.category.apply_pack`, `governance.category.relay_upload`
- Queries: `governance.category.get`, `governance.category.list_children`, `governance.category.tree`, `governance.category.resolve`, `governance.category.relay_latest`
- Emits: `governance.category.changed`
- Consumes: `governance.policy_proposal.decided`

## Dependencies

F18.S02.M01, F16.S02.M03, F11.S01.M01, F15.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-144-01 | [Domain schema](domain_schema.md) | 4 |
| PS-144-02 | [Validation rules](validation_rules.md) | 5 |
| PS-144-03 | [Workflow state machine](workflow_state_machine.md) | 4 |
| PS-144-04 | [Commands, queries and events](commands_queries_events.md) | 5 |
| PS-144-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-144-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-144-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 4 |
| PS-144-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-144-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-144-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/policy/goods/index.ts`.

## Acceptance criteria

- All tests T01-T20 pass in CI.
- A pack changes a vault only after signature, publisher trust, tree validation and decision verification succeed, atomically, and restricted flips and retirements reach a user vault only after owner review.
- Category ids are never reused or shared between publishers, depth never exceeds 4, and retired categories always resolve to a merge target after at least 30 days of deprecation.
