# ClassRup — verified blob metadata snapshot continuation

Date: 2026-11-23 UTC. Owner: djshellshoxxx/CLASSifiedisRUPTed.

## Frozen remote source and ownership
- Parent: draft PR #131, branch `codex/classrup-verified-attachment-read-20261123-t14`, **observed remote head** `f65a119c2ea53d1c3adf28119f74e8978ad6d856`, tree `b2aac5aacc13cbab333e4cd8f36bd18d031176c1`.
- Child isolated branch: `codex/classrup-verified-blob-snapshot-20261123-t15` forked from the remote commit, not from local unpublished Git history. Test commit `5047bc02ed9785d3ea6157e97813d70f76e91c5e`; repair commit `f3edb3daaf86830f1c1ac1ca78b3a405c747a55b`.
- During reconnaissance, #131 was the newest open PR, and its submitted review list was empty. No distinct reviewer or active ownership claim was established. Recheck latest remote PR state, head and worker claims before editing/merging.
- Local checkout/worktrees were **unavailable**: `git ls-remote` failed because the host could not resolve github.com. All changes were applied to a new GitHub ref; do not describe this as local worktree validation.

## Source-confirmed finding and bounded correction
The new `verifyStoredBlob` returned `{ ...blob, bytes }` **after** awaiting WebCrypto's content hash. Though bytes were copied before the await, the caller/driver could mutate `blob.ref`, `size`, `privacy`, `encrypted`, `holders`, `contentType` or `createdAt` during hashing. This could reject a valid original snapshot or return post-validation metadata paired with earlier verified bytes.

The child captures all declared scalar metadata and bytes **before the first await**, validates byte length before copying, compares the content digest to the captured reference, and returns only the declared fields with detached bytes. It does not change the SHA-256 format, 5 MiB blob cap, encryption, parent record authority, signing identity, v1 backup format or test limits.

New `tests/integration/verified-attachment-blob-snapshot.test.ts` describes a mutation between call and hash completion, including changed ref/size/contents/privacy/encryption, and excludes unknown caller properties. The regression was committed before the source correction, but **no baseline RED run or corrected GREEN run executed locally**. Treat these as proposed tests pending hosted CI, not observed passing tests.

## Qualification and historical evidence
- Parent #131 Alpha run [45102455351](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45102455351) and CLI [45102455293](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45102455293) are now observed **completed/success** at the exact parent head. Alpha's plan and domain jobs (including domain, typecheck, static/build, browser) each succeeded; verify CLI job details separately. No parent result qualifies this child.
- The child must pass its own Alpha and CLI at the **actual current published SHA**. Do not infer success from a queued job or unrelated earlier workflows.
- Preserve original #57 local exit 137 without JSON report; initial queued #57 runs; #56 separate main-push cancelled Alpha and successful CLI; #120 Firefox failure, #116/#105 failures, #126 initial compiler failure and corrected-head fixture initialization failure. Each has its own historical scope.
- Independent reviews are **not completed**. The available tool interface did not provide workers to launch; distinct successor tasks remain unexecuted. Source inspection is not a performed security audit.
- No merge or release/deployment is authorized absent the user's qualification and review gates. No paid API, force push, branch deletion or unrelated automations are changed.

## Successive fresh worker briefs
1. **Code audit (fresh):** freeze exact child remote head/tree; review `verified-blob.ts`, the shared blob store/adapter return shapes and declaration compatibility; check hash/order, metadata copy semantics and whether unknown metadata is used elsewhere. Run the focused test and typecheck if a host with dependencies is available; record command, exit, source SHA and any failure. Do not overwrite this handoff.
2. **Functional bug hunt (fresh):** inspect exact-head Alpha/CLI job outcomes. Exercise the new tests with normal memory, SQLite and IndexedDB snapshots; assess close/reopen and byte-mutation results and verify no regression to missing/corrupt ref handling. Preserve successful and failed counts separately.
3. **Defensive security review (fresh):** source-focused review of tenant bounds, access after unlocked-vault session expiry, content-address hashing, metadata trust, caller mutation and future owner-record authority. Do not resume interrupted proof-of-exploit follow-ups; remediation only. Report whether tests actually ran.

## Next P1 milestone and integration
Develop a separately versioned authenticated attachment manifest only after defining parent-record ownership authority, canonical references, aggregate transport bounds and rollback-safe destination re-encryption. Do not substitute arbitrary holder labels for owner authority or change the v1 record-only format. Ancestor draft PR stack remains subject to individual qualification and reviews. When qualified for ordinary merge, verify actual merge tree and main push runs. If blocked, leave a next-worker exact-source record instead of claiming completion.
