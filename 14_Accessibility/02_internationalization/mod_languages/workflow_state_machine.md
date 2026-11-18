# PS-113-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-113-03. **Owner:** [14_Accessibility/02_internationalization/mod_languages](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_languages. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); specific subscribers unresolved.

## Purpose and scope
Defines the lifecycle of catalog entries, participant preferences and the client-side pending write used for offline edits. Transitions are explicit, authorized, versioned by `revision` and recorded in revision history. No transition implies a real-world or financial effect.

## Requirements to specify
- [x] PS-113-03.R01: Describe observable business outcome, actors and exclusions.
- [x] PS-113-03.R02: Enumerate normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- [x] PS-113-03.R03: Specify accessibility, localization, performance and operational budgets where applicable.
- [x] PS-113-03.R04: State table for catalog entries (state, entry event, allowed transitions, guard, terminal flag).
- [x] PS-113-03.R05: State table for participant preferences, including the implicit `none` state and erasure.
- [x] PS-113-03.R06: Client-side pending write states for offline writes (D08).
- [x] PS-113-03.R07: Timers and expiry rules, compensation boundaries and recovery after partial failure.

## Business outcome and exclusions
**Outcome:** Operators can stage a language, activate it once coverage is sufficient, deprecate it, and retire it after a waiting period. Participants can set, change or clear their language list at any time. Withdrawal and erasure are immediate.

**Exclusions:** no consent gate is needed for a participant's own display preference; no lifecycle for UI string bundles (A-languages-10); no lifecycle for content language declarations (owned by content modules); no transition ever moves a participant's stored list automatically (A-languages-05).

## Catalog entry states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| `draft` | `languages.catalog.create_draft` | -> `active` (activate); -> `retired` (cancel draft) | create: V-01, V-05, V-06, V-14, V-15; caller has `languages.catalog.write` | no |
| `active` | from `draft` (activate) or from `deprecated` (reactivate) | -> `deprecated` (deprecate) | deprecate: caller has `languages.catalog.status`; not `is_platform_default` (V-12); fallback rules V-09 to V-11 still hold for rows that point here | no |
| `deprecated` | from `active` (deprecate) | -> `active` (reactivate); -> `retired` (retire) | reactivate: V-08 re-checked; retire: V-12, V-13 (>= 30 days since `deprecated_at`) | no |
| `retired` | from `draft` (cancel) or `deprecated` (retire) | none | none; `retired_at` set on entry | yes |

Diagram:
```
draft --activate--> active --deprecate--> deprecated --retire--> retired
  |                   ^                       |
  +--cancel-----------|-------------------------+ (cancel only from draft)
                      +----reactivate---------+
```

Rules on entry to each state:
- Entering `active` clears `deprecated_at`. Entering `deprecated` sets `deprecated_at = now`.
- Entering `retired` sets `retired_at = now` and reserves the tag permanently (A-languages-07).
- Every transition increments `revision` and writes one audit event (see [commands_queries_events.md](commands_queries_events.md)).

## Participant preference states
| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| `none` (implicit, no row) | none; the resolver returns `["en"]` | -> `active` (first set) | set: V-02 to V-04; `expected_revision = 0` | no |
| `active` | from `none` or `withdrawn` (set); from `active` (set, revision +1) | -> `active` (set); -> `withdrawn` (withdraw); -> erased (erasure event) | set: V-02 to V-04; withdraw: caller is the participant | no |
| `withdrawn` | from `active` (withdraw) | -> `active` (set); -> erased (erasure event) | set as above | no |
| erased (row removed) | erasure event from `active` or `withdrawn` | none | erasure is driven by F07 account deletion or an operator-approved legal-hold release | yes |

Notes:
- `withdrawn` stores an empty list. The resolver returns the platform default for `withdrawn`, the same as `none` (A-languages-03).
- Erasure deletes the `language_preference` row and every `language_preference_revision` row for that participant in one transaction. It writes one audit event `languages.preference.erased` carrying `preference_id` and `erasure_ref` only. No tags, names or timestamps of changes are kept. Legal-hold exceptions are in [privacy_retention_abuse.md](privacy_retention_abuse.md).
- Stored tags that point to a `retired` catalog entry remain in the list (A-languages-05). Resolution skips them.

## Client-side pending write (offline, D08)
These states exist only on the device, in the local pending queue. They are not server states and are never shown to other devices as applied.

| State | Entry | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| `pending_local` | the user saves a list while offline or the server call fails with a retryable error | -> `acknowledged`; -> `rejected`; -> `discarded`; stays in `pending_local` on retry | retry uses the same `command_id` and `expected_revision` | no |
| `acknowledged` | server returns success with the same `command_id` | none | none | yes |
| `rejected` | server returns a non-retryable error code | none; the user sees the message and may create a new write | error code is non-retryable | yes |
| `discarded` | a newer local write for the same participant replaces it, or it is older than 7 days | none | A-languages-18 | yes |

Rules:
- At most one `pending_local` write per participant per device. A newer local write replaces the older one and marks it `discarded` (A-languages-18).
- Retry backoff: 2 s, 4 s, 8 s, 16 s, then every 60 s, with jitter of plus or minus 20 percent. Retries stop on `acknowledged`, `rejected` or `discarded`.
- A `pending_local` write that gets `LANGUAGES_REVISION_CONFLICT` is not silently replayed. The client re-reads, shows the server list and the local list, and asks the user to pick one. Picking the local list creates a new write with the new `expected_revision`.

## Timers and expiry
| Timer | Duration | Effect |
|---|---|---|
| Deprecation waiting period | 30 days from `deprecated_at` | earliest time `retire` is accepted (V-13) |
| Pending write expiry | 7 days from creation on device | `discarded`, user notified on next open |
| Idempotency record | 24 hours (see failure file) | duplicate command within window returns stored result |
| Retention sweep | daily 02:00 UTC | removes revision history per privacy file |

## Concurrency and recovery
- Catalog transitions take a row lock on the catalog entry. Two operators activating the same draft: the second call returns `LANGUAGES_INVALID_STATE_TRANSITION` after the first commits.
- Capacity check (V-15) for activation runs inside the same transaction as the state change.
- Preference writes compare `expected_revision` inside the transaction. Mismatch returns `LANGUAGES_REVISION_CONFLICT` and writes nothing.
- Partial failure: the state change and its audit event commit in one transaction. If the transaction fails, neither is visible, and the client retries with the same `command_id`.
- Compensation: deprecation is undone by reactivation (a forward transition); a preference change is undone by a new `set` with the previous tags (a forward revision). No state is rolled back in place. Retirement is not reversible (terminal).

## Performance budget (R03)
- Catalog transition p95 <= 300 ms, error rate < 0.1 percent excluding caller errors.
- Preference set p95 <= 300 ms.
- Client state changes are reflected in the UI within 100 ms of local save, before server acknowledgement, and marked as pending.
- State is announced to assistive technology: "Saved", "Saved on this device, will sync", or the specific error. Pending state is shown with text and an icon, not colour alone.

## Adversarial and edge cases (R02)
- Replay of an old `set` with a stale `expected_revision`: rejected by the revision check.
- Two devices race with the same `expected_revision`: first commit wins; the other receives a conflict.
- Operator attempts to deprecate `en`: rejected by V-12, with no state change.
- Clock skew on client: the client never computes expiry for server states; only the device's pending TTL uses device time, and it is advisory.

## Assumptions
**Assumption A-languages-04:** Activation requires coverage >= 60 (see [validation_rules.md](validation_rules.md)).

**Assumption A-languages-05:** Stored tags are not rewritten on catalog changes; resolution applies fallback.

**Assumption A-languages-06:** Retirement waits 30 days after deprecation.

**Assumption A-languages-07:** Retired tags are reserved permanently.

**Assumption A-languages-18:** Each device keeps at most one pending write per participant. Pending writes expire after 7 days. Latest local write wins locally; server ordering uses `expected_revision`.

## Open decisions
- A-languages-04, A-languages-05, A-languages-06, A-languages-07, A-languages-18.
- Whether erasure is driven by F07 events or by a request to this module is unresolved; default is F07 event with this module as subscriber.

## Test references
State and transition tests: `TEST-PS-113-03-Tnn` in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).
