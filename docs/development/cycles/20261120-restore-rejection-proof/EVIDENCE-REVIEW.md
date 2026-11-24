# Evidence review — restore rejection proof

Reviewed 2026-11-20 UTC. **Disposition: no evidence-integrity blocker found.** The preserved evidence supports the selected checks and the strengthened rejection-state assertion. It does not establish a passing complete domain suite or current hosted qualification for the eventual publication. This review inspected existing bytes, Git objects, reports and receipts; it ran no tests, compilers, browser sessions or remote operations and changes only this report.

## Source identity and scope

| Identity | Exact value |
| --- | --- |
| Executed and reviewed source | `53aa9fe93c8599c41c0b9b2df4f438b969f14ce9` |
| Execution tree | `81a97a7be19975fe653bce41bda5d7e0991efcbb` |
| Published PR #69 parent | `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2` |
| Changed test blob | `ebc626830218ec8a05f2ed1669530be4134bb441` |
| Changed test SHA-256 | `6c4c91b17b0850349c2c05b10c87f74e2ea949ef05ec6cbd349486b86cc4504c` |

The [source record](evidence/g16-source.json) agrees with local Git. The sole executable change against the published parent is [the future-codec integration test](../../../../tests/integration/production-future-codec-rejection.test.ts). All 25 original lines beginning actual `expect(` calls remain; four additions make 29. The existing 30,000 ms case limit remains. Runtime, format, cap, dependency, workflow and configuration files are unchanged. Working-tree additions beyond the execution source are documentation only, and all 51 historical tracker findings remain OPEN.

## Archive integrity and recorded execution

I independently checked every entry in the [archive manifest](evidence/archive-receipt.json) against its raw original in `classrup-validation`: original and stored sizes, both SHA-256 values, and byte-for-byte gzip decompression where applicable. The directory contains exactly the declared members. Manifest SHA-256 is `66497eaf72bc290cd0e2882045e8cab6e7f9c0d1b48a6937873cda571e27c631`.

| Integrity measure | Verified result |
| --- | ---: |
| Archive members, excluding manifest | 28 |
| Original bytes | 142,855 |
| Stored member bytes, excluding manifest | 137,463 |
| Process receipts bound to exact log bytes | 10 |
| Missing members, extra members or integrity mismatches | 0 |

Nine final-source receipts identify the exact execution source/tree above; their fields agree with the [aggregate summary](evidence/g16-final/summary.json). The install receipt instead identifies parent `6d4f6ea7…` and explicitly records possible concurrent test-only editing. It is setup evidence, not a product-test run. All ten commands exited zero without watchdog expiry. The archived runner was inspected, not executed.

| Saved check | Verified outcome | Command duration |
| --- | --- | ---: |
| Future-codec target | 1 passed / 1 file; no other statuses | 14.547 s |
| Full TypeScript | Exit 0 | 15.258 s |
| Spec / dependency boundaries / strict registry | All exit 0 | 1.615 / 0.167 / 1.032 s |
| Tooling | 27 passed; zero failed, cancelled, skipped or todo | 4.964 s |
| CLI | 46 passed; zero failed, cancelled, skipped or todo | 25.585 s |
| Noninteractive setup / production build | Both exit 0 | 0.115 / 0.468 s |
| Offline frozen-lockfile install | Exit 0 | 7.348 s |

The target report records case duration **13,258.777438 ms**; this differs appropriately from outer command duration. The install watchdog was 300 seconds, and final command watchdogs were 900 seconds; none fired. The [toolchain record](evidence/g16-toolchain.json) identifies Node v24.22.3, pnpm 10.28.0, TypeScript 7.0.2 and Vitest 5.1.0. Installed TypeScript/Vitest metadata, the pnpm pin and the checked-in lockfile agree. Lockfile SHA-256 remains `d72caa3b730141025fcbb083eedea8d5c1bf6774c5f2b7ed3e8e145f10308773`. No complete domain suite was rerun for this source.

## Historical separation and publication limits

I recounted the parent's eight archived domain reports: **95 unique files, 839 assertions = 832 passed + 3 failed + 4 pending**. Those results belong to earlier execution source `d55bb48117c0f9e4579b01fd6c12030585601d68`, tree `7c2a8e3c341498f54e57489a31b2711c9034d3e5`, and remain separate in the [parent qualification](../20261120-recovery-consolidation/QUALIFICATION.md). The new single-case pass neither replaces nor augments those totals.

The [saved hosted observation](evidence/g16-parent-hosted-observation.json), dated **16:56:53 UTC**, records PR #69 draft/open at `6d4f6ea7…`, with Alpha run `44775792417` and CLI run `44775792011` queued and conclusions null. It is not a passing result or a fresh status query. The [saved preservation record](evidence/publication-g12-post-preservation.json) records 75 branches, all prior 74 refs and original 57 non-main refs unchanged; local ancestry agrees with its recorded parent identities. This review makes no live-ref claim.

The handoff correctly distinguishes retaining PR #69 as commit parent from targeting `main`. Publication must preserve the reviewed executable tree and obtain actual qualification of the resulting complete proposed tree. Neither parent queue observations nor selected local checks provide that result. The test establishes settled persisted-state behavior in fake IndexedDB; native crashes, interruption, quota, concurrent tabs and transient uncommitted work remain outside its proof.

## Final document audit

The [handoff](HANDOFF.md) and [current consolidation pointer](../../CONSOLIDATION_HANDOFF.md) preserve these identities, results and limits. The wording now scopes fork-worker settings to the targeted Vitest command. All 62 local links across those documents, the three sibling reviews and this report resolve; all six files have exactly one final newline and no trailing whitespace. Final audited document hashes follow.

| Document | SHA-256 |
| --- | --- |
| HANDOFF.md | `de541c3ed3dab0d00bf366e0175d09987d464eae13e8f2c244f3969434819b20` |
| CONSOLIDATION_HANDOFF.md | `b6549044dc2e9e02cafcb7fd9dcca60a3241b9cc687349c0253dae427e0938df` |
| CODE-REVIEW.md | `595144fd57d807c4254f38e97f1d6a0ee0fb8f8b8d0b4bc1e35d64d56f1ae84e` |
| FUNCTIONAL-REVIEW.md | `a2b1b4145d3cfd55dd6ebc1d201bd836508a90763d1265589ba3bff078f7a565` |
| DEFENSIVE-REVIEW.md | `63f86d9af16bd26c1d8183ef6f5786347f229c420aad03e721c6a60f822918a1` |
