# Evidence review — PWA and recovery consolidation

Reviewed 2026-11-20 UTC. **No evidence-integrity blocker remains.** The archived evidence supports the selected local results and source-preservation claims. Product acceptance remains incomplete: no complete local domain suite, native-browser execution or passing current-candidate hosted qualification is established. This review inspected existing bytes and Git objects, executed no tests, compiler, browser or remote operations, and writes only this report.

## Frozen source and preservation

| Identity | Exact value |
| --- | --- |
| Executed/reviewed source | `9cf6c56c9b65a421a95676f89e9fcc3800bca573` |
| Complete execution tree | `f506c9282299b034cef6b540017e49ffeac88362` |
| Local merge | `28b2c624d5b92056ddc066636501d3cae9544ec9` |
| First merge parent, PR #71 | `b89e7047ea352a3d47703b134c6c12a7ea589a04` |
| Second merge parent, PR #70 | `eb9577bf9403741c53c2a53f6d5a67fd4e0825a9` |

Local Git agrees with the [source receipt](evidence/g19-source.json), including ordered parents and ancestry of PR #69 plus all five #64–#68 heads. PR #70's two runtime files, formatter test and historical handoff retain their exact recorded blobs. PR #71's rejection test retains blob `ebc626830218ec8a05f2ed1669530be4134bb441`.

The only executable addition after merging is three browser assertions. All **661 original lines remain unchanged and ordered**, producing 664 lines; browser-source SHA-256 is `9216b7de9fc17979de7244a1a2cbe60a4a5503f6d063eb1e12ec2b56759f10e3`. The non-documentation comparison with PR #69 contains precisely the two PWA files, two integration tests and browser test. No additional format, schema, cap, timeout, dependency, workflow or configuration change exists. Working-tree differences after the frozen source are documentation only. The tracker is byte-identical to PR #69 with **51 OPEN rows**.

## Archive and recorded checks

Every member in the [final manifest](evidence/archive-receipt.json) was compared against its raw `classrup-validation` original: both lengths, both SHA-256 values, and exact decompressed bytes. The directory contains exactly the declared members. Final manifest SHA-256 is `6d2a2b17f0eaa979ef551125414ed7ab6e14a712f25f76c8536318d141340ab8`.

| Integrity measure | Verified value |
| --- | ---: |
| Members, excluding manifest | 34 |
| Original bytes | 86,506 |
| Stored member bytes, excluding manifest | 70,838 |
| Receipt/log bindings | 10 |
| Missing, extra or mismatched members | 0 |

The install receipt and nine final receipts all identify the frozen source/tree, bind exact log lengths/hashes, and agree with their summaries. Every command exited zero without reaching its 900-second watchdog. The archived runner and archiver were inspected, not executed.

| Recorded check | Verified outcome | Command duration |
| --- | --- | ---: |
| Focused integration | 30 passed / six unique files; zero other statuses | 47.140 s |
| Full TypeScript | Exit 0 | 15.325 s |
| Spec / dependencies / strict registry | All exit 0 | 1.584 / 0.171 / 0.971 s |
| Tooling | 27 passed; zero failed/cancelled/skipped/todo | 5.833 s |
| CLI | 46 passed; zero failed/cancelled/skipped/todo | 25.702 s |
| Noninteractive setup / production build | Both exit 0 | 0.065 / 0.315 s |
| Offline frozen install | Exit 0 | 1.178 s |

The [focused report](evidence/g19-final/focused.json.gz) independently recounts 17 attachment-reference, five formatter, five vault-session and three single recovery cases. Future-codec duration is **13,392.126265 ms**, with its unchanged **30,000 ms** limit. TypeScript includes browser sources; the three added assertions were compiled, never executed locally. These results cannot qualify the real browser journey.

The [recorded toolchain](evidence/g19-toolchain.json) is Node v24.22.3, pnpm 10.28.0, TypeScript 7.0.2, Vitest 5.1.0, Playwright 1.64.1 and fake-indexeddb 6.2.6. Installed package metadata and the pnpm pin agree. Lockfile SHA-256 remains `d72caa3b730141025fcbb083eedea8d5c1bf6774c5f2b7ed3e8e145f10308773`.

## Historical evidence and bounded correction

The parent's eight domain reports independently recount **95 unique files, 839 assertions: 832 passed, three failed, four pending**. The [parent qualification](../20261120-recovery-consolidation/QUALIFICATION.md) remains separate; selected current passes do not replace its totals or explain earlier timing.

The [17:16:27.784 UTC observation](evidence/g19-parent-hosted-observation.json) records PR #69 runs `44775792417`/`44775792011` and PR #71 runs `44781546153`/`44781546212` queued overall, with null conclusions. PR #69 CLI planning succeeded; its two clean-install jobs and the other planning jobs remained queued. This is dated evidence, not current acceptance.

The [postpublication snapshot](evidence/publication-g16-post-preservation.json) correctly normalizes full and short branch keys. Comparison with the raw preflight independently confirms 77 branches, all prior 76 unchanged, and only PR #71's branch added. The initial mismatched-key comparison supplied no valid verdict.

One unsupported synthetic-tree attribution was resolved during review. A new [17:22:42.104 UTC observation](evidence/g19-parent-synthetic-merge.json) explicitly binds synthetic merge `b95478e088c414640f6253be1b7ccfc8ddde4da4` to tree `1167b49fec0bcc95eac247111f684e786b628536`, with main then PR #71 as parents. The revised 34-member archive supersedes the initial 33-member manifest. Local published/documentation tree equality independently agrees. No test receipt or executable source changed.

## Final documents and acceptance limits

The [handoff](HANDOFF.md), [current pointer](../../CONSOLIDATION_HANDOFF.md) and three source reviews accurately distinguish preservation, static review, selected execution and remaining gates. Each review preserves its archived original verbatim before its combined-source appendix. All 39 local links across six documents resolve; whitespace and single-final-newline checks pass. Final audited hashes follow.

| Document | SHA-256 |
| --- | --- |
| HANDOFF.md | `fd7b8638eab5a3f38207d81f091a6caafac0fa77deeca7e1626a96c3f0477445` |
| CONSOLIDATION_HANDOFF.md | `05295f87708ae6bd9d3502505d3726259c24c7afd486f4a2628ca300b9331ac3` |
| STANDARDS-REVIEW.md | `4dff48869ece1ca02b30acfb5557b0486f0b6c45368fe47b1b255a88529bf075` |
| SPEC-REVIEW.md | `b6745cfa85353f12f48f899ed61da2b14687b505ab4f71281d89543e6815b6f6` |
| DEFENSIVE-REVIEW.md | `04554fe34f326ab7fe024c3858c2d166b2ef25a5c6dd551a2a3f5ea8b565930d` |

Publication still requires the complete reviewed tree, preserved ordered histories and actual candidate hosted qualification. Fake-IndexedDB rejection evidence supplies no native crash, interruption, quota or multi-tab acceptance.
