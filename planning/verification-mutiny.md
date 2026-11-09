# Independent matcher and coordination verification

Reviewed from baseline `3694395272e880d929fcb53693ddd70e14bc47bf`; final browser verification exercised product source `de20626fd26087007836c947627d92457cebb8cf` with the added browser tests in the working tree. The final delivery SHA belongs in the integration evidence ledger. These checks establish the behavior of the implemented alpha primitives, not full module-spec completion.

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
- Firefox integration verifies actual local holds, signed consent, durable coordination, dropout and deadline expiry. Complete handover/receipt execution, counteroffer UI, fork-recovery UI and identity-rotation policy are not completed by these checks.
- Firefox covers multi-principal persisted-browser workflows, offline/restart/concurrent-tab behavior and limited keyboard/mobile checks. Chromium/WebKit, manual assistive-technology review and Windows/macOS setup still require evidence.
- Alpha statement schemas are explicitly namespaced separately from canonical module schemas. No production-readiness or full-contract compatibility claim is made.

## Final real-browser verification

Command: `corepack pnpm exec playwright test --project firefox`.

**Eight tests passed in 1.5 minutes**, against product source `de20626fd26087007836c947627d92457cebb8cf`, Firefox 157, Linux x64, Node 24.22.1. Only test/CI files differed from that product commit during the run.

1. Persistent local identity/listing, real signed publication download, isolated peer import, repeat upload, tamper rejection, reload, offline write and offline reload.
2. Wrong passphrase preserves records; locking clears unsubmitted form text.
3. Encrypted backup contains no plaintext title/passphrase and restores the same principal and listing into a fresh vault, surviving reload.
4. Concurrent tabs cannot both acquire a writer; releasing the first session allows the second to unlock the persisted records.
5. Mobile viewport 390×844 has no horizontal overflow, visible buttons are at least 44px high and keyboard-triggered error feedback receives focus. The full-page screenshot was visually inspected: labels and long text remain readable with no clipped controls.
6. Two isolated principals publish and exchange real signed listing/want files, discover their cycle, explicitly propose, reserve and consent, reach committed status and retain it after reload. Signed withdrawal cancels both local coordinations and releases both holds. A fresh unanswered proposal expires on both participants.
7. Three isolated principals complete the same real signed exchange and persist committed state across reload.
8. Four isolated principals complete the same real signed exchange and persist committed state across reload.

The cycle tests explicitly control browser Date to advance through the specification's 15-minute want-aging interval and consent deadline. Keys and signatures, IndexedDB storage, downloaded/imported files, domain commands and UI interactions are real; no signatures, persistence adapters or matching results are mocked.

Screenshot: `test-results/alpha-mobile-layout-stays--b97f0-ses-keyboard-error-feedback-firefox/mobile390.png` (transient test artifact). Minor visual polish remains: the trust checkbox sits above its text and the Refresh/Discover controls touch when wrapping; neither clips or overflows.

## Browser engines not verified

- System Chromium aborted before application loading at `process_singleton_posix.cc:297`, `socket() failed: Operation not permitted`. The official Chromium headless-shell installer exhausted its built-in download attempts with corrupt 0 MiB archives. No Chromium success is claimed.
- WebKit 27.2 downloaded through Playwright's built-in Microsoft mirror fallback but all four attempted launches were blocked by missing system libraries: `libgtk-4.so.1`, `libgraphene-1.0.so.0`, `libharfbuzz-icu.so.0`, `libmanette-0.2.so.0`, `libhyphen.so.0`, `libGLESv2.so.2`. `playwright install-deps webkit` failed because the executor could not switch to root (`su: System error`). No WebKit success is claimed.

No privileged changes or policy workarounds were performed. The cross-engine projects remain configured for an executor with the required runtimes. Firefox evidence establishes the tested alpha journey, not completion of every canonical module contract, formal security certification or full manual accessibility acceptance.
