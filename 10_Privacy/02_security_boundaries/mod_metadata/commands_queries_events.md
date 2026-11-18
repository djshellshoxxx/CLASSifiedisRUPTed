# PS-080-04 — commands, queries and events

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 10_Privacy/02_security_boundaries/mod_metadata (Privacy Lead, F10). **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001 (R08 export rules, R12 timing jitter), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-080-04.R01 | Internal commands: `metadata.sanitize_attachment` (sys), `metadata.egress_filter` (in-process, every outbound surface). | MVP |
| PS-080-04.R02 | Admin commands: `meta.policy.publish`, `meta.policy.activate`; query `meta.policy.get_active`. | MVP |
| PS-080-04.R03 | Sanitise command idempotent on (`att_`, sanitizer_version); repeat returns the existing report. | MVP |
| PS-080-04.R04 | Events carry category counts and IDs only; never field names with values. | MVP |
| PS-080-04.R05 | Federation batches keep CTR-FED-001 R12 random delay (0–60 s) and carry no origin metadata beyond CTR-FED rules. | MVP |

## Data / schema
Sanitise request: `{"attachment_id": "att_...", "declared_mime": "image/jpeg"}` (internal).
Report response: `{"attachment_id", "format", "removed": {"gps": 2, "device": 1, "author": 0, "thumbnail": 0, "other": 3}}`.

## Commands / queries / events
| Operation | Idempotency | Emits | Errors |
|---|---|---|---|
| sanitize_attachment | att + version | `attachment.metadata_stripped` or `attachment.quarantined` | META.UNSUPPORTED_FORMAT, META.STRIP_FAILED |
| egress_filter | none (pure) | none; drops field and increments counter | META.DISALLOWED_FIELD |
| policy.publish | key + digest | `meta.policy_published` | META.POLICY_VERSION_MISMATCH |
| policy.activate | key | `meta.policy_activated` | CAP.DUAL_APPROVAL_REQUIRED |

## States & transitions
Per PS-080-03.

## Validation & errors
Per PS-080-02.

## Authorization
Admin commands per PS-080-05; sanitize is `sys_` only.

## Failure, idempotency, concurrency, offline
Egress filter is synchronous and fails closed: if the filter cannot load policy, the outbound payload is not sent (`SYS.UNAVAILABLE`).

## Privacy, retention, abuse
Events hold counts only. Egress filter never logs removed values.

## Observability & budgets
Egress filter overhead p95 ≤ 2 ms per payload (ASSUMPTION).

## Tests
- TEST-PS-080-04-01 (contract): event schemas pass CTR-SCH-001.
- TEST-PS-080-04-02 (fail-closed): policy store unavailable → no outbound payload sent.

## Acceptance criteria
1. Every command and event in the table exists in the contract.
2. Fail-closed test passes.
3. No event carries a removed value (fixture scan).

## Assumptions & open decisions
- ASSUMPTION: 2 ms egress budget.
- PENDING: sanitiser library selection; candidates to be evaluated in Prompt 3 research with versions recorded then.
