# PS-029-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 03_Services/01_service_catalog/mod_skills. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-029-05.R01 | Default deny (CTR-CAP-001 R01). Every command checks one capability ID before validation. | MVP |
| PS-029-05.R02 | Provider `user` (`acc_`) may attach and detach only on listings where it is the owner (`self` scope). | MVP |
| PS-029-05.R03 | `ope` may read `pending_review` labels and call `map_label` only with `purpose` and `expires_at` ≤ 72 h (CTR-CAP-001 R06). | MVP |
| PS-029-05.R04 | `skill_taxonomy.publish` requires `ope` with `global` scope and purpose; a second approver is not required (not a PRIVATE/FINANCIAL/LOCATION class). | MVP |
| PS-029-05.R05 | Public read (`skill.search`, `skill_taxonomy.get`) requires no grant; results follow field visibility (CTR-CAP-001 R10). | MVP |
| PS-029-05.R06 | Owner `acc_` is never a visible field to other principals; the listing pseudonym view is used. | MVP |
| PS-029-05.R07 | Revocation of an `ope` grant takes effect at the next decision (CTR-CAP-001 R09); zero decision cache for these writes. | MVP |

## Data / schema
Capability registry entries: `skill.attach` (self), `skill.detach` (self), `skill.map_label` (ope, purpose), `skill_taxonomy.publish` (ope, global, purpose). Stored in the F16 capability matrix; this module references IDs only.

## Commands / queries / events
Each command names its capability in [commands_queries_events.md](commands_queries_events.md). Every grant and privileged decision emits a CTR-EVT-001 event and an `aud_` record (CTR-CAP-001 R08).

## States & transitions
Authorization is evaluated before any transition in [workflow_state_machine.md](workflow_state_machine.md). Denied requests cause no transition and no event.

## Validation & errors
Denied actions return `SYS.NOT_FOUND` for listings the actor cannot see and `SYS.FORBIDDEN` for visible listings owned by others (CTR-ERR-001 R08 applies to non-visible objects only).

## Authorization
Actor × action × resource matrix:
| Actor | Action | Resource scope | Capability |
|---|---|---|---|
| user (owner) | create/delete | self listing | skill.attach / skill.detach |
| ope | moderate | global, purpose | skill.map_label |
| ope | administer | global, purpose | skill_taxonomy.publish |
| any | read | public | skill.search |

## Failure, idempotency, concurrency, offline
Grant checks are repeated on relay receipt for queued offline commands (D08 PROVISIONAL). A revoked grant causes a queued `map_label` to fail with `SYS.FORBIDDEN`, retryable false.

## Privacy, retention, abuse
Operator access to `pending_review` labels is logged with purpose and decision ID, no label content in the audit record (CTR-CAP-001 R13). Support staff cannot change listing ownership through this module.

## Observability & budgets
Count of denied decisions per capability; alert when `ope` denials exceed 5% of attempts per day (ASSUMPTION).

## Tests
- TEST-PS-029-05-01 unit: matrix rows as table-driven tests, including default deny for an unknown capability.
- TEST-PS-029-05-02 integration: revoked `ope` grant refused on next call.
- TEST-PS-029-05-03 negative: non-owner attach returns `SYS.NOT_FOUND`.

## Acceptance criteria
1. All four capability IDs exist in the F16 matrix before implementation.
2. No command runs without a capability check.
3. Audit records contain no label text.

## Assumptions & open decisions
- ASSUMPTION: `ope` grant for label mapping limited to 72 h.
- Capability IDs and final scopes are PROVISIONAL pending F16 review (D10 relevant only to account keys, not this matrix).
- No payment or receipt checklist applies.
