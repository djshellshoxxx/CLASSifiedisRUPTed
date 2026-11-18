# PS-113-06 — failure recovery idempotency

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-113-06. **Owner:** [14_Accessibility/02_internationalization/mod_languages](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_languages. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); specific subscribers unresolved.

## Purpose and scope
Defines idempotency, retries, timeouts, optimistic concurrency and recovery after partial failure for the languages capability. The aim is that a repeated command never changes state twice, and that a lost response never leaves the participant or operator guessing.

## Requirements to specify
- [x] PS-113-06.R01: Describe observable business outcome, actors and exclusions.
- [x] PS-113-06.R02: Enumerate normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- [x] PS-113-06.R03: Specify accessibility, localization, performance and operational budgets where applicable.
- [x] PS-113-06.R04: Idempotency key scope, window and replay behaviour.
- [x] PS-113-06.R05: Retry, timeout and backoff policy for server and client.
- [x] PS-113-06.R06: Concurrency conflict handling with optimistic revision checks.
- [x] PS-113-06.R07: Partial-failure recovery table and outbox guarantees.

## Business outcome and exclusions
**Outcome:** A participant who taps "Save" twice, loses the network mid-request, or edits on two devices ends with exactly one applied list and a clear message about what happened.

**Exclusions:** cross-module saga coordination (no other module is changed by this one); compensation for real-world effects (none exist here); distributed transactions with F07 (F07 is read-only from this module).

## Idempotency
- Every state-changing command requires `command_id` (ULID-shaped, generated on the client per user action).
- Dedupe scope: (`actor principal`, `command name`, `command_id`). The same id on a different command name is a different key.
- Window: 24 hours from first receipt (A-languages-08).
- Replay with the same payload: returns the stored response with `replayed: true`, no state change, no new event.
- Replay with a different payload hash: `LANGUAGES_IDEMPOTENCY_KEY_REUSED` (409).
- Missing `command_id`: `LANGUAGES_IDEMPOTENCY_KEY_MISSING` (400).
- The idempotency record and the state change commit in the same transaction. A key is never recorded without its effect.

## Optimistic concurrency
- Writes to `language_preference` and `language_catalog_entry` carry `expected_revision`.
- Compare-and-set inside the transaction. Mismatch returns `LANGUAGES_REVISION_CONFLICT` and writes nothing.
- Catalog transitions also take a row lock on the entry, so two operators racing to transition the same entry produce one success and one `LANGUAGES_INVALID_STATE_TRANSITION` or `LANGUAGES_REVISION_CONFLICT`.
- Capacity (V-15) is checked under the same lock as activation and draft creation.
- Preference writes do not lock other participants' rows. Write concurrency is per participant only.

## Retry and timeout policy
| Hop | Timeout | Retry policy |
|---|---|---|
| client to API, per call | 10 s | retry on network error, 429, 503, 504 with backoff 2, 4, 8, 16 s, then every 60 s; max 8 attempts before `pending_local` stops automatic retries; jitter plus or minus 20 percent |
| API to F07 identity check | 500 ms | one retry after 100 ms; then `LANGUAGES_DEPENDENCY_UNAVAILABLE` |
| API to store (F15) | 2 s per statement | no automatic retry inside a command; the client retry with the same `command_id` is the retry |
| whole command deadline | 5 s | on expiry return `LANGUAGES_TIMEOUT` (504); commit either happened (replay returns result) or did not |
| outbox relay to event bus | 5 s per publish | exponential backoff from 1 s to 10 min; dead-letter after 24 h |

Retryable responses: `LANGUAGES_TIMEOUT`, `LANGUAGES_DEPENDENCY_UNAVAILABLE`, `LANGUAGES_RATE_LIMITED` (honour `retry_after_s`), `LANGUAGES_REVISION_CONFLICT` (re-read, do not blind-retry).

Non-retryable: all 400, 403, 404 codes, 422, `LANGUAGES_IDEMPOTENCY_KEY_REUSED`, `LANGUAGES_INVALID_STATE_TRANSITION`, `LANGUAGES_DEFAULT_PROTECTED`, `LANGUAGES_TAG_RESERVED`.

## Partial-failure recovery
| Scenario | Detection | System behaviour | Participant or operator outcome |
|---|---|---|---|
| Client sends set, response lost | client timeout | server committed; replay with same `command_id` returns stored result | "Saved" shown on retry; no duplicate revision |
| Server fails after F07 check, before commit | 5 s deadline or exception | rollback; no key recorded | retry with same `command_id` applies once |
| Commit succeeded, outbox row written, relay down | outbox age alarm | relay retries until published (within 24 h) | preference already visible; events delayed |
| Event bus rejects event after 24 h | dead-letter count > 0 | event parked; operator alert | no participant effect; subscribers catch up by revision query |
| F15 store unavailable | health check and 503 | writes refused with `LANGUAGES_DEPENDENCY_UNAVAILABLE` | client keeps `pending_local`; reads from cache where allowed |
| F07 unavailable | 500 ms timeout | writes refused; reads of own preference allowed only if session check cached | "Try again later" with accessible message |
| Two devices write with same `expected_revision` | revision mismatch | first commit wins; second refused | second device asks user to pick list (see state file) |
| Catalog cache stale or unreachable | cache age > 24 h or fetch fails | client uses cached catalog; if none, uses built-in list with `en` only | app works in English; other languages appear when catalog is reachable |
| Feature flag off | flag check | `LANGUAGES_FEATURE_DISABLED` (404); cached preference still used for display if already loaded | no crash; language selector hidden |

## Compensation boundaries
- No compensation is needed for a committed command. Changes are reversed by a new forward command (`set` with previous tags, or `transition` back to `active`).
- A failed command never leaves a partial catalog row: create_draft writes row and audit event in one transaction.
- Erasure is idempotent by `erasure_ref`. Re-running it after a crash deletes nothing new and emits the event once.

## Offline (D08)
- Offline writes stay in the device's pending queue until acknowledged (see [workflow_state_machine.md](workflow_state_machine.md)).
- The queue survives app restart. It is encrypted at rest on device using the platform keystore where available.
- Queue size limit: one entry per participant (A-languages-18).

## Adversarial cases (R02)
- Replay of an old command after 24 hours: treated as new; protected by `expected_revision`, so it fails with conflict unless the revision still matches (in which case it is a legitimate re-application by the same participant).
- Key collision across participants: impossible because scope includes actor principal.
- Flood of commands with new keys: rate limit (A-languages-14), not idempotency.

## Performance budget (R03)
- Idempotency lookup adds at most 10 ms p95.
- Duplicate replay returns in p95 <= 100 ms.
- Target error rate for `LANGUAGES_TIMEOUT` < 0.1 percent of commands.

## Assumptions
**Assumption A-languages-08:** Idempotency window is 24 hours per (principal, command name, command_id).

**Assumption A-languages-14:** Participant write limit is 20 `preference.set` calls per hour; exceeding it returns `LANGUAGES_RATE_LIMITED` with `retry_after_s`.

**Assumption A-languages-18:** Device keeps at most one pending write per participant, expires it after 7 days, and uses the latest local write.

## Open decisions
- A-languages-08, A-languages-14, A-languages-18.
- Whether the F15 outbox is a shared service or a per-module table is unresolved (CTR-EVT-001 owner F15). Default: per-module outbox table.
- Whether `resolve` reads from primary or replica is unresolved; default is primary to ensure read-your-writes.

## Test references
Failure and replay tests `TEST-PS-113-06-Tnn` in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).
