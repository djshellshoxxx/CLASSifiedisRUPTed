# PS-056-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/02_profiles/mod_profiles. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01, R02, R04 scopes, R05, R10 field visibility, R11 server-side), CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-056-05.R01 | Profile actions are evaluated on the owning `acc_` of the `prf_`; `prf_` is never a principal. | MVP |
| PS-056-05.R02 | Private block readable only by owner or by a counterparty holding an unexpired disclosure grant for that field. | MVP |
| PS-056-05.R03 | Counterparty scope (`participant`) exists only while a proposal, transaction, meetup or dispute links both pseudonyms; the link is derived from owning modules. | MVP |
| PS-056-05.R04 | Moderators (`mod_`) see public fields and `contact_methods` presence only on a case scope; never values (CTR-CAP-001 R04). | MVP |
| PS-056-05.R05 | Disclosure grants are created only by the owner and require `profile.disclose` on `self`. | MVP |
| PS-056-05.R06 | Default deny; unlisted combination → `SYS.FORBIDDEN`. | MVP |

## Data / schema
Field visibility matrix (CTR-CAP-001 R10):

| Field | public | participant (granted) | owner | case (mod_) | never |
|---|---|---|---|---|---|
| `bio`, `languages`, `region_cell` | Y | Y | Y | Y | |
| `contact_methods` values | | granted only | Y | presence only | |
| `visibility`, `revision` | | | Y | | |

## Commands / queries / events
| Action | Actor | Scope | Result |
|---|---|---|---|
| `profile.read` | any | public | public fields |
| `profile.read` | counterparty | participant | public + granted fields |
| `profile.read` | owner | self | all fields |
| `profile.update` | owner | self | allow |
| `profile.set_visibility` | owner | self | allow |
| `profile.disclose` | owner | self | allow with counterparty in `participant` scope |
| `profile.revoke_disclosure` | owner | self | allow |

## States & transitions
Denied writes do not change state. Decisions recorded as `dec_` with reason code (CTR-CAP-001 R13).

## Validation & errors
| Code | `retryable` | `message_key` |
|---|---|---|
| `SYS.NOT_FOUND` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | false | `err.sys.forbidden` |
| `PROF.DISCLOSURE_NOT_ALLOWED` | false | `err.prof.disclosure_not_allowed` |

## Authorization
Relation rules derived at decision time. Revocation effective at next decision; zero cache for writes and private reads (CTR-CAP-001 R09).

## Failure, idempotency, concurrency, offline
Authorization is re-evaluated on retry. Offline-cached private fields are only shown while the local session is authenticated (CTR-PRV-001).

## Privacy, retention, abuse
Moderator case reads emit `aud_` with `prf_id` and purpose (CTR-CAP-001 R08). Disclosure grants visible to owner only.

## Observability & budgets
`prof_authz_deny_total{action}`; alert on repeated `profile.disclose` denials from one account.

## Tests
- TEST-PS-056-05-01 (unit): matrix cell per principal × action × field.
- TEST-PS-056-05-02 (integration): counterparty sees granted contact value only during grant window.
- TEST-PS-056-05-03 (integration): revocation takes effect at next read.
- TEST-PS-056-05-04 (negative): moderator without case grant gets `SYS.NOT_FOUND`.

## Acceptance criteria
1. Matrix implemented; default deny verified.
2. Contact values never visible to moderators.
3. Revocation effective at next decision.
4. Counterparty scope ends when linked relation ends.

## Assumptions & open decisions
- ASSUMPTION: moderator sees `contact_methods` presence only.
- Consent record canonical owner ID: PENDING (duplicate slug `mod_consent`, see mod_consent owner decision). Disclosure grants reference it by full ID once assigned.
- PROVISIONAL (D10 default, unapproved): no change to matrix from user-controlled keys in MVP.
