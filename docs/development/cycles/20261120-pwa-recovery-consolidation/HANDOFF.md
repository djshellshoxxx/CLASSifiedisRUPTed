# PWA and restore-rejection consolidation — handoff

Date: 2026-11-20. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
Branch: `codex/classrup-pwa-recovery-consolidation-20261120`.

## Current outcome

This candidate combines the PWA attachment-exclusion diagnostic from [PR #70](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/70) with the persisted restore-rejection proof from [PR #71](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/71). Both original histories remain ancestors, including PR #69 and its five #64–#68 source heads. Every contributed implementation/test blob is preserved exactly.

Independent review found that the incoming formatter tests did not require the real PWA action to render its attachment result. Three assertions now extend the existing browser journey: the expected zero-holder counts, explicit v1 attachment exclusion, and unauthenticated-holder/unheld-blob limits must appear. Existing record, private-title, password, lock and reopen assertions remain. This source addition addresses the assertion gap; native execution is still required.

At the frozen combined source, **30 integration cases in six files passed**, with no failed or pending entry. TypeScript, specification, dependency and strict-registry checks passed, as did **27 tooling tests**, **46 CLI tests**, non-interactive setup and production build. No complete domain suite or native browser was run locally for this candidate. Publish a separate draft targeting main, record its actual identity and inspect its own hosted gates before integration. The contributing published branches stay unchanged.

## Exact source and preservation

| Identity | Exact value |
|---|---|
| Reviewed and executed source | `9cf6c56c9b65a421a95676f89e9fcc3800bca573` |
| Executed complete tree | `f506c9282299b034cef6b540017e49ffeac88362` |
| Local merge before three browser assertions | `28b2c624d5b92056ddc066636501d3cae9544ec9` |
| First merge parent: published PR #71 | `b89e7047ea352a3d47703b134c6c12a7ea589a04` |
| Second merge parent: published PR #70 | `eb9577bf9403741c53c2a53f6d5a67fd4e0825a9` |
| Shared PR #69 ancestor | `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2` |

The [source receipt](evidence/g19-source.json) records the exact incoming blobs and merge parents. PR #70's two runtime files, formatter test and original handoff are unchanged. PR #71's future-codec test remains blob `ebc626830218ec8a05f2ed1669530be4134bb441`. The only executable addition after merging is three assertion lines in [alpha.spec.ts](../../../../tests/browser/alpha.spec.ts); all 661 original lines remain unchanged and in order.

The [PR #71 publication record](evidence/publication-g16-state.json) binds its published head to complete tree `1167b49fec0bcc95eac247111f684e786b628536`, identical to local documentation commit `a09585fa67a458e76b303344d5756138a6e7234c`. A separately archived [GitHub synthetic-merge observation](evidence/g19-parent-synthetic-merge.json) binds `b95478e088c414640f6253be1b7ccfc8ddde4da4` to that same tree and to main/PR #71 as its ordered parents. The [postpublication preservation snapshot](evidence/publication-g16-post-preservation.json) observed 77 branches at 17:16:21 UTC, with all 76 prior refs unchanged. Its comparison note retains the corrected short-name versus full-ref normalization error; the initial comparison supplied no valid preservation verdict.

## Behavior and limits

The explicit Check backup coverage action clears its previous text, reads record coverage and attachment coverage within the existing exact-session guard, and renders both using `textContent`. The two reads are successive snapshots. They do not form an atomic inventory or authorize export. The existing vault-action queue and underlying principal-scoped queries remain; lock invalidates the session and clears coverage before awaiting storage close.

The attachment report distinguishes unique held references, missing stored blobs, present but excluded referenced blobs and total holder rows. Overflow produces unavailable counts, never a partial exact count. Zero held references still carries the exclusion and unheld-inventory caveat. Holder labels are not authenticated. Unheld blobs are outside this diagnostic. V1 backups continue to exclude both attachment bytes and references, regardless of the counts. The formatter's singular copy such as “1 missing stored blobs” remains an acknowledged non-blocking polish item; no product semantics were changed for it.

PR #71's retained acceptance observes all persisted object-store keys and values before rejection, immediately afterward and after intentional reopening. Only `meta['writer']` is excluded across reopen; the immediate comparison is exact. A successful compatible retry must visibly populate records. This remains fake-IndexedDB evidence of settled persisted state, with no native crash, quota, interruption or multi-tab claim.

No schema, backup format, cryptography, identity, dependency, workflow, product-cap or timeout changes were introduced by this consolidation. No media-owning domain or portable attachment format is implemented.

## Executed qualification

Every check is bound to source `9cf6c56c` and its tree in the [summary](evidence/g19-final/summary.json). All nine final commands exited zero; none reached its 900-second outer watchdog.

| Check | Actual result | Command duration |
|---|---|---:|
| Focused integration | 30 passed in six files; zero other statuses | 47.140 s |
| Full TypeScript, including browser sources | Passed | 15.325 s |
| Specification | Passed | 1.584 s |
| Dependency boundaries | Passed | 0.171 s |
| Strict registry | Passed | 0.971 s |
| Tooling | 27 passed; zero failed/cancelled/skipped/todo | 5.833 s |
| CLI | 46 passed; zero failed/cancelled/skipped/todo | 25.702 s |
| Non-interactive setup | Passed | 0.065 s |
| Production build | Passed | 0.315 s |

The [focused report](evidence/g19-final/focused.json.gz) contains 17 attachment-reference cases, five coverage-formatter cases, five vault-session cases and one case each for future-codec rejection, downgrade export and foreign-codec isolation. The future-codec case took **13,392.126265 ms**, within its unchanged 30,000 ms limit. These are selected cases, not a new complete-domain total. The three newly added browser assertions are compiled but have not been executed locally.

The [offline frozen installation](evidence/g19-setup/install-receipt.json) passed in 1.178 s at the same source. [Toolchain](evidence/g19-toolchain.json): Node v24.22.3, pnpm 10.28.0, TypeScript 7.0.2, Vitest 5.1.0, Playwright 1.64.1 and fake-indexeddb 6.2.6. The lockfile digest remains `d72caa3b730141025fcbb083eedea8d5c1bf6774c5f2b7ed3e8e145f10308773`. Only the Vitest selection uses one fork worker and serial files. Receipts separately record `GOMAXPROCS=1`, `GOMEMLIMIT=384MiB`, and a 1024 MiB Node heap for the checks.

## Independent review and evidence

The [standards review](STANDARDS-REVIEW.md) and [spec review](SPEC-REVIEW.md) keep their separate axes. Standards found no hard violation or actionable baseline smell. Spec identified the browser assertion gap in the incoming PR and verified the three source assertions address it. The [defensive review](DEFENSIVE-REVIEW.md) found no blocking finding in its bounded source scope. Each report preserves the original PR #70 review followed by an exact combined-source appendix. Source review does not establish execution or release readiness.

The [archive manifest](evidence/archive-receipt.json) indexes **34 members**, **86,506 original bytes** and **70,838 stored bytes**. Its SHA-256 is `6d2a2b17f0eaa979ef551125414ed7ab6e14a712f25f76c8536318d141340ab8`.

The [runner](evidence/run_g19.py) and [archiver](evidence/archive_g19.py) are preserved with the source, toolchain, incoming reports and publication observations. Lossless gzip stores logs and the complete Vitest report. Original and stored byte lengths and SHA-256 values identify each member. Independent evidence review must verify these bindings before the documentation is committed.

## Historical results and remaining gates

The [PR #69 qualification](../20261120-recovery-consolidation/QUALIFICATION.md) remains **839 entries across 95 files: 832 passed, three failed and four pending**. The failures were the existing Mutiny budget case, vault composition case and older future-codec rejection case at their original limits. Its focused and isolated runs remain separate, including the isolated Mutiny failure. This candidate's selected pass does not replace those results or explain their timing.

The [saved hosted observation](evidence/g19-parent-hosted-observation.json) records PR #69 Alpha `44775792417` and CLI `44775792011` queued overall. CLI planning succeeded, while its two Ubuntu clean-install jobs remained queued; Alpha planning was queued. PR #71 Alpha `44781546153` and CLI `44781546212` were queued with queued planning jobs. These are dated observations, not current passes. PR #70 had its own queued runs `44777735270` (Alpha) and `44777735251` (CLI), observed separately before this archive.

Publish the exact reviewed complete tree with ordered remote parents PR #71 then PR #70. Verify tree equality, unchanged executable content after documentation, both parent histories, and all existing remote refs. Record the actual PR number, head, synthetic merge and run IDs. Keep the candidate draft while current-head Alpha/domain/browser and CLI gates or required parent qualification are unresolved. Inspect actual job checkout and logs before ordinary integration; record any later main merge and main-push qualification separately. Do not retry unchanged queued workflows or the blocked local native-browser launch.

The [readiness reconciliation](../20261120-readiness/READINESS-RECONCILIATION.md) still leaves all **51 historical findings OPEN**. No release, deployment, force push, branch deletion, paid job or automation change is included.
