# PS-058-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_reputation. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-EVT-001 (envelope, R03), CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 (`reputation.*`), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-058-04.R01 | Input commands from owning modules carry source `event_id` and `idempotency_key`. | MVP |
| PS-058-04.R02 | Public query `GetReputationBand(prf_id)` p95 ≤ 50 ms; returns `band` and `status` only. | MVP |
| PS-058-04.R03 | Subject query `GetOwnReputation(prf_id)` returns counters; no counterparty identifiers. | MVP |
| PS-058-04.R04 | Events carry `prf_id`, band or status, revision; no counters, counterparty IDs or dispute details. | MVP |
| PS-058-04.R05 | Schema IDs `reputation.band_changed`, `reputation.review_opened`, `reputation.review_closed` at 1.0.0 (review events owned by F12, consumed here). | MVP |
| PS-058-04.R06 | Public reputation API for third parties. | Future |

## Data / schema
| Command / input | Payload | Source | Error codes |
|---|---|---|---|
| `ReputationInput` (`exchange_outcome`) | `event_id`, `prf_a`, `prf_b`, `finality`, `occurred_at`, `exchange_ref` (`trx_`, `par_`, or `rnt_`) | F02–F05, F08 handoff via F09 | `REPUTE.FINALITY_NOT_FINAL`, `SELF_DEALING`, `INPUT_STALE`, `INPUT_DUPLICATE` |
| `ReputationInput` (`evidence_summary`) | `event_id`, `prf_id`, `evidence_ref`, `kind` | mod_evidence | `EVIDENCE_NOT_VALID` |
| `ReputationInput` (`dispute_outcome`) | `event_id`, `prf_id`, `dsp_id`, `outcome` | F09 | `DISPUTE_REF_INVALID` |

## States & transitions
See [workflow_state_machine.md](workflow_state_machine.md).

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Input commands: `reputation.input` for `sys_` principal with the listed source scope. Reads per [authorization_capabilities.md](authorization_capabilities.md).

## Failure, idempotency, concurrency, offline
Duplicate inputs return original outcome. Offline clients never submit reputation inputs directly; inputs originate from server-side modules only.

## Privacy, retention, abuse
Events carry no counterparty identity; `actor_ref` is the source `sys_`.

## Observability & budgets
`repute_input_total{source,result}`; no `prf_` labels.

## Tests
- TEST-PS-058-04-01 (contract): input and event schemas validate.
- TEST-PS-058-04-02 (integration): duplicate input counted once.
- TEST-PS-058-04-03 (contract): band event lacks counters and counterparty IDs.
- TEST-PS-058-04-04 (negative): subject query contains no counterparty identifiers.

## Acceptance criteria
1. All inputs, queries and events implemented with listed payloads.
2. Idempotency verified.
3. Event lint passes.
4. Counterparty identifiers absent from every response to non-subjects.

## Assumptions & open decisions
- ASSUMPTION: `aggregate_type = reputation_profile` registered in CTR-SCH-001.
- Review event producer F12 (mod_appeals / mod_flags) by full ID once assigned.
