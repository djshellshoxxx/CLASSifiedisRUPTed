# PS-007-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 01_LocalBazaar/02_listing_types/mod_wanted. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (model, decision records), CTR-ERR-001 (NOT_FOUND vs FORBIDDEN), CTR-PRV-001 (field classes), CTR-FED-001 (peer scopes), CTR-ID-001 (`acc_`, `prf_`, `cas_`).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-007-05.R01 | Default deny. A non-readable target returns `SYS.NOT_FOUND`; a readable target without the right returns `SYS.FORBIDDEN`. | MVP |
| PS-007-05.R02 | Authorization uses `acc_` only. `prf_` is a view. | MVP |
| PS-007-05.R03 | Non-`published` posts are readable by owner and case-scoped moderators only. Others get `SYS.NOT_FOUND`. | MVP |
| PS-007-05.R04 | Moderation actions require a grant scoped to a `cas_` ID and write an `aud_` record. | MVP |
| PS-007-05.R05 | The expiry principal (`sys_`) may execute `expire` only. It cannot read content. | MVP |
| PS-007-05.R06 | Federation peers read `published` posts with `federate = true` only (CTR-FED R02). | MVP |

## Data / schema
Capability IDs (verbs per CTR-CAP R03): `cap.wanted.create`, `cap.wanted.read`, `cap.wanted.update`, `cap.wanted.withdraw`, `cap.wanted.delete`, `cap.wanted.export`, `cap.wanted.moderate`, `cap.wanted.execute`.

| Field | Owner | Other user | Case mod | sys_ indexer | fpr_ peer |
|---|---|---|---|---|---|
| `owner_account_id` | Y | N | Y (case) | N | N |
| `owner_pseudonym_id` | Y | Y | Y | Y | per-audience pseudonym |
| `region_cell` | Y | Y | Y | Y | cell only |
| `budget_max` | Y | Y (published) | Y | Y | Y if federated |
| `prior_state`, `status` | Y | N | Y | Y (published only) | N |

## Commands / queries / events
| Principal | Action | Resource | Outcome |
|---|---|---|---|
| user, owner | `lst.create` | new | ALLOW (`cap.wanted.create`; account not suspended) |
| owner | `lst.update` / `withdraw` | own, draft/published/paused | ALLOW |
| owner | `lst.update` / `delete` | own, suspended | DENY `WANTED.SUSPENDED_READ_ONLY` |
| owner | `lst.export` | own | ALLOW (F10 portability) |
| user, non-owner | `lst.read` | published | ALLOW public projection |
| user, non-owner | `lst.read` | any other state | DENY `SYS.NOT_FOUND` |
| user, non-owner | `lst.update` / `withdraw` / `delete` | any | DENY `SYS.FORBIDDEN` if readable, else `SYS.NOT_FOUND` |
| moderator, case grant | `lst.read` / `moderate` | `lst_` in `cas_` | ALLOW; `aud_` written |
| moderator, no grant | any | any | DENY `SYS.FORBIDDEN` (`SYS.NOT_FOUND` if unreadable) |
| operator (`ope_`) | content verbs | any | DENY (aggregate counts only, no content) |
| sys_ scheduler | `lst.execute` (expire) | any | ALLOW; content read DENY |
| fpr_ peer | `lst.read` | published, `federate = true` | ALLOW public fields; else `SYS.NOT_FOUND` |

## States & transitions
Guards only. Transitions in PS-007-03.

## Validation & errors
Authentication is F07 session validation and is not redefined. Authorization runs before field validation.

## Authorization
Relation rules (owner, case scope) are evaluated at decision time, not stored (CTR-CAP R05). Responders to a wanted post have no `lst.update` rights. Offer rights belong to 04_pricing/mod_offers.

## Failure, idempotency, concurrency, offline
Writes are never served from decision cache (CTR-CAP R09). Reads may use a cache of ≤ 60 s (ASSUMPTION). Revocation is effective at the next decision.

## Privacy, retention, abuse
Decision records store outcome and reason code only (CTR-CAP R13). Moderator access to `owner_account_id` is case-scoped and logged. Dual control is not required for `acc_` (PSEUDONYMOUS), ASSUMPTION.

## Observability & budgets
Counter `wanted_authz_decision_total{action,outcome,reason}`. Alert if any `ALLOW` on `sys_` content reads (should be zero).

## Tests
- TEST-PS-007-05-01 (unit): one test per matrix row.
- TEST-PS-007-05-02 (integration): non-owner sees identical response for a paused `lst_` and for a nonexistent ID, except timing.
- TEST-PS-007-05-03 (negative): `sys_` expiry principal cannot read description or title.
- TEST-PS-007-05-04 (integration): moderation without `cas_` denied; with grant succeeds and writes `aud_`.
- TEST-PS-007-05-05 (integration): federation peer receives only `federate = true` published posts.

## Acceptance criteria
1. Matrix complete; every row has a test.
2. Zero content leaks in negative tests.
3. Every privileged action writes an `aud_` record.
4. Revocation takes effect at the next decision (test).

## Assumptions & open decisions
- ASSUMPTION: grant and decision model is PROVISIONAL (CTR-CAP-001 header); this module only uses it.
- D10 PROVISIONAL (Dxx default, unapproved): user-controlled `acc_` sessions and portability; recovery is F07.
- D05 PROVISIONAL (Dxx default, unapproved): region cell is the only location visible to others.
