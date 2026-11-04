# ClassRup branch consolidation audit — 2026-11-04

This document records GitHub comparisons, not merged code or executed tests.

| PR | Ahead of main | Behind main | Files reported | Workstream |
|---|---:|---:|---:|---|
| #1 | 34 | 0 | 29 | Prompt 3 contracts / NO-GO audit |
| #2 | 38 | 0 | 300+ | specification checkpoints |
| #3 | 1 | 0 | 25 | mock app |
| #4 | 52 | 0 | 300+ | mock checkpoint |
| #5 | 56 | 0 | 300+ | mock continuation |
| #6 | 1 | 0 | 3 | README / TODO |
| #7 | 59 | 0 | 300+ | browser verification |
| #8 | 29 | 0 | 300+ | Stage 3 specs-as-data / Stage 4 kernel |

The GitHub compare response is capped at 300 files on large comparisons; these are not full file inventories.

## Verified ancestry

- #1→#2: ahead 4, behind 0.
- #2→#4: ahead 14, behind 0.
- #4→#5: ahead 4, behind 0.
- #5→#7: ahead 3, behind 0.
- #3→#7: ahead 58, behind 0.
- #7→#8: diverged, ahead 29, behind 59.
- #2→#8: diverged, ahead 29, behind 38.

## Gated consolidation plan

1. Inspect actual PR bases, latest ownership and CI; establish the scope and acceptance criteria for LocalBazaar and LocalMutiny. Preserve explicit specification NO-GO decisions.
2. Use #7 as the cumulative mock-framework candidate; verify it retains #1–#5 and #3 changes, rather than merging those branches separately.
3. Reconcile #6 README/TODO updates with the actual implementation status.
4. Inspect #8 independently for Stage 3 specification-as-data and Stage 4 kernel modules. Compare its changed files directly against #7; extract unique compatible work in small, testable slices without replacing the mock framework or implying the kernel is production-ready.
5. Preserve local-first, server-rendered/no-JS journeys where specified and verify mock/demo vs implemented backend distinctions. Avoid introducing blockchain or monetization assumptions.
6. Run available app checks, browser tests (Chromium/Firefox/WebKit), accessibility and contract tests, and kernel-specific tests; report environmental limitations.
7. Prepare focused integration PRs with source commits, conflicts resolved, test evidence and remaining blockers. Merge only when required CI and review gates permit.

This audit does not claim that feature branches were merged or tests passed.
