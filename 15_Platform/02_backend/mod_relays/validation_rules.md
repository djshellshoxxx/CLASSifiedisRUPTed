# PS-118-02 — validation rules

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-FED-001 (R04, R10, Verification order), CTR-EVT-001 (R05, R12), CTR-SCH-001 (R05, R06).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-02.R01 | Inbound batch ≤ 100 events and ≤ 1 MiB before parse (CTR-FED-001 R10). | MVP |
| PS-118-02.R02 | Each event: signature verified over domain-prefixed JCS of the envelope including `audience` and `expires_at` (CTR-FED-001 R04). | MVP |
| PS-118-02.R03 | `expires_at` in the past → rejected; `expires_at` more than 7 days ahead → rejected (ASSUMPTION). | MVP |
| PS-118-02.R04 | `schema_id`/`schema_version` checked via CTR-SCH-001; unknown MAJOR → `SCH.UNKNOWN_VERSION`. | MVP |
| PS-118-02.R05 | Sender node must be `trusted` or `restricted` in CTR-FED-001 peer state. | MVP |

## Data / schema
Batch envelope: `{ "batch_id": "dlv_…", "origin_node": "nod_…", "events": [ { "event_id": "evt_…", "envelope": "<base64url>", "signature": "<base64url>", "key_id": "…" } ] }`.

## Commands / queries / events
`relay.enqueue` validates in this order: size → peer state → key validity at `recorded_at` (CTR-FED-001 R09) → signature → schema → expiry → duplicate check.

## States & transitions
Not applicable (stateless checks). Results per event: `accepted`, `duplicate`, `rejected`, `deferred` (CTR-FED-001 R13).

## Validation & errors
| Rule | Code | HTTP | Category | Retryable |
|---|---|---|---|---|
| Batch > 100 events or > 1 MiB | RELAY.BATCH_TOO_LARGE | 413 | payload_too_large | false |
| Event > 64 KiB | RELAY.ENVELOPE_TOO_LARGE | 413 | payload_too_large | false |
| Bad signature or unknown key_id | RELAY.SIGNATURE_INVALID | 400 | validation | false |
| Key revoked or compromised | RELAY.KEY_REVOKED | 422 | unprocessable_state | false |
| Sender not trusted | RELAY.PEER_NOT_TRUSTED | 403 | forbidden | false |
| Expired on arrival | RELAY.ENVELOPE_EXPIRED | 422 | unprocessable_state | false |
| Per-peer rate exceeded | FED.RATE_LIMITED | 429 | rate_limited | true (retry_after_ms) |

Per-event rejection uses the same codes inside the batch result. Shared codes use SYS.

## Authorization
Peers authenticate with their node key; they hold scope `relay.submit` only for their own origin events.

## Failure, idempotency, concurrency, offline
Validation is deterministic. Re-sent events with identical `event_id` and digest return `duplicate` (CTR-FED-001 R05). Equivocation (same origin, aggregate, revision, different digest) → `FED.EQUIVOCATION` and quarantine of the peer (CTR-FED-001 R06).

## Privacy, retention, abuse
Rejected envelopes are discarded; only code and digest are logged. Signature failures are counted per peer, not per payload content.

## Observability & budgets
Verification p95 ≤ 5 ms per event on reference hardware (ASSUMPTION). Counter `relay_verify_results_total{result}`.

## Tests
- TEST-PS-118-02-01 (unit): each rule row returns exactly the listed code.
- TEST-PS-118-02-02 (security): tampered `audience` or `expires_at` fails signature.
- TEST-PS-118-02-03 (integration): revoked key and compromised key paths.

## Acceptance criteria
1. Verification order matches CTR-FED-001 "Verification order (inbound, per event)".
2. 100-event batch with one bad signature yields 99 results plus one rejected, no partial write for the bad event.
3. Equivocation test quarantines the peer.

## Assumptions & open decisions
- ASSUMPTION: 7-day future bound on `expires_at`.
- D01 PROVISIONAL (default: versioned signed envelopes, explicit opt-in; unapproved).
