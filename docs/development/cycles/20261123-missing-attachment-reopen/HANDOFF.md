# ClassRup — missing attachment reference / encrypted destination reopen handoff

Date: 2026-11-23 UTC. Frozen parent: draft PR #128, published head `30c541d8f1248efc8f49ed9c592fb6f313c1f211`, tree `6ffd1fc2bc5340ddf0621d97b66403a6909577d7`. Branch: `codex/classrup-missing-attachment-20261123-t12`. Re-resolve branch and PR identities before editing or qualifying. This is a separate additive child; do not rewrite, merge or force-update its parent.

## Verified predecessor qualification

At the exact PR #128 head, Alpha run [45085904376](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45085904376) finished **success**. The domain job 137404381335 executed typecheck, specification, boundaries, registry, independent money vectors, tooling (27 passed), **944 domain assertions passed with zero failed/pending/skipped**, setup/build and 26 Chromium browser journeys passed. CLI [45085904295](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45085904295) finished **success**, with its plan and Ubuntu Node 22/24 clean-install and browser-smoke jobs completed. These are predecessor source-specific results, not qualification for this child. PR #128's submitted independent GitHub reviews were zero at inspection; PR #127 also had zero.

Historical evidence remains unchanged: #126 initial TypeScript failure 45074487619, #126 corrected-head domain fixture failure 45074614282, #120 original Firefox failure, #116 and #105 Alpha failures, PR #56 cancelled main-push Alpha, and the local complete domain runner exit 137 before its JSON report. Do not substitute passing parent results for current-source acceptance.

## Bounded next recovery acceptance

New `tests/integration/backup-inspection-missing-reference-reopen.test.ts` exercises an actual encrypted IndexedDB wrapper using fake-indexeddb. It stores a normal principal-owned record and a syntactically valid blob-ref holder with **no local blob bytes**; that state is valid through the public `tx.blobs.attach` contract (`present: false`). It asserts the principal's diagnostics show one missing blob and zero stored references, with no private payload/ref/holder string in the report. It then closes and reopens the encrypted source, exports existing v1, restores a differently named encrypted destination and **reopens that destination**. The record and principal survive; bytes and holder references are explicitly excluded. The test must not be interpreted as portable attachment recovery or proof of authority over arbitrary holder labels.

This is test-only; it intentionally changes no production code, signed v1 wire, encryption/KDF, signing identity, resource/product cap, test limit or browser selection. No local repository test could execute: the container's `git ls-remote` failed DNS resolution for github.com. The authored test has **no executed RED/GREEN evidence** at publication. Obtain exact-child hosted results before asserting correctness.

## Distinct fresh review responsibilities (assigned, not launched)

1. **Code auditor:** inspect the child exact tree, `packages/kernel/src/storage/tx.ts` and the driver `referenceCoverage` semantics; validate the test's public port contracts, origin/destination reopening and v1 compatibility. Record actual executed checks separately from static inspection.
2. **Functional bug hunter:** run this single test first, inspect any concrete failure and then evaluate the exact head's Alpha/CLI jobs. Focus on legitimate missing-holder state, fake-indexeddb parity, principal continuity and the second destination reopen. Avoid concurrent heavy runners.
3. **Defensive security reviewer:** review aggregate-only diagnostic disclosure, unverified holder strings, principal scope, authenticated encrypted row addressing, and fail-closed manifest boundaries. Source-focused review/hardening only; do not resume previously interrupted security reproduction follow-ups.

No independent worker runner or reviewer was available through this session; no completed independent review or approval is claimed. Keep genuine review as a merge gate.

## Next P1 implementation and integration

The authenticated attachment manifest and destination re-encryption remain **unimplemented**. Before building them, audit source writers/readers for owner-authorized parent records, bind canonical references and principal authority, specify independently bounded binary transport, and prove atomic destination rollback. Reference holders are **not owner authorization**. Keep current v1 behavior unchanged and preserve native-browser/device failure acceptance as separate gates. Retained queue/lease recovery, key rotation and WebKit identity import are also open.

Next generation: start from fresh remote main, open PRs and worker ownership; read `docs/development/REMAINING_WORK.md`, `docs/development/cycles/20261119/HANDOFF.md` and all later handoffs; inspect this child's exact CI and any real failures; reconcile with independent review. Merge only after its own required gates, independent approval and parent ancestry are qualified, then verify actual merge tree and main-push checks. No release, deployment, force push, deletion, paid API or unrelated/paused automation mutation.
