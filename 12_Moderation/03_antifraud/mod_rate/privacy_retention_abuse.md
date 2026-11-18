# PS-099-07 — privacy retention abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 12_Moderation/03_antifraud/mod_rate. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (R05, R09), CTR-FED-001 (R11).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-099-07.R01 | No raw IP address, device ID, or account ID is stored or logged by this module. Subject tokens are keyed HMAC outputs. | MVP |
| PS-099-07.R02 | Keying material rotates every 24 h (ASSUMPTION); after rotation, old buckets become unreachable and expire with TTL. | MVP |
| PS-099-07.R03 | Unauthenticated network tokens are coarse and time-bounded: one token per source per 24 h epoch; no cross-epoch linkage. | MVP |
| PS-099-07.R04 | Location is never a rate subject; region cells are not used for rate keys (CTR-PRV-001 R05 limits query budgets are enforced by F10 rules, not here). | MVP |
| PS-099-07.R05 | Rate decisions are not disclosed to other users; `RATE.LIMITED` returns no subject information. | MVP |

## Data / schema
Retention: bucket state expires at `tat_ms + window_ms` (max 24 h); keys and state are never persisted to disk (memory store), so backups hold no bucket data (PS-099-10).

## Commands / queries / events
None.

## States & transitions
Expiry removes buckets; no state change visible.

## Validation & errors
No subject data in errors.

## Authorization
Only registered service callers see decisions (PS-099-05).

## Failure, idempotency, concurrency, offline
Process restart clears buckets: this resets limits for everyone for the restart duration, accepted as a fairness trade-off (ASSUMPTION), mitigated by fail modes (PS-099-06).

## Privacy, retention, abuse
- Abuse 1 (IP rotation to evade network limits): network-token limits apply only to unauthenticated routes; authenticated abuse is limited per `acc_`; device and network signals go to `mod_signals`.
- Abuse 2 (shared NAT or carrier-grade NAT locking out legitimate users): network tokens use higher limits and are never used on authenticated paths.
- Abuse 3 (linking users across epochs): rotating keys (R02) prevent long-term linkage.
- Abuse 4 (probing limits): responses reveal only allow or deny and a retry time, not counts or limit values.

## Observability & budgets
Logs: class ID, decision, policy version. No subject tokens.

## Tests
- `TEST-PS-099-07-01` privacy: memory dump and logs contain no IP, account, or device strings (canary test).
- `TEST-PS-099-07-02` privacy: after key rotation, a subject token cannot be linked to its prior bucket.
- `TEST-PS-099-07-03` abuse: CGNAT simulation of 500 users behind one source on unauthenticated read route stays under limits designed for shared sources.
- `TEST-PS-099-07-04` abuse: 1 000 rotated sources on one account are limited by `acc_` class.

## Acceptance criteria
1. Canary tests pass for IP, account, device strings.
2. Rotation unlinkability verified.
3. Shared-source scenario does not lock out the simulated population beyond the policy.

## Assumptions & open decisions
- ASSUMPTION: 24 h keying epoch is a default pending F10 review.
- D05 (geoprivacy), PROVISIONAL default: region cells never used as rate subjects (unapproved).
- D07 (retention), PROVISIONAL default: no retention of rate state (unapproved).
