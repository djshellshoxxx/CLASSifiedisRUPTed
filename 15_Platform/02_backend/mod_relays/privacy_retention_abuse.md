# PS-118-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R03, R06, R09), CTR-FED-001 (R02, R03, R08, R11, R12), CTR-EVT-001 (R06, R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-07.R01 | Relay never stores PRIVATE_PERSONAL, LOCATION_PRECISE or SECRET plaintext. Those classes are never federated (CTR-FED-001 R03). | MVP |
| PS-118-07.R02 | Private message payloads reach relay only as ciphertext (ASSUMPTION; PENDING CTR for private-message encryption, not yet written). | MVP |
| PS-118-07.R03 | Relay logs contain node IDs, event IDs, codes and counts. No IP addresses except keyed hashes (CTR-PRV-001 R09). | MVP |
| PS-118-07.R04 | Per-peer limits: ≤ 600 events/min and ≤ 10 MiB/h (CTR-FED-001 R11). | MVP |
| PS-118-07.R05 | Outbound random delay 0–60 s (CTR-FED-001 R12). | MVP |

## Data / schema
Metadata visible to relay per queue item: origin node, target peer, event ID, size, timestamps. Relay does not store `actor_ref` in cleartext: CTR-FED-001 pseudonymizes it per audience before export.

## Commands / queries / events
None beyond PS-118-04.

## States & transitions
Retention purge on EXPIRED, REJECTED or peer revocation (PS-118-03).

## Validation & errors
Class check: any envelope whose `max_data_class` is PRIVATE_PERSONAL or higher is rejected with `RELAY.CLASS_NOT_FEDERABLE` (422, unprocessable_state).

## Authorization
Peers see only their own queue items; operators see aggregate metadata.

## Failure, idempotency, concurrency, offline
Purge is idempotent and runs on schedule and on revocation.

## Privacy, retention, abuse
| Data | Retention | Basis |
|---|---|---|
| queued envelope bytes | ≤ 7 days | PS-118-01 |
| terminal digests and codes | 30 days | ASSUMPTION |
| access and error logs | 14 days | ASSUMPTION |

Threats and controls:

| Threat | Control |
|---|---|
| Graph deanonymization from metadata | node-level IDs only; relay batches mixed across audiences; timing jitter R05 (partial mitigation) |
| Sybil relays or peers | peer admission by operator with dual control (PS-118-05) |
| Malicious peer floods queue | per-peer rate limits R04, queue cap |
| Replay of old batch | expiry check, dedupe by (origin, event) |
| Timing correlation | random delay R05; cover traffic deferred to Future |

## Observability & budgets
No payload content in telemetry; CI canary test on relay logs.

## Tests
- TEST-PS-118-07-01 (security): PRIVATE_PERSONAL-classed envelope rejected.
- TEST-PS-118-07-02 (integration): peer exceeding 600 events/min receives FED.RATE_LIMITED with retry-after.
- TEST-PS-118-07-03 (privacy): log canary scan finds no payload or IP.

## Acceptance criteria
1. Zero plaintext sensitive payloads in relay storage (schema and dump scan).
2. Rate limits enforced at the stated values (load test).
3. Privacy Lead (F10) signs off metadata inventory before release.

## Assumptions & open decisions
- ASSUMPTION: 7-day and 30-day retention; ciphertext-only private payloads.
- D05 PROVISIONAL (default: coarse public regions, precision user-initiated; unapproved): relay carries no location fields.
- D07 PROVISIONAL (default: minimal per-category retention with legal-hold exceptions; unapproved).
