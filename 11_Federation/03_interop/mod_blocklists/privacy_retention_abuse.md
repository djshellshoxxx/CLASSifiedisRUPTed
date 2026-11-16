# PS-089-07 — privacy, retention and abuse

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 11_Federation/03_interop/mod_blocklists. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-PRV-001 (classes R01–R03, retention classes, legal hold R07, disclosure matrix), CTR-FED-001 (R02 per-item opt-in, R03 never-federated classes, R12 jitter), CTR-SCH-001 (R10 class changes).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-089-07.R01 | Entries hold only node IDs, peer IDs and SHA-256 digests. Zero occurrences of end-user IDs, coordinates, addresses or free text across the fixture corpus (CTR-PRV-001 R03 zero tolerance). | MVP |
| PS-089-07.R02 | `scope` defaults to `local`. `federate` requires explicit per-entry choice and dual control (PS-089-05). Export only to `trusted` peers. | MVP |
| PS-089-07.R03 | Retention: active entries until `expires_at` or withdrawal; ended entries (`rejected`, `withdrawn`, `expired`) under RET-AUD (12 months, PROVISIONAL D07); peer batch records under RET-FED. | MVP |
| PS-089-07.R04 | Peer-sourced entries never auto-activate. Each moderator may propose ≤ 50 entries per 24 h (ASSUMPTION); exceeding returns `SYS.RATE_LIMITED`. | MVP |
| PS-089-07.R05 | An affected node operator may request review through F12 appeals. The entry stays active during review unless an `ope_` suspends it (ASSUMPTION). | MVP |

## Data / schema
| Data | Class | Retention | Owner |
|---|---|---|---|
| Entry (active) | PSEUDONYMOUS | until `expires_at` or withdrawal | F11 (this module) |
| Entry (ended) | PSEUDONYMOUS | RET-AUD, 12 months | F11 |
| Source `cas_` link | per F12 | RET-EVD per F12 | F12 |
| Peer batch record (`dlv_`) | PSEUDONYMOUS | RET-FED | F11 |
| Operational logs | pseudonymous IDs | RET-OPS, 30 days | F15 |

`content_digest` targets: ASSUMPTION that SHA-256 of a canonical envelope is not reversible for high-entropy payloads. Low-entropy payloads may be guessable; such digests remain `scope = local` by default and need F10 review.

## Commands / queries / events
No additional fields. Event payload allowlist is PS-089-04 and is enforced by TEST-PS-089-04-05.

## States & transitions
Legal hold (CTR-PRV-001 R07) on a linked `cas_` retains its entries past RET-AUD. Hold releases automatically at its stated end date.

## Validation & errors
`PRV.CLASS_VIOLATION` (422) if a write or export would exceed the entry's class. `BLOCKLISTS.TARGET_INVALID` for personal or location targets (PS-089-02).

## Authorization
Export and read rules in PS-089-05. Case-linked data visible only to case-scoped grants.

## Failure, idempotency, concurrency, offline
Retention purge is idempotent on `blk_` ID. Purge propagates to replicas and caches within 24 h (CTR-PRV-001 R06).

## Privacy, retention, abuse
- Abuse: griefing by false peer lists is limited by R04 and quarantine (CTR-FED-001 BT-09).
- Abuse: mass proposals limited per moderator (R04).
- Abuse: target lists used to infer user activity are prevented by R01 (no user IDs).

## Observability & budgets
`blocklist_abuse_rate_limited_total{actor_kind}`. Alert on any peer importing ≥ 100 entries in 1 h (ASSUMPTION; triggers quarantine review).

## Tests
- TEST-PS-089-07-01 (negative): fixtures with `acc_`, coordinates and free text are refused; zero occurrences in stored rows and exports.
- TEST-PS-089-07-02 (integration): ended entries purged at RET-AUD boundary.
- TEST-PS-089-07-03 (unit): default `scope` is `local`; `federate` without dual control is refused.
- TEST-PS-089-07-04 (integration): export to `restricted` peer yields no events.
- TEST-PS-089-07-05 (negative): 51st proposal in 24 h → `SYS.RATE_LIMITED`.
- TEST-PS-089-07-06 (integration): legal hold on `cas_` keeps entries past RET-AUD; release on end date purges them.

## Acceptance criteria
1. Zero personal or location values in any entry or export fixture; TEST-PS-089-07-01 passes.
2. Retention matches the table; TEST-PS-089-07-02 and -06 pass.
3. Peer-sourced entries never reach `active` without local acceptance; TEST-PS-089-07-04 passes.

## Assumptions & open decisions
Decision register: [DECISIONS.md](../../../DECISIONS.md). Labels below are PROVISIONAL (default, unapproved) where marked.
- PROVISIONAL (D07 default, unapproved): minimal per-category retention with legal-hold exceptions.
- ASSUMPTION: 50 proposals per 24 h; 100 imports per hour alert threshold.
- OPEN (F10): whether node or peer IDs need separate classification in some jurisdictions (CTR-PRV-001 R07 review).
- OPEN (F10): content digest risk for low-entropy payloads (see Data / schema).
