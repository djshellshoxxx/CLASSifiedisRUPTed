# Integrated candidate qualification

Runtime/test source after the final fixture correction:
`ce8251947a87bc55d8919b79f07e21c5a0b63ec4`, tree
`425b10ff48e6ef54c7579a41e457a5ea020a1121`.
The complete-domain invocation started at
`590dd14468b25ccbffac1f7da3632c736f0290e1`; its intervening changes were five
documentation/evidence files only. Publication mappings in
[publication-map.json](publication-map.json) preserve equal trees and mapped
parent order. The final PR identifies later documentation-only commits.

## Actual checks

| Check | Result | Scope |
|---|---|---|
| Full repository `pnpm typecheck` | Pass, exit 0 | Integrated source after branded-ID test-fixture correction; 3.9 seconds |
| Specification consistency | Pass, exit 0 | Existing unchanged gate |
| Dependency boundaries | Pass, exit 0 | Existing unchanged gate |
| Feature registry generation check | Pass, exit 0 | Existing strict gate |
| Independent Python money vectors | Pass, exit 0 | Existing reference vectors |
| Money browser bundle budget | Pass, exit 0 | Existing size limit |
| Tooling tests | 27 passed, 0 failed/skipped | Existing tests, serial file execution |
| Non-interactive setup | Pass, exit 0 | Current pinned dependencies |
| Production build | Pass, exit 0 | Current PWA and strict registry check |
| Combined affected domain run | 126 passed, 0 failed/pending | 15 files before the two later key-codec repairs |
| Key-codec implementation run | 14 passed, 0 failed/pending | Five files at the repair worker's exact source; overlaps existing preflight cases |
| Corrected publication test fixture | 1 passed, 0 failed/pending | Integrated source after the branded-ID correction; normal signed evidence and identity round trip |
| Complete local domain suite | **Incomplete: exit 137** | Killed after 145.485 seconds, before a JSON report; no assertion total claimed |
| Fresh native-browser journeys | Pending hosted qualification | Not run locally for this candidate |
| Current candidate CLI matrix | Pending hosted qualification | Earlier PR/main results do not qualify this candidate |

The complete domain run kept the existing per-test limits and used one worker,
a 768 MiB Node heap limit and a 1,200-second process cap. It was killed before
the cap and produced no final report. Its unsuccessful invocation is retained,
not replaced with a focused-run total. No test limits, workflow selection rules,
cryptographic vectors or product caps were weakened.

The first full compiler invocation reached two actual diagnostics in the new
publication test: string literals were not branded kernel IDs. The fixture now
uses the existing deterministic ID generator. That failure and the successful
full rerun remain separate evidence. Earlier killed compiler/runner attempts
are retained in the parent [root evidence receipt](root-evidence/receipt.json).

## Independent reviews

The [engineering handoff](HANDOFF.md) links all twelve completed assignments,
their frozen sources, exact outcomes and limitations. The final static security
review found no additional blocker in its source scope; it ran no application
code. The separate positive compatibility review used eight normal records,
former codec definitions producing canonical v1 data, the new production codecs
and another current round trip. These are four native probe groups, not extra
Vitest assertions or a historical-backup corpus.

The G3 security follow-up that stopped at automatic review is retained as a
partial observation. It is not counted as a completed audit. The defensive key
repairs and fresh static review completed the remaining code-review work.

## Evidence and remaining merge gate

[Final gate archive receipt](root-evidence/final-gates/archive-receipt.json)
records exact decoded byte lengths and SHA-256 hashes for the compiler,
static/build, tooling and incomplete full-suite logs. Full command arguments,
source/tree, process caps, elapsed times and exit statuses are in its per-phase
receipts. Gzip archives preserve the exact emitted bytes.

Publish this candidate as a draft, then inspect its actual hosted Alpha and CLI
jobs at the current head. Merge only after required qualification and review
are complete, verify the actual merge tree, and inspect main's separate push
runs. The prior PR #56 qualification remains separately recorded and must not
be substituted for any of those results. Preserve all pending/failed evidence
if a runner remains unavailable.
