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
