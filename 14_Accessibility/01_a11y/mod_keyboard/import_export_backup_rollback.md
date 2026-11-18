# PS-109-10 — import, export, backup and rollback
**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 14_Accessibility/01_a11y/mod_keyboard. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001, CTR-SCH-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-109-10.R01 | Portability export includes account-scope bindings as JSON; device scope is excluded. | MVP |
| PS-109-10.R02 | Import rejects invalid rows and never overwrites an existing binding without user confirmation. | MVP |
| PS-109-10.R03 | Catalog rollback restores the previous focus contract version within one release. | MVP |

## Data / schema
Export file: `{"schema_version":"1.0.0","bindings":[{action_id, chord, revision}]}`. Max 200 rows.

## Commands / queries / events
Export is produced by the portability job (owner F16/F07 portability); this module supplies the schema only. Import goes through `kbd.binding.set` per row.

## States & transitions
Import: `uploaded` → `validated` → `confirmed` → `applied`; any step may end `rejected` with row counts only.

## Validation & errors
Rows failing [PS-109-02](validation_rules.md) are counted, not echoed.

## Authorization
Export and import by owning `acc_` only ([PS-109-05](authorization_capabilities.md)).

## Failure, idempotency, concurrency, offline
Import is idempotent per row key (action_id, scope). Backups include account bindings; restore replays deletions (CTR-PRV-001 R06).

## Privacy, retention, abuse
Export contains PSEUDONYMOUS data only. Never federated (PS-109-07.R03).

## Observability & budgets
Import row counts emitted; no row content logged.

## Tests
- TEST-PS-109-10-01 integration: export then import on a clean account yields identical bindings.
- TEST-PS-109-10-02 negative: invalid row rejected, count reported, no echo.
- TEST-PS-109-10-03 rollback: catalog v2 rolled back to v1 restores focus order.

## Acceptance criteria
1. Export round trip is lossless for valid bindings.
2. No import path overwrites without confirmation.
3. Rollback restores focus order in test.

## Assumptions & open decisions
- ASSUMPTION: schema v1.0.0 is the first portable version; migrations per CTR-SCH-001 R07.
- D07 (retention): PROVISIONAL (D07 default, unapproved). D01 (federated protocol): not applicable; bindings are not federated.
