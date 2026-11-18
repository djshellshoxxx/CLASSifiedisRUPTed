# PS-088-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/02_relay_sync/mod_delivery. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-FED-001 (R01, peer scopes), CTR-CAP-001 (R09).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-088-05.R01 | Sending only to peers in `trusted` state; `restricted` peers receive nothing outbound (ASSUMPTION). | MVP |
| PS-088-05.R02 | Receiving accepted from `trusted` and `restricted` (inbound only) peers; `quarantined` and `revoked` refused. | MVP |
| PS-088-05.R03 | Revocation of a grant or peer takes effect for queued rows within 60 s (CTR-CAP-001 R09). | MVP |
| PS-088-05.R04 | Default deny. | MVP |

## Data / schema
Capabilities: `fed.send_batch`, `fed.receive_batch`, `peer.admit`, `peer.quarantine`.

## Commands / queries / events
[commands_queries_events.md](commands_queries_events.md).

## States & transitions
Peer state from CTR-FED-001 lifecycle; authorization does not change it.

## Validation & errors
`FED.PEER_UNKNOWN`, `FED.PEER_NOT_TRUSTED`.

## Authorization
| Actor | Action | Resource | Outcome |
|---|---|---|---|
| sys_ | fed.send_batch | trusted peer | ALLOW |
| sys_ | fed.send_batch | quarantined peer | DENY, FED.PEER_NOT_TRUSTED |
| trusted peer | fed.receive_batch | own origin events | ALLOW |
| peer | fed.receive_batch | events with other origin | DENY, FED.PEER_NOT_TRUSTED |
| F12 moderator | peer.quarantine | peer | ALLOW (case scope) |

## Failure, idempotency, concurrency, offline
Fails closed. Offline nodes are not peers.

## Privacy, retention, abuse
Peer state changes audited (CTR-FED-001 R01, CTR-CAP-001 R08).

## Observability & budgets
`delivery_authz_denies_total{reason}`.

## Tests
- TEST-PS-088-05-01 (matrix): outcomes per row.
- TEST-PS-088-05-02 (quarantine): queued rows dropped on quarantine.
- TEST-PS-088-05-03 (origin): relayed foreign-origin event refused (ASSUMPTION).

## Acceptance criteria
1. Matrix passes.
2. Revocation within 60 s.

## Assumptions & open decisions
- ASSUMPTION: relays forward only their own origin events in MVP (CTR-FED-001 step 6).
- PROVISIONAL (CTR-CAP-001 default, unapproved).
