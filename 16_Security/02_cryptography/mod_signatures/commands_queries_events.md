# PS-130-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/02_cryptography/mod_signatures. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-ID-001, CTR-FED-001

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-130-04.R01 | `signature.sign` is idempotent by (`subject_digest`, `key_id`, `domain_tag`) and needs no `expected_revision`. | MVP |
| PS-130-04.R02 | `signature.verify` returns within 10 ms p95 for cached keys (ASSUMPTION). | MVP |
| PS-130-04.R03 | Command version `v1`; breaking change adds `v2` with 12-month overlap (ASSUMPTION). | MVP |
| PS-130-04.R04 | Events carry CTR-EVT-001 envelope with `max_data_class` PUBLIC. | MVP |

## Data / schema
Sign request: `command_version`, `subject_type`, `subject` (canonical JSON), `key_id`, `idempotency_key`. Verify request: `subject` (full envelope incl. `signature`) and `receive_time`.

## Commands / queries / events
| Name | Kind | Summary | Errors |
|---|---|---|---|
| signature.sign | command | sign canonical subject, return `sig_id` and signature | ALGORITHM_NOT_ALLOWED, PAYLOAD_TOO_LARGE, CANONICAL_INVALID, DOMAIN_MISMATCH, KEY_NOT_VALID_AT_TIME, SYS.UNAVAILABLE |
| signature.verify | query-with-record | return verification result, store it | CANONICAL_INVALID, SYS.UNAVAILABLE |
| signature.get | query | return record by `sig_id` | SYS.NOT_FOUND |
| signature.verification_failed | event | emitted on invalid or key_revoked | n/a |

Sign does not emit an event per signature; producers emit their own domain event.

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
Shared envelope per CTR-ERR-001; module codes in [validation_rules.md](validation_rules.md).

## Authorization
See [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Sign is not offered to offline clients for events; client-side statement signing is deferred until D06 is decided.

## Privacy, retention, abuse
`signer_ref` only; no payload in events.

## Observability & budgets
Per-command latency histogram; error counter by code.

## Tests
- TEST-PS-130-04-01: contract, event schema against CTR-EVT-001.
- TEST-PS-130-04-02: integration, duplicate sign returns identical bytes.

## Acceptance criteria
1. Duplicate sign returns byte-identical signature in 100% of runs.
2. Verification latency budget met on reference hardware (ASSUMPTION).

## Assumptions & open decisions
- ASSUMPTION: Ed25519 determinism is relied on for idempotency.
- D06 (receipts as signed statements): PROVISIONAL (D06 default, unapproved).
