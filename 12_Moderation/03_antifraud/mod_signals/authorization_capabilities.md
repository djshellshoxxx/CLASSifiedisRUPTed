# PS-101-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_signals (Trust&Safety Lead). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001 (R08 not-found rule), CTR-PRV-001.

**Decision labels:** Case-scoped access without dual control is PROVISIONAL (D07 default, unapproved; signals are not PRIVATE or FINANCIAL classes). Security review of this matrix: OPEN.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-101-05.R01 | Capabilities: `sgn.create`, `sgn.read`, `sgn.update`, `sgn_aggregate.read`. No other verbs are declared (CTR-CAP-001 R03). | MVP |
| PS-101-05.R02 | Individual signals are readable only by a `mod_` principal with an active `case:<cas_>` grant. | MVP |
| PS-101-05.R03 | Any grant to read signals requires `constraints.purpose` and `expires_at` ≤ 72 h. | MVP |
| PS-101-05.R04 | Users never read their own raw signals. Decision reasons reach users via appeal (F12.S01.M01), citing signal type and bucket only. | MVP |
| PS-101-05.R05 | `ope_` principals have no access to signal content. Support cannot read or change signals. | MVP |
| PS-101-05.R06 | Denials for unauthorized `sgn_` reads return `SYS.NOT_FOUND`. | MVP |
| PS-101-05.R07 | Revocation takes effect at next decision; cache TTL is zero for `sgn.read` and `sgn.update`. | MVP |

## Data / schema
Grant record fields used by this module: `grant_id` (`grt_`), `principal_ref`, `capability`, `scope` (`case:<cas_>` or `global`), `constraints.purpose`, `expires_at`, `decision_ref` (`dec_`). Owner of grants: F16.S01.M01 (CTR-CAP-001).

## Commands / queries / events
Capability mapping:
| Command or query | Capability | Principal | Scope |
|---|---|---|---|
| `sgn.create` | `sgn.create` | `sys_` producer | global (write-only) |
| `sgn.list_by_subject` | `sgn.read` | `mod_` | `case:` |
| `sgn.update` | `sgn.update` | `mod_` | `case:` |
| `sgn_aggregate.read` | `sgn_aggregate.read` | `sys_` scorer | global, aggregate only |

## States & transitions
Authorization is evaluated before any transition (PS-101-03).

## Validation & errors
| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| CAP.GRANT_NOT_ACTIVE | false | conflict / 409 | Suppress on inactive grant |
| CAP.SCOPE_INVALID | false | validation / 400 | Scope not allowed for capability |
| SYS.NOT_FOUND | false | not_found / 404 | Unauthorized read |

## Authorization
Default deny (CTR-CAP-001 R01). Relation rules do not apply: no signal is owned by a user. Actor identity comes from the authenticated principal only.

## Failure, idempotency, concurrency, offline
Grant revocation mid-command: the command fails with `CAP.GRANT_NOT_ACTIVE` and writes nothing. Details: PS-101-06.

## Privacy, retention, abuse
Every privileged read emits an `aud_` record with resource ID, purpose and decision ID, and no content (CTR-CAP-001 R08). Abuse by moderators: monthly access review by Trust&Safety Lead (PROCESS, ASSUMPTION).

## Observability and budgets
Count of privileged reads per moderator per day; alert above 200 (ASSUMPTION). See PS-101-08.

## Tests
- TEST-PS-101-12 (integration): moderator without grant reads signal → `SYS.NOT_FOUND` with body identical to nonexistent ID.
- TEST-PS-101-13 (integration): user reads own signal → `SYS.NOT_FOUND`.
- TEST-PS-101-14 (negative): `ope_` principal reads signal → denied.

## Acceptance criteria
1. Every capability ID in the mapping is registered in CTR-CAP-001 vocabulary.
2. No path returns raw signals to `user` or `ope` principals.
3. Revocation test passes at next decision.

## Assumptions & open decisions
- ASSUMPTION: signal records are not PRIVATE_PERSONAL; if F10 reclassifies behavioural signals, dual control applies (CTR-CAP-001 R07).
- D07 (PROVISIONAL, unapproved). D10 identity and key model: not used here.
