# Combined vault recovery and backup inspection

The combined candidate targets `main` after PR #69 merged at
`94c272197bc6968a079d0bb626b1e0f6dce04f2d`. The merge tree matched the hosted
qualification, which passed 839 domain assertions, 78 browser journeys, 27 tooling
tests and 46 CLI tests on each of Node 22 and Node 24.

| Source | Integrated head |
|---|---|
| #157, attachment verification and storage | `fdb1def1bd84733d7aecf18a01c0fed5d8ac06a3` |
| #86, PWA diagnostics and pre-open codec validation | `85d6067b171e238d5a464d397eeaf5021e5c9cc5` |
| #73 and #83, prior publication and qualification records | `f919a0042ba46ba992b06c7324a1a70899441948` and `518ad6bc188afa3c283bcfef8b2d1aca63b7d57e` |
| #153, IndexedDB abort coverage | `07e3aa28e6bf66b2760950038f6746fa85079d7e` |

The two code lines diverged at #68. The merged vault validates and binds registered
callbacks, including `attachmentRefs`, before opening an IndexedDB writer. The
production PWA reads both backup diagnostics from one snapshot and retains a valid
record inventory if the optional attachment diagnostic fails. The currency test
checks the decimals belonging to the winning registration. The prior test suites
retain their distinct attachment, persistence, restore and compatibility cases.

The source reviewed before the final guidance edits had tree
`2390845e9d58b4480a9ff7a58335924921af2d33`. An independent comparison found all
135 test files and all 848 statically identifiable named tests from the two parent
lines. The number of executed cases comes from the test runner. The combined tree
passed full repository typechecking, the spec, dependency and registry checks,
331 independent money vectors, the money bundle size check and production build.

The candidate preserves 89 of the 90 open PR heads observed after #69 merged.
PR #8 remains a separate foundation proposal. Check the combined PR's own Alpha
and CLI runs before merging. After a merge, verify the actual main tree and its
push checks. The feature backlog still includes production attachment-evidence
issuance, durable record-incarnation and replay checks, and a PWA domain media
workflow. The current verifier is read-only.

## Attachment read cleanup follow-up

Code and functional review covered head `3c051fec4082f071a6adb45c5fc934882e3fda43`. Its six final documentation edits preserved the executable tree reviewed earlier. Its hosted Alpha passed 1,020 domain assertions and 78 browser journeys across Chromium, Firefox and WebKit. CLI passed 46 tests on each of Node 22 and 24. Those figures describe the earlier head.

Defensive review identified two issues in that tree. A read adapter could reject after the manifest exporter or single-blob reader had collected bytes, leaving temporary copies unwiped. The kernel also used the view's public byteLength property when validating the size of a copy. This follow-up holds owned copies through finalization of the read and shares the vault's existing fixed-size copy routine with the kernel. The adapter's original bytes and a successful caller's returned bytes remain intact.

The synthetic late-read regression failed before the manifest repair and passed afterward, alongside the existing missing-parent-bytes case. Kernel regressions cover late read failure and byte views with an offset. Both failed before the repair. The focused kernel and attachment-copy run passed 27 tests in five files and the manifest cleanup file passed both cases. Full TypeScript checking passed. Use this PR's updated Alpha and CLI results for integration, then check the main-push workflows on the actual merge SHA. The later read-only transition issuer is tracked in the #159–#161 stack.
