# PS-107-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 13_Notifications/02_preferences/mod_opt. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-107-04.R01 | `opt.set_cell` uses `expected_revision` and `idempotency_key`. | MVP |
| PS-107-04.R02 | `opt.withdraw_all` and unsubscribe are idempotent and succeed when the cell is already off. | MVP |
| PS-107-04.R03 | Events carry `npf_id`, channel, category and state only; never addresses or tokens. | MVP |
| PS-107-04.R04 | `opt.get_matrix` p95 ≤ 50 ms. | MVP |

## Data / schema
**Commands**

| Command | Actor | Idempotency key | expected_revision | Errors |
|---|---|---|---|---|
| `opt.set_cell` | user (self) | client key | required | OPT.* validation codes, SYS.CONFLICT |
| `opt.withdraw_all` | user (self) | client key | n/a | SYS.NOT_FOUND |
| `opt.confirm_email` | user (token, POST) | token hash | n/a | OPT.CONFIRMATION_INVALID, OPT.CONFIRMATION_EXPIRED |
| `opt.unsubscribe_cell` | token holder (POST) | token hash | n/a | OPT.CONFIRMATION_INVALID |

**Queries**: `opt.get_matrix` (self).

**Events**

| event_type | aggregate_type | max_data_class |
|---|---|---|
| notification_preference.granted | notification_preference | PSEUDONYMOUS |
| notification_preference.withdrawn | notification_preference | PSEUDONYMOUS |
| notification_preference.confirmation_expired | notification_preference | PSEUDONYMOUS |

Example `notification_preference.withdrawn`: `{"npf_id":"npf_…","channel":"email","category":"activity","source":"unsubscribe_link"}`.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate `opt.set_cell` with same digest returns original revision. Unsubscribe replay is safe.

## Privacy, retention, abuse
Events omit the address and the account's full matrix.

## Observability & budgets
Command p95 ≤ 150 ms.

## Tests
- TEST-PS-107-04-01 (contract): events validate and contain no address or token.
- TEST-PS-107-04-02 (integration): unsubscribe replay yields one withdrawn event total.
- TEST-PS-107-04-03 (integration): `opt.get_matrix` from another account returns NOT_FOUND.
- TEST-PS-107-04-04 (contract): `source` enum values match PS-107-02 assumption.

## Acceptance criteria
1. Commands and queries match tables.
2. Event scan finds no addresses or tokens.
3. Unsubscribe is idempotent in test.

## Assumptions & open decisions
- ASSUMPTION: `source` enum {settings, email_confirmation, onboarding, unsubscribe_link}.
- Prefix `npf_` PENDING CTR-ID-001.
