# Barter matcher worker handoff — November 16, 2026

## Resume and scope

Implemented on `codex/parallel-completion-20261116`, continuing the reviewed source
checkpoint `36428ccc8a1ccf365418748abd7cc6ee2dc2bfb3` in draft PR #42. The owning
team made no commits or remote changes. Parent integration must record the exact
final source SHA and its combined/browser checks. This is a responsive execution
slice for the signed exact-item alpha; it does not complete canonical F02.

## Delivered

- `apps/pwa/src/matching-worker-protocol.ts`: versioned strict request/result
  schemas, 4,000 signed listing statements / 20,000 signed wants, 1 MiB per
  envelope and 32 MiB total UTF-8 serialized statement ceiling. These are transport
  bounds, not a peak-memory claim. Worker independently enforces all limits,
  re-verifies every signature/projection through `admitSignedGraph`, and calls
  the unchanged deterministic `discoverCycles` engine. Never accepts a caller's
  allegedly admitted graph. Fixed error codes do not expose native error text.
- Encoding snapshots the source arrays, validates counts before serialization,
  and yields every 25 records. Cancellation/session checks run between batches.
  Only public signed statements and explicit admission/search policy cross the
  boundary; no session object, signing key, vault/storage, or draft listing rows.
- `matching-worker-client.ts`: one fresh worker per request; old generations,
  explicit cancellation, disposal, startup errors, deserialization failures,
  malformed/wrong-ID responses and 60-second worker watchdog all fail closed.
  Workers terminate after both success and failure, releasing retained input.
  A disposed session client cannot restart. No main-thread search fallback.
- `matching-worker.ts`: dedicated one-request execution entrypoint.
- `barter.ts`: actual discovery and fresh proposal revalidation use the worker.
  Policy changes cancel pending work; mount destruction disposes the client.
  A temporary **Cancel matching** button bypasses the serial action queue and
  remains enabled while the outer app disables existing buttons. Cancellation
  returns control, allowing immediate manual locking. Suggestions still create
  no consent or inventory commitment; proposal ingest and transaction-scoped
  feasibility remain authoritative.
- CLI build emits `matching-worker.js` beside `app.js`. A relative `import.meta.url`
  worker URL supports configured base paths. Service-worker cache allowlist and
  build digest include the new public asset; runtime data never enters the cache.

## Validation

- Initial focused run: 21 passed across worker (8), existing matching (8), and
  signed admission (5). After cooperative preparation, its regression test and
  typed worker fixes: worker suite **9/9 passed**; therefore 22 distinct focused
  assertions have passing execution. Parent should run the final combined suite.
- CLI **18/18 passed**, including new worker build-output assertion and updated
  exact service-worker cache allowlist. Native source rejection diagnostics in
  the build-failure fixture are intentional; that test passed.
- Bounded typecheck completed successfully after the final client/protocol changes.
- New browser definitions in `tests/browser/matching-worker.spec.ts`: actual
  module worker works offline after public-app installation; PWA cancellation
  remains operable while a deliberately stalled worker keeps ordinary actions
  busy. Existing real signed barter browser journeys now exercise worker admission
  and proposal revalidation. Browser execution remains for parent exact-head CI.

## Fresh review focus

1. Verify worker request privacy, independent byte/count validation, signature
   verification, fixed errors and unchanged deterministic engine budgets.
2. Exercise generation replacement, cancel during preparation and during running
   work, lock/dispose, malformed responses, failed startup and timeout paths.
3. Inspect the temporary cancellation button with the global busy-button snapshot;
   confirm it cannot authorize a command or leak a result after session end.
4. Verify production asset build, relative worker URL, offline cache and final-head
   Chromium/Firefox/WebKit journeys. Do not treat definitions or Node tests as
   browser execution evidence.

## Remaining limits

The 250 ms / 100,000 expansion / 500 retained-candidate engine caps are unchanged.
Time-truncated results remain machine-dependent; worker placement does not make a
search exhaustive. The 60-second watchdog covers worker execution after cooperative
preparation, not a new total-operation performance guarantee. Main-thread public
record reading, bounded encoding and result rendering still require target-device
measurement; 32 MiB serialized input does not establish the canonical 32 MiB memory
budget. Full-cap mobile latency and real device/browser qualification remain open.
Transaction-scoped command feasibility intentionally still runs inside its domain
transaction; moving that to an untrusted asynchronous snapshot would break current
hold/signature guarantees. Full matching profiles, canonical query interfaces,
compensation, handover, recovery and authenticated private transport remain pending.
