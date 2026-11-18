# PS-129-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_management. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-SCH-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-129-04.R01 | Every state-changing command carries `idempotency_key` and `expected_revision`. | MVP |
| PS-129-04.R02 | Command versioning uses `command_version` = `v1`; breaking changes add `v2` and keep `v1` for 12 months (ASSUMPTION). | MVP |
| PS-129-04.R03 | `crypto_policy.get` and `crypto_policy.list_active` p95 ≤ 50 ms (ASSUMPTION). | MVP |
| PS-129-04.R04 | Every emitted event conforms to CTR-EVT-001 with `max_data_class` = PUBLIC. | MVP |

## Data / schema
Command envelope fields: `command_version`, `idempotency_key`, `expected_revision`, `actor` (authenticated principal), `body` (see [domain_schema.md](domain_schema.md)).

## Commands / queries / events
| Name | Kind | Signature (summary) | Idempotent by | Errors |
|---|---|---|---|---|
| crypto_policy.propose | command | (body) → policy_id | (actor, type, key) | POLICY_INVALID, SUITE_UNKNOWN, ALGORITHM_DEPRECATED, OVERLAP_CONFLICT |
| crypto_policy.approve | command | (policy_id) → status | (actor, type, key) | SELF_APPROVAL_FORBIDDEN, REVISION_CONFLICT |
| crypto_policy.cancel | command | (policy_id, reason_code) | (actor, type, key) | TRANSITION_INVALID |
| crypto_policy.deprecate | command | (policy_id, reason_code) | (actor, type, key) | TRANSITION_INVALID |
| crypto_policy.get | query | (policy_id) | n/a | NOT_FOUND |
| crypto_policy.list_active | query | (as_of, key_class?) | n/a | POLICY_INVALID |
| crypto_policy.imported | sys command | (bundle, origin_node) → scheduled-pending-approval; never active | (origin_node, policy_id, policy_version) | MGMT.POLICY_INVALID, FED.SIGNATURE_INVALID |
| crypto_policy.proposed / approved / scheduled / activated / deprecated / retired / cancelled | event | CTR-EVT-001 envelope | n/a | n/a |
| crypto_policy.rotation_overdue | event | emitted by scheduler when age > rotation_days | n/a | n/a |

`reason_code` is a closed enum: `rotation`, `suite_weakness`, `incident`, `admin_correction`.

## States & transitions
Event emission follows [workflow_state_machine.md](workflow_state_machine.md). Events are emitted in the same transaction as the state change.

## Validation & errors
Shared envelope per CTR-ERR-001. Module codes listed in [validation_rules.md](validation_rules.md).

## Authorization
Command authorization per [authorization_capabilities.md](authorization_capabilities.md). `list_active` and `get` are readable by any principal (PUBLIC).

## Failure, idempotency, concurrency, offline
Duplicate command with same key and same digest returns the original result; same key and different digest returns `EVT.IDEMPOTENCY_KEY_REUSED`. Read endpoints are safe to retry.

## Privacy, retention, abuse
Commands carry no personal data beyond `ope_` IDs. Events carry `actor_ref` only.

## Observability & budgets
Per-command latency histogram and error counter labelled by code only.

## Tests
- TEST-PS-129-04-01: contract, schema of each event validated against CTR-EVT-001.
- TEST-PS-129-04-02: integration, duplicate `propose` returns the original `policy_id`.

## Acceptance criteria
1. Every command has a row in the table and a contract test.
2. No event type deviates from `crypto_policy.<past-tense-verb>`.
3. Replayed commands produce zero additional events.

## Assumptions & open decisions
- ASSUMPTION: `reason_code` enum is closed at four values.
- D10 default for rotation events: PROVISIONAL (D10 default, unapproved).
