# PS-052-05 — authorization capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/01_accounts/mod_pseudonyms. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01 default deny, R02 principals, R04 scopes, R10 field visibility, R12 support limits), CTR-PRV-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-052-05.R01 | Authorization is evaluated on `acc_` only; `prf_` is never a principal (CTR-CAP-001 R02). | MVP |
| PS-052-05.R02 | Default deny. Only the actions in the matrix are granted; unlisted action → `SYS.FORBIDDEN`. | MVP |
| PS-052-05.R03 | The `account_id` field is visible only to `self`. No other principal, including `ope_`, `mod_` and `sys_` without a case grant, can read it. | MVP |
| PS-052-05.R04 | Support and operators cannot read or change `acc_` credentials through this module (CTR-CAP-001 R12). | MVP |
| PS-052-05.R05 | Reads of `prf_` by a counterparty return handle and label only, never `state_changed_at` or `revision`. | MVP |
| PS-052-05.R06 | Decision cache TTL is zero for all writes and for owner reads of `account_id`. | MVP |

## Data / schema
Field visibility (CTR-CAP-001 R10):

| Field | public | participant | owner | case | never |
|---|---|---|---|---|---|
| `prf_id`, `handle`, `label`, `state` | Y | Y | Y | Y | |
| `revision`, `state_changed_at`, `created_at` | | | Y | | |
| `account_id` | | | Y | | Y (no case grant) |

## Commands / queries / events
Action matrix (action = `<resource>.<verb>`, resource scope):

| Action | Actor | Scope | Result |
|---|---|---|---|
| `pseudonym.create` | `acc_` owner | self | allow |
| `pseudonym.read` | any | public | handle, label, state |
| `pseudonym.read` | `acc_` owner | self | all owner fields |
| `pseudonym.update` | `acc_` owner | self | allow (handle, label) |
| `pseudonym.retire` | `acc_` owner | self | allow, subject to participation guard |
| `pseudonym.read` | `ope_` / `mod_` | case | handle, label, state; never `account_id` |
| `account.delete` (saga) | `sys_` | global | retire all owned `prf_` |

## States & transitions
Authorization is checked before each transition in [workflow_state_machine.md](workflow_state_machine.md). Denied requests produce no state change and no event; a decision record `dec_` stores outcome and reason code only (CTR-CAP-001 R13).

## Validation & errors
| Code | Trigger | `retryable` | `message_key` |
|---|---|---|---|
| `SYS.NOT_FOUND` | caller cannot read the `prf_` | false | `err.sys.not_found` |
| `SYS.FORBIDDEN` | action not granted | false | `err.sys.forbidden` |

Unreadable and non-existent `prf_` return identical responses (CTR-ERR-001 R08).

## Authorization
Relation rules: owner (`account_id` equals caller `acc_`) derived at decision time (CTR-CAP-001 R05). No stored grants are needed for MVP. Future grants are out of scope.

## Failure, idempotency, concurrency, offline
- Authorization is re-evaluated on each retry; a revoked account session fails closed.
- Decision outage: writes fail closed with retryable `SYS.UNAVAILABLE`; cached public reads may serve up to 60 s old decisions (CTR-CAP-001 R09, ASSUMPTION).

## Privacy, retention, abuse
Privileged reads by `ope_`/`mod_` emit an `aud_` record with `prf_id`, purpose and decision ID, with no handle content (CTR-CAP-001 R08). Dual control is not needed because no PRIVATE or LOCATION_PRECISE data is in this module.

## Observability & budgets
Counter `pseud_authz_deny_total{action}`. Alert on sudden rise of `pseudonym.read` denials by one principal (scraping signal).

## Tests
- TEST-PS-052-05-01 (unit): matrix cell for each principal × action.
- TEST-PS-052-05-02 (negative): `prf_` ID passed as principal is rejected.
- TEST-PS-052-05-03 (integration): counterparty response omits `account_id` and revision fields (absent, not null).
- TEST-PS-052-05-04 (abuse): enumerating `prf_` IDs returns identical not-found responses for private and non-existent IDs.

## Acceptance criteria
1. Matrix implemented; default deny verified by test.
2. `account_id` never returned to a non-owner in any response, log or event.
3. Support credential access denied (R04) in test.
4. Unreadable and missing objects are indistinguishable.

## Assumptions & open decisions
- ASSUMPTION: `pseudonym.read` for case scope is needed for moderation; it is limited to handle, label and state.
- F16 Security Lead owns CTR-CAP-001; F07 named owner UNASSIGNED (S3-11).
- PROVISIONAL (D10 default, unapproved): user-controlled keys do not change this matrix in MVP.
