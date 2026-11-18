# PS-112-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-06. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); subject consumers are LocalBazaar listings and LocalMutiny proposals and cycles.

## Purpose and scope
Defines how currencies behaves when requests are retried, time out, collide, or fail part-way. Business outcome: a retried request never creates a second pin, quote or conversion; a failed write leaves no partial state; a withdrawn quote can never be used for a new conversion even while background cleanup is still running. Exclusions: recovery of external payment or physical exchange state (none is held here) and recovery of identity or device keys (F07, D10).

## Requirements
- PS-112-06.R01: Every state-changing command is idempotent under its key (section "Idempotency"). Actors: all writers. No outcome depends on the client retrying exactly once.
- PS-112-06.R02: Retry, timeout and fail-closed behavior is fixed per operation (section "Timeouts and retries").
- PS-112-06.R03: Latency and error budgets for these paths are in observability_performance.md; timeouts here are the hard limits those budgets must respect.
- PS-112-06.R04: Concurrency conflicts are resolved by revision checks or conditional updates; no last-writer-wins on any evidence row.
- PS-112-06.R05: Writes and their outbox events commit in one transaction. Partial failure of a multi-row operation either commits all rows or none.
- PS-112-06.R06: Reconciliation runs hourly and after any restore; it repairs status drift from events and raises an alert for evidence mismatch without auto-repair of evidence.

## Timeouts and retries
| Operation | Client timeout | Server handler deadline | Client retry policy | Fail mode |
|---|---|---|---|---|
| catalog.list / catalog.get | 2 s | 1 s | GET, 2 attempts, 200 ms backoff plus jitter | Return CURRENCIES_UNAVAILABLE (503) |
| fx.get_active | 2 s | 1 s | GET, 2 attempts | CURRENCIES_UNAVAILABLE; client shows last known quote with its `as_of` |
| fx.publish / fx.withdraw | 5 s | 3 s | Same key, up to 3 attempts, backoff 1 s, 2 s, 4 s plus jitter | Fail closed; no quote written |
| valuation.pin | 5 s | 3 s (includes one subject-module query, 1 s, one retry) | Same key, up to 3 attempts | Fail closed: subject module unavailable gives CURRENCIES_UNAVAILABLE |
| valuation.release / invalidate | 5 s | 3 s | Same key, up to 5 attempts (release is safe to repeat) | Pin stays PINNED; expiry sweep still bounds it |
| valuation.convert | 5 s | 2 s | Same key, up to 3 attempts | Fail closed; no record written |
| preference.set | 3 s | 2 s | Same key, up to 3 attempts | Previous preference remains |
| Quote import (batch) | 10 s to accept; job runs async | 60 s per batch job step | Poll job status; re-submit same batch_id | All-or-nothing (import_export_backup_rollback.md) |

Storage calls carry a 1 s statement timeout. A storage timeout inside a write transaction rolls back the whole transaction and returns CURRENCIES_UNAVAILABLE.

Retry rules: only CURRENCIES_RATE_LIMITED (after `Retry-After`), CURRENCIES_INTERNAL and CURRENCIES_UNAVAILABLE are retryable (validation_rules.md). Every other error is terminal for that request body.

## Idempotency
- Scope: (`actor_ref`, command name, `Idempotency-Key`). Key format per V21.
- Storage: request hash (SHA-256 of canonical JSON of the body) plus the response status and body. Records are kept for 24 h (A-currencies-16).
- Replay with identical hash returns the stored response and sets `Idempotent-Replayed: true`.
- Same key with a different hash returns CURRENCIES_IDEMPOTENCY_KEY_REUSED (409) and changes nothing.
- Only terminal outcomes are stored: 2xx and business 4xx errors. 5xx and timeouts are not stored, so a retry re-executes.
- Natural idempotency also applies, independent of the key: pin for an existing PINNED (subject_ref, quote_id) returns that row (V16); release of a RELEASED pin, withdraw of a WITHDRAWN quote, and set_status to the current status return HTTP 200 with no event.
- Convert has no natural key. Two different keys for the same pin and input produce two conversion rows. Subject services must reuse one key per logical conversion; this is stated in the subject-module contract to be agreed (see cross-module notes in the report).

## Concurrency control
| Resource | Mechanism | Conflict result |
|---|---|---|
| currency_definition | `If-Match` revision; update checks `WHERE revision = :expected` | CURRENCIES_REVISION_CONFLICT |
| display_preference | `If-Match` revision | CURRENCIES_REVISION_CONFLICT |
| fx_quote withdraw | `If-Match` revision; `WHERE status = 'ACTIVE'` | Already WITHDRAWN: 200 no-op; revision mismatch: CURRENCIES_REVISION_CONFLICT |
| fx_quote publish, same pair | Transaction-scoped advisory lock on the pair while reading prev_rate for V13 and inserting | Serialized; both succeed in lock order, each judged against the previous committed quote |
| valuation_pin release vs convert | Conditional update `WHERE status = 'PINNED' AND valid_until > now()` in the convert transaction; release updates `WHERE status = 'PINNED'` | Loser receives CURRENCIES_PIN_INVALID or a no-op 200 |
| valuation_pin insert, same (subject, quote) | Unique partial index on (`subject_ref`, `quote_id`) WHERE status = 'PINNED' | Second insert returns existing row (V16) |
| conversion_record | Insert-only; primary key from client-independent ULID | No conflict possible |

No lock is held across a network call to the subject module.

## Partial failure and recovery
| Failure point | Result | Recovery |
|---|---|---|
| Crash after row write, before outbox commit | Impossible: same transaction | None needed |
| Outbox relay down | Events accumulate; rows are correct | Relay retries with backoff; alert on lag (observability_performance.md) |
| Client loses response after pin commit | Client retries with same key | Replay returns stored pin |
| Quote withdrawn; pin-invalidation job crashes midway | Quote is WITHDRAWN; some pins still PINNED | Convert checks quote status (V17), so no new conversion is possible. Job resumes from its WHERE clause on restart |
| Scheduler sweep crashes midway | Some rows expired | Next sweep picks remaining rows; each row transition is idempotent |
| Import fails in batch step 2 of 4 | Whole batch rolled back | Re-submit same batch_id after fixing file |
| Subject module unavailable during pin | Pin not created | Fail closed; subject retries with same key |
| Event consumer receives duplicate | Duplicate `event_id` | Consumer dedupes; currencies emits no compensating event |

## Reconciliation (hourly and after restore)
1. PINNED pins whose quote is WITHDRAWN are moved to INVALIDATED (`QUOTE_WITHDRAWN`) if the job has not already done so.
2. PINNED pins with `valid_until <= now` are moved to EXPIRED.
3. Each conversion_record is recomputed from its quote and inputs. Any mismatch raises a page-level alert and is never auto-corrected; a correction is a new record with `supersedes_conversion_id`.
4. Results are written as counts only, without subject references.

## Open decisions
- A-currencies-16: Idempotency records are kept 24 h. Outbox delivery is at-least-once with consumer dedupe by `event_id`. Related: D08.
- Convert idempotency depends on subject services reusing one key per logical conversion. The contract is not in planning/CONTRACTS.md and is flagged as a cross-module need.
- Related: D04 (partial barter execution), whose compensation belongs to the subject module and not to currencies.
