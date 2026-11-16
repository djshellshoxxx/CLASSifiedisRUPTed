# F18.S01.M03 — Goods taxonomy

**Status:** SPECIFIED (Stage 3). **Scope:** MVP. **Parent:** [F18.S01](../SPEC.md). **Process IDs:** PS-144-01…PS-144-10. **Code:** `packages/governance/src/policy/goods`.

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Purpose

The hierarchical goods taxonomy (maximum depth 4) with stable category ids, localized names and a restricted flag. It is configuration, not law. A taxonomy is authored by a publisher (the project's bundled seed pack, or a relay operator's own vault) and distributed as a signed taxonomy pack statement (classrup.governance.taxonomy_pack/v1, Ed25519 over JCS). Each user vault verifies the pack against the publishers the user trusts and keeps a read-only mirror of the Category records, so listing, search and matching work offline. Category ids never change meaning; retiring a category requires a merge target.

## Responsibilities

- [object Object]
- Author and release signed taxonomy packs in a publisher vault (create, update, move, deprecate, retire, release_pack) with at most 2 000 categories and 50 children per node.
- [object Object]
- Serve read queries to other modules (get, list_children, tree, resolve alias) from the local mirror.
- Ship the bundled seed pack (12 top-level groups, about 300 categories) so a vault works with no relay.

## Not responsible for

- Prohibited-item rules (F18.S01.M02) and jurisdiction profiles (F18.S01.M01); this module only holds the restricted flag they reference.
- Listings that use categories (F01.S01.M01) and search facets (F06.S01.M03).
- Deciding policy changes (F18.S02.M01); restricted-flag changes require an approved proposal reference.
- Translating names into every language; locales beyond the shipped set are contributed by publishers.
- Future: attribute schemas per category and cross-pack category mapping.

## User stories

- As a seller, I choose a category from a tree up to four levels deep, in my own language.
- As a relay operator, I publish a taxonomy with my own extra categories and the users who trust my relay get it.
- As a user, I can see who published the taxonomy I use and which version it is.

## Edge cases

- A pack arrives signed by an untrusted key; it is stored as pending with the publisher fingerprint and not applied until the user trusts that publisher.
- A pack skips versions; it is accepted only if it is a full snapshot with a higher version, and the diff is shown before applying.
- A pack would move a category to depth 5 or create a parent cycle; the whole pack is rejected with GOVERNANCE_CATEGORY_TREE_INVALID.
- A pack retires a category in use by published listings; the category becomes retired with mergedInto set, and listings keep working through resolve alias.
- The restricted flag is switched on without an approved proposal reference; the author command fails with GOVERNANCE_CATEGORY_PROPOSAL_REQUIRED.
- Two publishers use the same key string for different categories; ids, not keys, identify categories, and the second pack is namespaced by publisher id.
- The vault is offline for months; the last applied pack keeps working and the UI shows the pack age.

## UX and accessibility

- Category picker: expandable tree with search, localized names, breadcrumb of the path, restricted badge with explanation, deprecated categories hidden for new listings.
- Taxonomy settings: current pack, publisher fingerprint, version, age, pending packs with diff summary, Trust and Apply actions.
- Publisher editor (operators): tree editor with add, rename, move and retire; release pack button with change summary.

**States:** loading; empty; offline-cached; pack-pending; pack-applied; pack-rejected; restricted; deprecated

**Accessibility:** Tree uses the ARIA tree pattern with keyboard navigation and announces level and position.; Moving a category has a Move to button flow as the single-pointer alternative to drag (WCAG 2.5.7).; Restricted status is shown with text and icon, not colour alone.

## Owned data

- `Category` (classrup.governance.category/v1, P0, RET-STANDARD)

## Interfaces

- Commands: `governance.category.create`, `governance.category.update`, `governance.category.move`, `governance.category.set_status`, `governance.category.release_pack`, `governance.category.apply_pack`
- Queries: `governance.category.get`, `governance.category.list_children`, `governance.category.tree`, `governance.category.resolve`
- Emits: `governance.category.changed`
- Consumes: none

## Dependencies

F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001

## Process specifications and aggregation

| ID | Process | Requirements |
|---|---|---|
| PS-144-01 | [Domain schema](domain_schema.md) | 3 |
| PS-144-02 | [Validation rules](validation_rules.md) | 3 |
| PS-144-03 | [Workflow state machine](workflow_state_machine.md) | 3 |
| PS-144-04 | [Commands, queries and events](commands_queries_events.md) | 3 |
| PS-144-05 | [Authorization and capabilities](authorization_capabilities.md) | 3 |
| PS-144-06 | [Failure recovery and idempotency](failure_recovery_idempotency.md) | 3 |
| PS-144-07 | [Privacy, retention and abuse](privacy_retention_abuse.md) | 3 |
| PS-144-08 | [Observability and performance](observability_performance.md) | 3 |
| PS-144-09 | [Contract and acceptance tests](contract_and_acceptance_tests.md) | 3 |
| PS-144-10 | [Import, export, backup and rollback](import_export_backup_rollback.md) | 3 |

Aggregation: the domain schema (01) defines the records validated by 02 and transitioned by the state machine (03); 04 exposes those transitions as commands/queries/events through the kernel command bus, guarded by the capabilities in 05 and the idempotency/concurrency rules in 06; 07 and 08 constrain every path; 09 verifies all requirements; 10 defines how data leaves, returns and survives failure. The module's public API is `packages/governance/src/policy/goods/index.ts`.

## Acceptance criteria

- All tests T01-T15 pass in CI.
- A pack changes a vault only after signature, publisher trust and tree validation succeed, atomically.
- Category ids are never reused, depth never exceeds 4, and retired categories always resolve to a merge target.
