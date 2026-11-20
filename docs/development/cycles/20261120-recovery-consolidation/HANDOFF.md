# Recovery consolidation handoff

Date: 2026-11-20. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
Branch: `codex/classrup-recovery-consolidation-20261120`.
Evidence reviewed through **2026-11-20 16:32:33 UTC**. Publication and candidate hosted gates remain pending.

## Current outcome

The consolidation preserves the five independent PR #64–#68 histories, selects the incoming tenant-index implementation without rewriting its production bytes, corrects the last-holder test expectation, and adds ordinary attachment and cross-version recovery acceptance. The frozen source passes full TypeScript and all **20 cases in the four focused integration files**, plus specification, dependency and strict-registry checks. The separate auxiliary checks passed **27 tooling tests**, **46 CLI tests**, non-interactive setup and build.

**Complete qualification remains open.** All eight domain shards have reported all 95 expected files: **839 assertion entries, 832 passed, 3 failed and 4 pending**. The failures are the existing Mutiny withdrawal-budget case at 60,000 ms, the existing vault composition case at 30,000 ms, and the strengthened future-codec integration case at 30,000 ms. One separate isolated selection of the Mutiny case also timed out. Shard 7 warns that tests were still running when its JSON report was generated; its four pending per-case entries remain unresolved despite an aggregate counter that says one. No cause is attributed to these results.

The original full recount records one collision when identifying cases by `(file, fullName)`. Its assertion stopped `finish_g12.py` before tooling, CLI, setup or build ran. Source inspection confirms two distinct parameterized assertions in unchanged `feature.test.ts` share a title; both belong in the count. The [verified recount](evidence/g12-remaining-round1/domain-recount-verified.json) retains both entries and preserves the [original recount](evidence/g12-remaining-round1/domain-recount.json). The isolated vault diagnostic subsequently passed **all six cases in 26.120 seconds** at unchanged limits. That overlaps the original failed/pending cases and the backoff case that already passed; it does not rewrite the full run. A corrected auxiliary-only continuation completed the remaining non-domain checks. Current-candidate hosted Alpha/CLI gates remain pending. Earlier main success and separate focused/isolated passes do not erase the nonpassing full run. See [QUALIFICATION.md](QUALIFICATION.md) for exact outcomes and remaining gates.

This handoff is prepared for coordinator finalization. No new consolidation PR number, published documentation head, hosted pass or merge is asserted in this draft. The coordinator owns publication and the final integration record.

## Exact source and preserved contributions

| Identity | Exact value |
|---|---|
| Frozen reviewed and locally tested source | `d55bb48117c0f9e4579b01fd6c12030585601d68` |
| Frozen complete tree | `7c2a8e3c341498f54e57489a31b2711c9034d3e5` |
| Qualified main baseline | `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e` |
| Main baseline tree | `8fe1965ae60c385042f09c690eabe7d0828b36e8` |
| Initial combined source | `29daa061b4ad8b2899f6a8eaa910d12c80c93671` |
| Initial combined tree | `014ab768f786b9170ed4885cb849b85b46117bb1` |
| Final merge's consolidation parent | `bd6f59cb49a72583dcba3ca7925a6be3e82bc584` |
| Final merge's incoming PR #68 parent | `7a3a962400e44a3d7bb2a6834c869f97bae88ee4` |
| Selected production memory-driver blob | `56d93ed22056f8cd215882df97a3732ea1b5b213` |

The [merge receipt](MERGE-PRESERVATION.json) verifies ancestry and content for all five current contribution heads. **20 of 22 contributed paths retain their exact source blobs.** The two extended paths are the attachment integration test and the future-codec integration test. All original handoffs are preserved, including PR #68's later round-four handoff. The initial merge had preserved all 21 paths then contributed; the later incoming head added the extra handoff and its reviewed repairs.

| Contribution | Preserved head | Intent retained |
|---|---|---|
| PR #64 | `f598dc52937449764703b5048ba71a77239c9ded` | Valid encrypted mixed-codec backup, compatible-receiver positive control, older-registry rejection, now extended with retry into the same rejected destination. |
| PR #65 | `5a742b5c4f1068f8bbd51d84de6a3de054df57e7` | Block lossy older-registry export while preserving newer owner records and signing identity. |
| PR #66 | `5bae3058bffec53c0fe04700c84232b8d7a5a84a` | Exclude a foreign future type from owner coverage and recovery while retaining it in the original encrypted database. |
| PR #67 | `d1dcd44e839c7c28a33b94553f5cb3270ffc6d6c` | Staged attachment/reference recovery scope and its separate portable-format dependencies. |
| PR #68 | `7a3a962400e44a3d7bb2a6834c869f97bae88ee4` | Read-only diagnostic, required fixture interfaces, tenant-index repair, corrected detach expectation and plain IndexedDB reopen acceptance. |

The [branch preservation receipt](SOURCE-PRESERVATION.json), observed at 2026-11-20 15:58:45 UTC, lists 74 remote branches and records no missing or moved head among the 57 original non-main references. The fresh [preservation review](PRESERVATION-REVIEW-FINAL.md) and [final branch receipt](SOURCE-PRESERVATION-FINAL.json), observed at **16:31:04 UTC**, reconfirm **74 branches, all 57 original non-main heads unchanged, and main plus all five expected PR #64–#68 heads**. Both snapshots already record PR #68 at `7a3a9624`; its older `259f8420` CI history is a separate observation. These are dated pre-publication observations, not a claim that remote state cannot subsequently advance. Preserve all source branches, the parent histories, original evidence and unrelated draft PR #8. This work changes no automation settings.

## What changed and why

The [implementation record](IMPLEMENTATION.md) explains the complete delta and the concurrent contribution selection. The new `UnlockedVault.attachmentCoverage()` method reports distinct held refs, distinct missing refs, present held refs excluded from v1, and holder rows. It binds the read to the active signing principal, uses existing transaction and session guards, and returns a frozen count-only object. It accepts no caller-supplied principal and returns no ref, holder, filename, MIME type or blob bytes.

The original memory implementation limited owner counts while traversing the full holder table. The selected incoming repair maintains a tenant-to-holder-key index through the existing write path. Duplicate attachment, replacement, deletion, snapshot loading and reverse-order rollback all use that same path. Coverage checks indexed cardinality before reading rows; overflow returns null counts, and accepted reads visit at most the requested owner limit. SQLite retains its tenant-prefixed limit-plus-one query. The maximum remains **10,000 holder rows**. This bounds the diagnostic traversal, not whole-vault loading, resident storage memory or target-device latency.

Initial review and execution found an incorrect assertion that bytes should survive detaching their final holder. Existing production behavior deletes that blob. The repaired test expects `{ deleted: true, shred: false }` for its plaintext fixture and absent metadata, while separate assertions verify that read-only coverage preserves stored bytes. No production deletion or shredding semantics changed.

The focused acceptance now includes foreign-only bytes at an owner's missing ref, duplicate attachment, error rollback and successful retry, rejected persistence, retained transaction methods, queued lock, plain and encrypted reopen, and record-only v1 restoration. The future-codec scenario captures complete original records, reuses the same previously rejected destination under a compatible registry, and compares records and signing identity both immediately and after encrypted reopen. Its negative phase checks absent initialized identity state; physical domain-row emptiness between rejection and retry is supported by source ordering rather than direct enumeration.

Existing backup format, signatures, key derivation, storage schema, product caps and existing case timeouts remain unchanged. The 20 focused cases are part of the complete domain selection and must not be added to its distinct case total a second time.

## Scope that remains open

The diagnostic always returns **`holderAuthorityVerified: false`** and **`includedInV1Backup: false`**. Arbitrary holder labels are not authenticated parent records. Presence is a same-tenant blob-row check, not verification of media integrity or ownership. Unheld stored blobs are outside this count. Signed v1 backups still exclude `blobs`, `blob_refs` and operational stores. No portable attachment export or restore is implemented by this change.

The preserved [attachment source inventory](ATTACHMENT-SOURCE-INVENTORY.md) found no production media domain or configured attachment extractor among the 15 production codecs. Its source is the initial consolidation; the final delta introduces no owning media schema, production media handler or extractor. The inventory's initial whole-table scan observation is superseded by the tenant-index repair documented above and in the final reviews.

The next substantive media work needs an owning domain with canonical parent and revision authority, production content/privacy admission, retention and key handling, then a separately versioned authenticated portable format, bounded transfer and atomic destination persistence. Existing kernel ports, image helpers and placeholder holder strings do not complete those contracts. Native device interruption/quota acceptance, identity/device recovery, delivery/lease recovery, rotation and whole-database rollback remain separate.

All **51 historical readiness findings remain OPEN**. This bounded consolidation closes none of their original rows, severities, owner roles or release gates. Use the preserved [readiness reconciliation](../20261120-readiness/READINESS-RECONCILIATION.md) and [remaining-work register](../../REMAINING_WORK.md) for subsequent slices.

## Independent reviews and evidence

| Lane | Initial source review | Final frozen-source review |
|---|---|---|
| Code and integration | [CODE-REVIEW-INITIAL.md](CODE-REVIEW-INITIAL.md) | [CODE-REVIEW-FINAL.md](CODE-REVIEW-FINAL.md) |
| Functional correctness | [FUNCTIONAL-REVIEW-INITIAL.md](FUNCTIONAL-REVIEW-INITIAL.md) | [FUNCTIONAL-REVIEW-FINAL.md](FUNCTIONAL-REVIEW-FINAL.md) |
| Defensive source review | [DEFENSIVE-REVIEW-INITIAL.md](DEFENSIVE-REVIEW-INITIAL.md) | [DEFENSIVE-REVIEW-FINAL.md](DEFENSIVE-REVIEW-FINAL.md) |

The initial reviews retain the detach-oracle blocker, traversal limitation and acceptance gaps. All three final reviews identify no new blocking production finding within their declared source scope. They are independent static reviews, not executed test, hosted review-approval or native-device results. Their limitations remain part of the evidence.

[TIMING-OBSERVATION.md](TIMING-OBSERVATION.md) analyzes both Mutiny selections and the later full-shard inventory, vault/future-codec outcomes, isolated vault pass and title collision. The Mutiny case does not populate blob-holder rows or invoke the diagnostic, but changed generic adapter construction and branch overhead remain reachable. The shard-7 report's per-case entries and aggregate pending count disagree, and its log records the incomplete-report warning. The future-codec case passed the focused selection in 15,608.778 ms but failed its retained 30-second limit in shard 8. Neither an environmental explanation nor a causal production regression is established. The observations do not justify relabeling failures, changing limits or treating overlap as additional coverage.

The [runner observations](evidence/g12-runner-observations.json) preserve both validation-harness interruptions. The first stopped after the completed shards on the title-uniqueness assertion. The second completed the isolated vault diagnostic, then accidentally selected the standard final phase while preparing auxiliary checks: an extra TypeScript check passed, and an extra focused command began. The coordinator interrupted that command with exit 130 before any focused JSON report or receipt existed. Its partial files remain preserved, and no completed domain outcome is inferred. The corrected auxiliary-only continuation then passed. No product code, assertion or case limit changed, and no further domain retry is planned.

The [evidence archive receipt](evidence/archive-receipt.json) indexes **81 entries**, preserving **717,746 original bytes** in **247,812 stored bytes**, with source paths, encoding and original/stored SHA-256 digests. Its SHA-256 is `c4cac50b15b294a3dbc386feac2bd08acf223c1a6756e0cff20d125c1a09d595`. It includes initial failures, final focused checks, all failed and incomplete results, both recounts, isolated/auxiliary qualification, source/CI observations and temporary runner source. [QUALIFICATION.md](QUALIFICATION.md) links the archived evidence directly.

## Coordinator continuation

1. Preserve all eight shard reports, the original and verified recounts, the three failures and four pending entries, isolated results, both runner interruptions and the completed auxiliary checks. The same-title parameterized assertions remain separate entries. No additional unchanged domain retry is planned; a later diagnosis must retain the existing evidence and establish its own concrete question.
2. Verify the archive and fresh preservation evidence remain attached to the publication. Keep the original dependency-install failure separate from product results, and retain the interrupted extra focused command without inventing a result. Confirm the runtime/test tree still corresponds to the reviewed and tested source before publishing documentation changes.
3. Publish the dedicated consolidation history and documentation through the coordinator's authorized workflow. Record the actual published head and new PR number, preserve all parents and source branches, and check that the runtime/test source still corresponds to the reviewed frozen source.
4. Obtain and inspect Alpha and CLI results for that exact published candidate/merge source. Record actual job IDs, checkout/source relationship, executed counts and every failed, cancelled or skipped gate. Main's older successful runs and PR #68's predecessor results remain separate evidence.
5. Keep integration open until the required current-source gates are resolved. Record any eventual actual merge and separate main-push qualification; publication alone is not merge or release completion. Choose subsequent feature work against fresh main, current PRs and preserved open findings.

No deployment, release, force push, branch deletion, paid job or change to unrelated automation is part of this handoff.
