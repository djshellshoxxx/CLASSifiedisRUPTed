# PS-116-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 15_Platform/01_pwa/mod_offline (F15.S01.M01). **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-CAP-001, CTR-ERR-001, CTR-PRV-001.

## Requirements
| ID | Requirement (measurable) | Priority MVP/Future |
|---|---|---|
| PS-116-05.R01 | The offline queue makes no authorization decision. Client-side checks are cosmetic (CTR-CAP-001 failure section). | MVP |
| PS-116-05.R02 | Queue entries are readable and discardable only by the signed-in `acc_` that created them. | MVP |
| PS-116-05.R03 | Replayed commands are authorized by the server at commit against the replay time, not the enqueue time. | MVP |
| PS-116-05.R04 | A revoked grant or lost role turns the entry into `not_applied` with the server code (for example `SYS.FORBIDDEN`). | MVP |
| PS-116-05.R05 | Account switch on a device with pending entries requires explicit user choice: sync, discard or keep locked. | MVP |

## Data / schema
Capabilities used by this module (CTR-CAP-001 R03 format):

| Capability | Actor | Resource | Notes |
|---|---|---|---|
| `offline_entry.create` | user (`acc_`, owner) | own queue | enqueue |
| `offline_entry.read` | user (owner) | own entries | list, no payload |
| `offline_entry.withdraw` | user (owner) | own entries | discard |

No server-side capability is created by this module.

## Commands / queries / events
Each capability is checked on the local command in PS-116-04.

## States & transitions
Not applicable to authorization. Revocation shows up as the replay result in PS-116-03.

## Validation & errors
`SYS.UNAUTHENTICATED` when no session; `OFFLINE.ENTRY_NOT_FOUND` for other accounts (no existence leak, CTR-ERR-001 R08).

## Authorization
Default deny (CTR-CAP-001 R01). Support operators have no access to device queues.

## Failure, idempotency, concurrency, offline
Offline, the queue uses the last-known session. Session expiry blocks replay until re-authentication; entries are kept.

## Privacy, retention, abuse
Support tooling cannot request queue contents. Device-level decryption key is never sent to the server.

## Observability & budgets
Metric: `offline_replay_denied_total{code}`. Audit: entries discarded by the user emit a local deletion record (PS-116-07).

## Tests
- TEST-PS-116-05-01 (unit): another account's entry is never listed or readable.
- TEST-PS-116-05-02 (integration): grant revoked after enqueue → replay returns `SYS.FORBIDDEN`; entry is `not_applied`.
- TEST-PS-116-05-03 (negative): tampered client-side permission flag does not allow server commit.
- TEST-PS-116-05-04 (integration): account switch with pending entries presents the three choices.

## Acceptance criteria
1. Capability table matches CTR-CAP-001 vocabulary (lint).
2. TEST-PS-116-05-01 through -04 pass.

## Assumptions & open decisions
- ASSUMPTION: session expiry does not delete entries.
- PROVISIONAL (D10 default, unapproved): user-controlled keys; the device key protecting ciphertext is recoverable only through documented recovery.
