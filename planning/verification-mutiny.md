# Independent matcher and coordination verification

Reviewed on the integration working tree based on `3694395272e880d929fcb53693ddd70e14bc47bf`; final committed SHA belongs in the integration evidence ledger. These checks establish the behavior of the implemented alpha primitives, not full module-spec completion.

## Executed evidence

- `corepack pnpm exec vitest run tests/integration/mutiny-oracle.test.ts`: 12 tests passed. Independent permutation oracle covers all 64 directed three-vertex graphs and 200 seeded four-vertex graphs (seed 42). Compares total admissible cycle count and independently hashed greedy selection, then reverses input order. Also tests rotation versus direction, unique items, currency isolation, count/time/candidate truncation.
- Same suite uses real WebCrypto Ed25519 signatures for outsider rejection, cancellation authority, reordered consent/reservation delivery, replay deduplication, unanimous commitment, revised-digest invalidation, fork freezing, nonfinite feasibility timestamp rejection and monotonic expiry observations. A signed historical-fork regression verifies that later revisions cannot hide the fork when import order changes.
- `node --test tests/tooling/trace.test.mjs`: 4 tests passed. Source references alone cannot produce passing coverage. Missing/malformed execution results fail; failed/skipped duplicate IDs defeat passing results; missing CLI arguments fail.
- Benchmark command: `node tests/tooling/mutiny-benchmark.mjs`. Linux x64, Node v24.22.1, AMD EPYC 9V74; seed 42, 1,000 nodes, 5,000 edges, Lmax 5, 100 runs. Observed total-call p95 37.90 ms, max 60.32 ms, maximum expansions 100,000. **All 100 runs truncated at the expansion budget**; these measurements do not establish complete enumeration or phone/browser performance. Results vary with host load.

## Findings resolved during review

1. Trace tool counted source IDs as passing when results were absent, including when an explicitly supplied file did not exist. It now requires passing execution assertions and fails closed on missing/malformed evidence. Supplied results remain unauthenticated; source-SHA provenance must be recorded separately.
2. Matcher retained and hashed every cycle within the expansion budget, allowing disproportionate memory and post-deadline hashing. It now stops at 500 retained candidates and explicitly reports `results` truncation. This additional resource bound is an alpha policy, not an assertion that the canonical full matcher specification is implemented.
3. Coordination accepted NaN feasibility timestamps through comparison checks. It now validates finite safe integers and boolean feasibility.
4. Remote consent arriving before its reservation was rejected; reordered valid evidence is now retained without commitment until all required statements exist.
5. Admission initially remembered forks only at the latest revision, making historical-fork detection depend on delivery order. Revision/CID conflict tracking now preserves the freeze across ordering and later revisions.

## Remaining acceptance gaps

- The alpha admission layer supports reverified exact-item signed wants, local opt-in/blocks, unknown-identity gating, freshness and conservative same-region matching. Full matching profiles, category/condition matching, precise coarse-cell policy, trust/key-linkage and valuation policy remain outside this evidence.
- Full module command/event/requirement trace mappings, persisted suggestions, rate limits, suppression/retention and two-device deterministic cross-browser evidence remain unverified.
- Coordination primitives do not prove atomic local inventory persistence or durable cross-vault recovery. Complete handover/receipt execution, counteroffer/dropout recovery and identity-rotation policy are not completed by these checks.
- Multi-principal persisted-browser workflows, offline/restart/concurrent-tab behavior, accessibility and Windows/macOS command-line checks require integration evidence.
- Alpha statement schemas are explicitly namespaced separately from canonical module schemas. No production-readiness or full-contract compatibility claim is made.

## Browser verification follow-up

`playwright.config.ts` and `tests/browser/alpha.spec.ts` define four actual-app journeys covering isolated peer contexts, persistent reload, signed-file download/import/repeat/tamper, offline reload, wrong passphrase, clearing forms on lock, encrypted backup restore and concurrent-tab writer exclusion. `playwright test --list --project chromium` discovers all four; the integrated TypeScript check passed when added.

Executed `corepack pnpm exec playwright test --project firefox --project webkit` after installing the engines through Playwright's built-in Microsoft mirror fallback:

- **Firefox 157: all four browser journeys passed** (31.3 seconds for the combined run). This establishes actual IndexedDB persistence, isolated principals, signed peer file exchange, repeated upload, tamper rejection, offline reload, wrong-password recovery, encrypted backup restoration and concurrent-tab writer exclusion for the tested working tree.
- **WebKit 27.2: all four blocked before launch** by missing system libraries: `libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libharfbuzz-icu.so.0`, `libmanette-0.2.so.0`, `libhyphen.so.0`, `libGLESv2.so.2`. Not application failures and not passed checks.
- Earlier system Chromium launch via `CLASSRUP_CHROMIUM_EXECUTABLE=/usr/bin/chromium` aborted at `process_singleton_posix.cc:297`, `socket() failed: Operation not permitted`. An official headless-shell runtime remains a possible supported alternative; no Chromium success is claimed here.

PWA review identified missing restore wiring, missing registered backup codecs, retained private form text after lock and failure-state cleanup; the integration owner implemented fixes. Firefox subsequently verified the tested recovery/locking paths and offline service-worker reload. This remains a listing/identity alpha journey, not the missing full barter coordination browser milestone.

Additional Firefox mobile check: `playwright test --project firefox --grep 'mobile layout'` passed. At 390×844 the document has no horizontal overflow, visible buttons are at least 44px high and a keyboard-triggered backup error receives focus. `test-results/alpha-mobile-layout-stays--b97f0-ses-keyboard-error-feedback-firefox/mobile390.png` was captured and visually inspected: long text wraps, labels remain readable and no controls are clipped.

Browser dependency remediation was attempted: `playwright install-deps webkit` failed because the executor could not switch to root (`su: System error`); `playwright install chromium-headless-shell` exhausted its built-in download attempts with corrupt 0 MiB archives. No privileged changes or policy workarounds were performed.
