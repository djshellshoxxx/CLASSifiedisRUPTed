# Parallel integration handoff — November 16, 2026

## Resume here

Repository: `djshellshoxxx/CLASSifiedisRUPTed`. Draft [PR #42](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/42),
branch `codex/parallel-completion-20261116`, continues from PR #41 at
`560b328dd335aebdc12de01ec339c43ebd164be3`. The latest reviewed source is
`bdd2971c675d996a6a8e38b8a36362b549790274`, including first-wave source
`36428ccc8a1ccf365418748abd7cc6ee2dc2bfb3`, browser repair `7bf7d51` and the
second-wave additions below. Later documentation commits must be distinguished
from this source qualification. No merge, release or deployment
was performed. The product remains incomplete.

Implementation teams completed separate checkpoints for listing lifecycle,
vault/identity, money and consent/notifications. Fresh agents consumed the
inventory/milestone handoffs, independently reviewed the code and supplied
regression findings. Their records remain in this directory; do not restart
from an older branch or interpret a parked PR as unique missing implementation.

## Delivered and remaining

| Area | This checkpoint | Remaining dependency or acceptance gate |
|---|---|---|
| Listing lifecycle | Owner closure reasons; signed expiry withdrawals; bounded unlocked-vault expiry/30-day archive maintenance; verified publication/withdrawal re-download; existing 90-day recovery preserved | Complete purge, cross-domain retention, signed reservation-release workflow and canonical federation delivery |
| Vault sessions | Default 15-minute inactivity lock (session setting 1–60), five-minute hidden-tab lock, reconnect-persistent page-local unlock backoff, safe crypto stage errors | F07/F16 policy conflict, delegated-device recovery/rotation, upstream WebKit cryptography compatibility, full physical/browser qualification |
| Session privacy | Synchronous private-view cleanup, stale result/export guards, serialized storage closure, visible close failure and blocked reopen | Manual/device qualification; no claim that JavaScript strings are physically erased |
| Money | Pure 38-digit exact arithmetic, single-round rational conversion, deterministic allocation, 331 independent Python vectors, 40,000 property cases, 2,355-byte gzip bundle and CI gates | Specified Android performance target and unchanged 2 ms allocation budget; currency registry and authenticated quote providers; old 78-digit alpha wire format remains compatible |
| Consent | Subject-known signed consent/decline/revocation core, participant/revision/wording binding, immutable evidence, reserved withdrawal capacity, first-seen replay handling | Not enabled in PWA: needs owning-domain adapters, confirmation wording UI, backup validation, quarantine and device lifecycle |
| Notifications | Signer sequence/previous-CID checks and mirror payload-sequence consistency | Quiet-hours pinned timezone data and real external dispatch; private messaging and meetups remain unimplemented |

The PWA deliberately does not offer direct `releaseHolds=true` closure/archive.
Users withdraw existing commitments through Barter coordination first. The
domain option is explicit local-only state; it is not signed peer withdrawal.
Maintenance creates no automatic download or transport claim. Its five-page,
500-listing pass preserves its cursor and confirmed counts; failed/partial scans
resume and completed scans are throttled for one minute. Lock disposes timers,
maintenance and all session-bound views.

## Independent findings resolved

- Delayed command results could escape after an automatic lock during notification
  delivery. Session checks now cover the final await and every export is bound
  to its originating session.
- Manual close errors were suppressed after revocation; failed startup left
  private DOM behind and awaited close before cleanup. Shared synchronous cleanup
  and explicit close-error handling now cover all paths. Concurrent close calls
  chain behind the existing close promise.
- The broad kernel import made the money bundle exceed 12 KiB. A narrow errors
  export reuses existing helpers without importing unrelated runtime schemas.
  The complete-suite export allowlist was updated to cover that deliberate export.
- Repeated unique-CID revocations could exhaust reserved withdrawal capacity.
  Additional revocations of an already-revoked record are rejected while exact
  CID replay stays idempotent.
- Consent replays checked delegated key validity at the replay time. They now
  retain the authenticated original first-seen time.

## Verification and limits

Focused implementation/review suites passed, including lifecycle 42, combined
consent/notification 41, money 12, session/maintenance 14, and vault/identity/storage
checks listed in their owning handoffs. CLI/tooling 32 passed. Typecheck, build,
setup/doctor, dependency check, whitespace and strict specifications passed
(148 modules, zero errors/warnings). Python verified 331 vectors independently;
bundle CI enforces 12 KiB without treating a host timing sample as a hardware pass.

The initial combined local attempt reported 585/589 passed and four failures:
the now-fixed kernel export allowlist, two unchanged security/barter timeouts,
and the unchanged currency timing assertion. It was interrupted after prolonged
runner shutdown. Preserve that failed report; focused passes do not erase it.
The visible serial retry subsequently completed 588/589; its sole failure was
the same unchanged saturation timeout. Isolated saturation then passed in
50.296 seconds with the 60-second limit unchanged. All 589 distinct assertions
have passing local execution across these runs, not one green local full run.
An independent performance review found the saturated barter test uses its own
native signer and never calls the changed identity wrapper. Its quadratic replay
verification code is unchanged; broad unrelated suites slowed by roughly 3–8x
versus the passing 522-test baseline. This supports host contention but does not
turn a timeout into a pass. Final combined/CI outcomes belong in PROJECT_STATUS.

GitHub's [Alpha run](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43957906791)
at `36428cc` passed its domain test step, typecheck, strict specifications,
dependencies, tooling, Python vectors, bundle check, setup and build. Browser
journeys reported 51 passed and six harness failures (month-long timer simulation
and ambiguous history panel selection across all three engines). Commit `7bf7d51`
repairs both without removing assertions or raising timeouts; its Alpha rerun
`43959971234` passed all 57 browser journeys and combined domain step, and all six
platform jobs passed on that same repaired candidate.
All six jobs of [platform CI](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/43957906779)
passed on the original source SHA. Local Chromium exits before
assertions because this host denies a required Unix socket; 57 browser definitions
load, which is not an execution pass. The separate upstream WebKit defect remains
open even if ordinary journeys pass.

Money allocation host measurements varied, including failures above the unchanged
2 ms p99 limit. Target Android hardware remains untested. No historical security
finding is closed just because a related control now exists.

## Second implementation wave

Fresh teams continued from the first milestone without restarting the branch.
The second-wave source is `bdd2971c675d996a6a8e38b8a36362b549790274`, following
currency commit `5c2e766a8b1f260ceef62f2b687a3750fdc7907e`:

- Coarse location preferences now implement owner/tenant-bound set, clear and
  query operations, a rolling change limit, encrypted persistence and backup,
  optional one-time GPS reduction, and explicit copying into listing/search
  forms. The PWA registers the real definitions/codecs and disposes private views
  on lock. The existing backup browser journey also exercises this workflow.
- Signed barter admission and cycle search run in a module worker. Request
  preparation yields, transport and engine limits remain bounded, stale work is
  cancelled, and a Cancel matching control remains available while actions are
  busy. The worker is packaged into the public offline cache. Existing signed
  multi-party journeys exercise it; two new browser tests cover offline execution
  and cancellation.
- The optional currency registry verifies signed snapshots against a configured
  trust root and implements immutable currency/chain bindings, status changes,
  transactional usage checks and strict backup validation. It is deliberately
  unmounted in the PWA: no authentic release snapshot, canonical vault adapter,
  complete downstream usage ports or FX provider is available. Registry and
  arithmetic code/exponent ranges still require explicit adapter reconciliation.

Implementation evidence and review findings are in the corresponding
`20261116-location-preferences`, `20261116-location-review`,
`20261116-matcher-worker`, `20261116-worker-review`,
`20261116-currency-registry` and `20261116-currency-review` handoffs. The parent
must record final combined-source CI in PROJECT_STATUS and the validation JSON;
earlier source checks do not qualify this later wave. The local combined run
completed 630/631 with one unchanged filter timing failure; its isolated file
retry passed without a threshold change. Do not relabel that combined run green.
Final Alpha run `43962230354` passed its combined domain step and all 63
Chromium/Firefox/WebKit browser journeys; platform run `43962230320` passed all
six Linux/Windows/macOS Node 22/24 jobs at source `bdd2971`. The first-wave
harness failures and local host timing failures remain in the validation record.
Later documentation-only commits preserve this exact source tree.

The final [security evidence matrix](../status/SECURITY_EVIDENCE_20261116_PARALLEL.md)
maps all 51 historical findings exactly once to source/test evidence and remaining
closure conditions. None was closed from partial controls or CI success.

## Next teams, in dependency order

1. Qualification team: preserve the passing CI evidence for `bdd2971` and the
   current PROJECT_STATUS; advance the remaining manual/device/crypto diagnostic
   gates and repair any new failure without lowering assertions or budgets.
   Preserve #39 → #40 → #41 → #42 stack provenance and existing external gates.
2. Commerce team: authenticated registry release data/vault integration and rates, then kind-specific
   sale terms, offers/acceptance, revision reconfirmation and transaction-scoped
   holds/Deal creation. Declared barter item values are not cash obligations.
3. Consent integration team: real canonical subject/wording adapters plus
   cross-record backup validation and bounded missing-dependency quarantine.
   Only then expose consent in product workflows.
4. Identity/federation team: authenticated device lineage, revocation/recovery,
   canonical streams and recipient keys before private messaging and delivery.
5. Lifecycle/privacy team: evidence/idempotency/backup-aware retention and purge;
   do not delete only primary listing rows and call it complete deletion.
6. Services/rentals/auctions teams: use the dependency graph in the inventory
   handoff. Services and rentals need real listing kinds/calendars/Deals; auctions
   require an explicitly selected, authenticated ordering host.

All 18 feature groups and historical branch dispositions are mapped in
`20261116-inventory-audit.md`. Continue independent UI translation/accessibility,
map/gazetteer UX, target-device worker measurements and evidence qualification where they do not
bypass those dependencies. None of the source/interface counts is a completion
percentage. Mark a workflow complete only with real product wiring, durable
storage/backup behavior, negative tests and its required external evidence.
