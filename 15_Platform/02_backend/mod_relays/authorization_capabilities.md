# PS-118-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/02_backend/mod_relays. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R02, R06, R07, R08), CTR-FED-001 (R01, R09), CTR-ID-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-118-05.R01 | Peer (`fpr_`) may submit only events whose `origin_node` equals its own node. | MVP |
| PS-118-05.R02 | Relay never returns queued bytes to any principal other than the target peer's forward. | MVP |
| PS-118-05.R03 | Peer admission and suspension are `ope_` actions with dual control (CTR-CAP-001 R07, ASSUMPTION). | MVP |
| PS-118-05.R04 | Authorization decisions are recorded as `dec_` with reason codes (CTR-CAP-001 R13). | MVP |

## Data / schema
Capability map:

| Actor | Action | Resource scope |
|---|---|---|
| fpr_ peer | relay.submit | own origin events |
| fpr_ peer | relay.ack | own queue items |
| ope_ operator | relay.read | global (digests, counts) |
| ope_ operator | peer.admit, peer.suspend | global, dual control |
| sys_ relay | relay.forward, relay.expire | internal |

## Commands / queries / events
Peer admission is recorded by CTR-FED-001 peer records; relay consumes the state.

## States & transitions
Not applicable beyond peer states consumed from CTR-FED-001 (`trusted`, `restricted`, suspended, revoked).

## Validation & errors
`RELAY.PEER_NOT_TRUSTED` (403). Foreign origin event → `SYS.FORBIDDEN` (403).

## Authorization
| Actor | Action | Resource | Result |
|---|---|---|---|
| user `acc_` | any relay route | — | deny (404 for queue routes) |
| peer A | submit event with origin B | queue | deny |
| peer A | ack item for peer B | queue | deny |
| ope_ (single) | peer.admit | global | deny until second approver |
| mod_ | relay.read | global | deny (no role) |

## Failure, idempotency, concurrency, offline
Decisions not cached for writes (CTR-CAP-001 R09). Revocation takes effect at the next batch.

## Privacy, retention, abuse
Decision records contain no envelope content (CTR-CAP-001 R13). Diagnostics expose peer IDs only to `ope_`.

## Observability & budgets
Counter `relay_authz_denied_total{route_template,code}`. Alert on any `relay.read` by a non-`ope_` principal (should be zero).

## Tests
- TEST-PS-118-05-01 (unit): matrix above.
- TEST-PS-118-05-02 (security): peer A forges origin B; denied and audited.
- TEST-PS-118-05-03 (integration): suspended peer receives no forwards after next decision.

## Acceptance criteria
1. No principal other than the target peer can read queued bytes (test asserts 0 successful reads).
2. Dual-control path required for peer admission (test with one approver fails).
3. Every denial produces a `dec_` record.

## Assumptions & open decisions
- ASSUMPTION: dual control for peer admission.
- D01 PROVISIONAL (default: explicit opt-in; unapproved): admission requires operator action.
