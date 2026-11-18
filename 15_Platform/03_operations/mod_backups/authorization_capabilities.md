# PS-120-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/03_operations/mod_backups (F15.S03.M02). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-PRV-001, CTR-ERR-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-120-05.R01 | Default deny (CTR-CAP-001 R01). No end user, including the data owner, can read or export a backup set. | MVP |
| PS-120-05.R02 | Only the `sys` scheduler principal holds `backup_job.execute`. | MVP |
| PS-120-05.R03 | `backup_set.read` (metadata only) is granted to `ope` principals with the platform operations role. | MVP |
| PS-120-05.R04 | Early expiry or purge of a set (`backup_set.administer`) needs two distinct `ope` approvers (CTR-CAP-001 R07). | MVP |
| PS-120-05.R05 | Any access to set contents outside restore (see PS-122) is refused with `SYS.FORBIDDEN` and audited. | MVP |
| PS-120-05.R06 | Key-unwrap (`key.administer` on the KMS key) is limited to the restore role and is always logged. | MVP |

## Data / schema
| Capability | Actor | Resource | Verb |
|---|---|---|---|
| `backup_job.execute` | sys | backup_job, scope global | execute |
| `backup_set.read` | ope | backup_set, scope global, metadata only | read |
| `backup_set.administer` | ope (dual control) | backup_set | administer |
| `backup_set.export` | none | backup_set | export (denied for all principals) |

## Commands / queries / events
Authorization is evaluated on each command in PS-120-04 before execution; decisions emit `dec_` records (CTR-CAP-001 R08).

## States & transitions
Not applicable.

## Validation & errors
`SYS.FORBIDDEN` for visible but denied; `SYS.NOT_FOUND` where the actor cannot see the set.

## Authorization
Grants are time-limited (<= 72 h, CTR-CAP-001 R06) with `purpose` `backup_operations`.

## Failure, idempotency, concurrency, offline
Decision cache is zero for `backup_set.administer` and key unwrap (CTR-CAP-001 R09).

## Privacy, retention, abuse
Operator access logs are stored separately (CTR-CAP-001 BT-02). Repeated denied reads raise an alert.

## Observability & budgets
Metric: `backup_authz_denied_total{capability}`. Alert on any `backup_set.read` outside an active change ticket.

## Tests
- TEST-PS-120-05-01 (matrix): every capability row yields the stated outcome for each principal kind.
- TEST-PS-120-05-02 (negative): owner of listing data cannot read a backup set; returns `SYS.NOT_FOUND`.
- TEST-PS-120-05-03 (privileged): single-approver administer is refused with `CAP.DUAL_APPROVAL_REQUIRED`.
- TEST-PS-120-05-04 (audit): every denied and allowed unwrap emits an `aud_` record.

## Acceptance criteria
1. No principal can export a backup set (TEST-01 negative matrix).
2. TEST-PS-120-05-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: 72 h grant maximum (CTR-CAP-001).
- PROVISIONAL (D10 default): user-controlled keys do not apply to platform backups; platform KMS keys are held under F16.
