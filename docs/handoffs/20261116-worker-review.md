# Fresh background-matching review — November 16, 2026

## Scope and checkpoint

Reviewed the implementation team's `20261116-matcher-worker.md` milestone on
`codex/parallel-completion-20261116`, draft PR #42. This review made local changes
only; the integration owner must record the final published source SHA and
combined/browser qualification. No commit, push, merge or deployment was made by
this reviewer.

Inspected the worker request/client/entrypoint, actual `barter.ts` composition,
unchanged signed-graph admission and cycle engine, public-asset build and service
worker, and focused integration/browser/CLI tests.

## Findings fixed

1. **Explicit cancellation was reported as a failed operation.** The worker
   correctly rejected cancellation, but the UI rethrew it through the outer
   application error handler. The new browser journey expected ordinary status
   while the implementation would write the alert instead. Barter's action
   wrapper now handles `MatchingWorkerError('CANCELLED')` as ordinary status,
   without dispatching a command or reporting a failed transaction. Destruction
   still suppresses obsolete session updates. A direct mounted-UI regression
   checks status, absence of failure/command calls, and worker termination.
2. **Count-only serialization batches could process too many bytes without
   yielding.** Twenty-five near-limit signed envelopes can be much larger than
   twenty-five ordinary listings. Preparation now yields after 256 KiB as well
   as every 25 records. One individually bounded envelope can cross the byte
   target; this is cooperative scheduling, not a hard latency guarantee. A
   regression cancels before the second large envelope is processed.

## Reviewed invariants

- Array count limits are checked before copying or encoding their elements;
  canonical serialization separately enforces one-envelope byte/complexity
  bounds, and total serialized input remains capped at 32 MiB. The worker
  independently checks the request shape, count and UTF-8 byte bounds.
- Only explicit policy and signed public statement arrays are constructed by
  the production call site. Vaults, identities, signing keys, storage and draft
  rows are not sent. Signature/projection admission remains inside the worker;
  no caller-supplied pre-admitted graph is accepted.
- Cancellation applies during cooperative preparation and worker execution.
  Replacing a request rejects the previous generation; late replies cannot
  resolve the new request. Disposal cannot restart a worker. Completion, error,
  malformed/wrong-ID response and watchdog expiry terminate it.
- The temporary Cancel matching control bypasses the application action queue
  and is created after the global busy-button snapshot. It authorizes no
  transaction. Policy changes cancel pending matching. Domain proposal intake
  still independently rechecks current evidence before any commitment.
- Result bounds match the unchanged engine. `rejected` counts excluded wants,
  not listing statements, so its maximum is 20,000. Engine expansions, node/
  edge counts, retained candidates, cycle lengths, scores and currencies retain
  their existing limits.
- The bundled worker is addressed relative to `app.js`, included in the scoped
  public cache allowlist and included in its build digest. Private/runtime
  responses do not enter that cache. No synchronous matching fallback was added.

## Validation

Command:

```sh
corepack pnpm exec vitest run tests/integration/matching-worker.test.ts packages/mutiny/src/cycle_matching --maxWorkers=1 --no-file-parallelism
```

Result after both fixes: **24/24 passed** in three files, including **11 worker
tests**, the existing eight matcher tests and five signed-admission tests.
These cover real signed-record equivalence, tampering, blocks, invalid/bounded
requests, cancellation during preparation/execution, stale generation replies,
session disposal, worker deadlines, startup/transport/result errors and mounted
UI cancellation. No assertion or timing limit was weakened.

The bounded shared-tree typecheck also passed after the review fixes:
`GOMEMLIMIT=256MiB GOMAXPROCS=2 corepack pnpm typecheck --singleThreaded`.
`git diff --check` passed.

The implementation team separately recorded 18 passing CLI tests and a passing
build. The reviewer did not repeat those unaffected checks. Final-head browser
execution must still qualify the actual offline module worker, cancellation
control and signed barter journeys in Chromium, Firefox and WebKit; loaded
definitions and Node fakes are not browser evidence.

## Remaining limits

This completes a bounded background-execution slice, not canonical F02 or the
whole barter workflow. Large encrypted record reads, result rendering, target
mobile latency and the specified total-memory target remain unqualified.
Serialized input bytes are not peak memory. Timing-truncated results remain
device-dependent. Transaction-scoped feasibility remains in the authoritative
domain transaction; moving it to an earlier asynchronous snapshot would weaken
current hold/evidence checks. Full matching profiles, compensation, handover,
recovery and private transport remain outside this milestone.
