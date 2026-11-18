# PS-107-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ERR-001, CTR-ID-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-02.R01 | `channel` ∈ {push, email, inapp}; `category` ∈ {security, transactional, deadline, activity}. | MVP |
| PS-107-02.R02 | `state` change to `on` for `push` or `email` requires `source` = `settings` or `email_confirmation` and an explicit action flag (no default or pre-ticked values). | MVP |
| PS-107-02.R03 | Turning `inapp`/`security` off is rejected. | MVP |
| PS-107-02.R04 | Turning off every channel for `security` is rejected (at least `inapp` remains). | MVP |
| PS-107-02.R05 | `email` enabling requires a confirmation (PS-107-03). | MVP |

## Data / schema
| Field | Rule | Error code | Retryable | message_key |
|---|---|---|---|---|
| channel | R01 | OPT.CHANNEL_UNKNOWN | false | err.opt.channel_unknown |
| category | R01 | OPT.CATEGORY_UNKNOWN | false | err.opt.category_unknown |
| inapp/security | R03 | OPT.SECURITY_INAPP_REQUIRED | false | err.opt.security_inapp_required |
| security all off | R04 | OPT.SECURITY_CHANNEL_REQUIRED | false | err.opt.security_channel_required |
| source/action | R02 | OPT.EXPLICIT_ACTION_REQUIRED | false | err.opt.explicit_action_required |
| confirmation token | PS-107-03 | OPT.CONFIRMATION_INVALID | false | err.opt.confirmation_invalid |
| revision | matches | SYS.CONFLICT | true | err.sys.conflict |

## Commands / queries / events
Validation before any write; rejected writes emit no event.

## States & transitions
Not applicable (guards only).

## Validation & errors
CTR-ERR-001 envelope. `details[].rule` enum values only.

## Authorization
Ownership check first (SYS.NOT_FOUND for foreign).

## Failure, idempotency, concurrency, offline
Deterministic. Offline clients may pre-validate R02–R04 locally; server is authoritative.

## Privacy, retention, abuse
Email addresses are never in validation errors.

## Observability & budgets
Counter per code. p95 ≤ 2 ms.

## Tests
- TEST-PS-107-02-01 (unit): each rule maps to one code.
- TEST-PS-107-02-02 (unit): setting `push` on with `source`=`import` is rejected.
- TEST-PS-107-02-03 (unit): disabling all security channels rejected; disabling email alone allowed.
- TEST-PS-107-02-04 (contract): error envelope conformance.

## Acceptance criteria
1. Each rule has passing and failing fixture.
2. No pre-ticked consent path exists (UI and API tests).
3. No email address in responses or logs.

## Assumptions & open decisions
- ASSUMPTION: `source` enum {settings, email_confirmation, onboarding}.
- Message keys pending mod_languages.
