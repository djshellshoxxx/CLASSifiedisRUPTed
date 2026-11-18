# PS-103-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/01_delivery/mod_inapp. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R02, R04, R05, R10, R11), CTR-PRV-001 (R10).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-103-05.R01 | Capabilities used: `ntf.create` (sys_, producers), `ntf.read` (recipient), `ntf.update` (recipient read and dismiss), `ntf.administer` (operators, aggregate only). | MVP |
| PS-103-05.R02 | Recipients see only items where `recipient_ref` equals their own `acc_` (self scope). Pseudonym views resolve to the same `acc_`. | MVP |
| PS-103-05.R03 | Producers create notifications only for templates they own (registry check). | MVP |
| PS-103-05.R04 | Operators have no content read capability for inboxes. | MVP |
| PS-103-05.R05 | Blocked-sender suppression is evaluated at creation using the block relation owned by F08 (by ID only). | MVP |

## Data / schema
| Actor | Action | Resource / scope | Outcome |
|---|---|---|---|
| `sys_` producer (owns template) | `ntf.create` | template's recipient | ALLOW |
| `sys_` producer (not owner) | `ntf.create` | template | DENY `SYS.FORBIDDEN` |
| `acc_` recipient | `ntf.read`, `ntf.update` | own `ntf_` (self) | ALLOW |
| `acc_` other | any | another's `ntf_` | DENY `SYS.NOT_FOUND` |
| `ope_` | any | any inbox | DENY (no content capability); aggregate counts ALLOW (`ntf.administer`) |
| `mod_` | any | any inbox | DENY |

Field visibility (CTR-CAP-001 R10): `params`, `template_key`, timestamps = `owner`; `source_ref` = `owner`; `recipient_ref` = `never` for non-owner actors.

## Commands / queries / events
No grants needed for recipient self actions. Producer identities are registered in the template registry.

## States & transitions
Authorization does not change state.

## Validation & errors
`SYS.NOT_FOUND` for other accounts' items; `SYS.FORBIDDEN` for unregistered producers.

## Failure, idempotency, concurrency, offline
Authorization re-checked on sync retries; token expiry during offline queue flush requires re-authentication before queued operations are sent (D08 interplay, ASSUMPTION).

## Privacy, retention, abuse
Operator aggregate counts are bucketed; no per-account counts below K_MIN (CTR-PRV-001 R04 applied to aggregates).

## Observability & budgets
`inapp_authz_denied_total{capability,actor_kind}`.

## Tests
- `TEST-PS-103-05-01` unit: matrix rows return outcomes.
- `TEST-PS-103-05-02` negative: `acc_` reads another's `ntf_` → `SYS.NOT_FOUND`.
- `TEST-PS-103-05-03` negative: producer for another template → `SYS.FORBIDDEN`.
- `TEST-PS-103-05-04` negative: operator reads `params` → denied.

## Acceptance criteria
1. No operator or moderator can read inbox content.
2. Producer registration enforced per template.
3. Cross-account access returns not-found in all paths.

## Assumptions & open decisions
- ASSUMPTION: block relation is read from F08 by ID; this module stores no block list.
- D10 (auth and portability), PROVISIONAL default: pseudonyms resolve to one `acc_` for inbox scope (unapproved).
