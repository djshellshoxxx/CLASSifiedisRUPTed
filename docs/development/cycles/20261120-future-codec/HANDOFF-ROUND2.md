# ClassRup continuation — future-codec mixed-record positive control

## Source ownership and bounded change

This round modifies only the isolated draft PR #64 branch, based on the **observed** predecessor head \`eeac22a154429658bc7e5d6e34337ca7ac314a96\` (tree \`c5019e82b004dc03f0797c31916665aa37d99999\`), stacked on unchanged draft PR #63 head \`0f3288c8589ae8d3316c2a4cb21b4ceb306fd320\`. It preserves the predecessor test, adds a realistic supported archive record to the signed mixed v1 export, and checks positive newer-registry restore/reopen before trying the same backup against the older PWA registry. No production code, signature/key format, encryption parameters, test timeout, CI selection, product limit, deployment or release file changes.

The implementation uses \`archiveBackupCodec\` and \`archiveRecordRepo\` from the existing production path. The positive control verifies the signing identity, canonical archive row and rebuilt four-slot index, future record and owner index, and reopen. The negative check expects the existing pre-identity manifest rejection and an uninitialized receiving vault before and after IndexedDB reopen. It does not inspect inaccessible encrypted domain rows directly, demonstrate a real engine/browser test, or claim a historical backup corpus.

## Inspections and qualification boundaries

Observed main is \`137d88e36cc6b1611b062daa33cf84c3d29c86b3\`; PR #63 is draft at \`0f3288c8589ae8d3316c2a4cb21b4ceb306fd320\`. At inspection, exact-head PR #63 runs Alpha \`44697459332\` and CLI \`44697459426\` were queued with successful plan jobs only. PR #64's original Alpha \`44698790888\` and CLI \`44698790723\` were also queued, not passing. No unchanged queue was restarted.

The local container could not resolve \`github.com\` for a Git checkout; thus no local isolated worktree or executed source test was available for this round. The new test and its imports were checked against the source of the current production archive codec and the vault's scope-admission implementation. This is author-side static inspection, **not** independent review or product-test qualification. The earlier local 811-case full suite and selected newer-source cases still belong to their own separate source snapshots. Original exit-137 runs, cancelled workflows and earlier failed attempts remain incomplete/failure evidence.

## Fresh reviewer assignments (outstanding, not claimed complete)

- **Independent code audit:** inspect the exact published head and parent, archive fixture schema and compound index, capture/validation of existing production codecs, and test-only diff. Check that no compatible manifest behavior was altered.
- **Independent functional bug hunt:** execute this 30-second case with the normal serial runner, confirm positive newer restore/reopen plus older rejection, compare the existing legacy subset-positive test, and run full current-source TypeScript. Preserve any failure and its actual source SHA.
- **Independent defensive security review:** inspect \`packages/vault/src/vault.ts\` scope rejection before identity unlock/storage unlock, check fail-closed behavior for mixed known/unknown types and the non-authority of record-index tuples. Do not resume interrupted reproduction follow-ups.

The requirement to use distinct fresh workers remains unmet until their actual review handoffs exist. No merge of PR #63 or PR #64 is authorized on static inspection or queued CI alone. Do not restart unchanged queues or erase historical failures. On the next round inspect actual remote head and CI first, then qualify and integrate only with independent approval, full required current-source hosted checks, exact merge-tree verification and subsequent main-push checks. Continue bounded backup compatibility and recovery; attachments and delivery-state recovery remain separately scoped.
