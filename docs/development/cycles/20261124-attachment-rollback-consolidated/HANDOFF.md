# ClassRup — consolidated attachment rollback acceptance and bounded export copy

## Source, ownership and qualification (2026-11-24 UTC)
Fresh census: 94 open PRs; #155 newest. #57 is merged; the mixed production-codec-set recovery was completed through #63. Direct parent #155 is frozen at 76b2ed3aff706cc457996379369911d130f7d8e1 on codex/classrup-retirement-absence-boundary-20261123. Complementary siblings #153 (07e3aa28e6bf66b2760950038f6746fa85079d7e) and #154 (d9e99ca3d91ebe22033b1162a1374ae942d4c149) both descend from #152 (1136069ba8c8cf8f4eb708c53afb518c679befb0). No requested reviewers or submitted reviews on #153–155; #155 discussion was empty at inspection. No other active worker ownership is inferred. Original and relevant later handoffs and register inspected; exhaustive historical reread not completed.

| Frozen candidate | Alpha | CLI |
|---|---|---|
| #153 | 45290606077 success | 45290612168 success |
| #154 | 45290654098 success | 45290654083 success |
| #155 | 45292304369 success | 45292304562 success |

Inspected all six runs' jobs: Alpha plan and domain jobs completed success, including typecheck, actual domain runner, build and browser journeys; CLI plan and Ubuntu Node 22 and Node 24 clean installs completed success, including actual development/production browser smoke. No test counts inferred from successful steps. These are separate exact-parent and donor qualifications, not qualification of the combined candidate. #150 Alpha 45264062462 remains historically cancelled; its CLI succeeded. Preserve original #56 main-push Alpha cancellation/CLI success and #57 local exit 137 with no final report. #57's subsequent main-push Alpha and CLI succeeded per remaining-work register. No unchanged reruns.

## Selective consolidation and implementation
Compare from #152 established that #153 adds only its raw-adapter regression and handoff, while #155 contains #154's authenticated encrypted-vault abort/reopen and #155's authority-boundary acceptance. Recovered the two #153 files without alteration on a new isolated branch:
- tests/integration/indexeddb-native-attachment-abort.test.ts, donor and destination blob 2426b6549c9534226ec2b05ba3324c56f6555877, commit b0eab826d5eb63fb831692e2f4c67b3e1da86241.
- docs/development/cycles/20261123-idb-native-abort/HANDOFF.md, donor and destination blob a8e8a42088e029036d230e4bf4fd4644ac7c0220, commit 4c90ee61835763d651047868b66c53daa822c719.

This is selective exact-content recovery, not a merge of unreviewed histories; donor PR and branch stay intact. The adapter test exercises actual fake-IDB abort; the encrypted importer test reopens before retry. Do not claim power-loss or native browser hardware durability.

Source audit: #149 introduced a shared intrinsic-length, bounded fixed-allocation copy helper for import and #150 applied it to deduplication. Manifest export still used ordinary byteLength and new Uint8Array(sourceBytes). Commit 68db2e776778889f6afab45f0fc007e433a56d10 applies the same helper to the export snapshot after aggregate and metadata admission, preserving the existing error, cleanup and verification logic. The existing helper regressions cover ordinary detached views and size checks; existing manifest-export and cleanup regressions cover the surrounding path. This is source hardening, not a demonstrated exploit. No new limits, signatures, v1 formats, encryption or identity changes. No destructive retirement or new deletion authority enabled.

## Execution limitations and next work
Actual native git ls-remote in this invocation exited 128 with Could not resolve host: github.com. No local checkout/worktree, typecheck, or product execution; connected GitHub isolated branch used instead. No independent worker runtime available. New combined candidate requires its own actual CI and independent review. No credit exhaustion reported.

Fresh successor assignments (pending, not approvals):
- Code audit: check both donor blobs and exact combined diff, copy-helper error/cleanup path, aggregate constraints and manifest compatibility; verify source identity and ancestry.
- Normal functional bug hunt: run existing helper/manifest export and cleanup cases, raw fake-IDB abort, encrypted importer abort, and absence-boundary tests serially. Record exact source, counts, commands and any failures. Do not substitute static review or setup results for product execution.
- Defensive review: assess canonical owner checks, no deletion authority from absence, retained unknown holders, transaction rollback and bounded snapshot copying. No interrupted reproduction follow-ups. Record concrete findings and next instructions.

Prioritize actual independent review and qualified consolidation of the accumulated stack. Next bounded feature after review is an authenticated deletion/zero-ref transition contract, with canonical revision and previous/current state binding, replay safety and durable evidence. Do not infer deletion authority or implement final purge without a retention/evidence/hold policy. Private destination-key handling remains separate. No merge of #8, release, deployment, force push, branch deletion or paid API; unrelated and older paused tasks unchanged.
