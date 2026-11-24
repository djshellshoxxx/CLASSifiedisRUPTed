# ClassRup — content-addressed blob MIME contract / handoff

Checkpoint: 2026-11-21 UTC. Bounded **draft-only** continuation of PR #102, with no integration or independent review approval implied.

## Source identity and ownership

- Repo: `djshellshoxxx/CLASSifiedisRUPTed`.
- Parent: draft PR #102, branch `codex/classrup-blob-encryption-dedupe-20261121`, frozen **actual remote head** `118648001f7b111e3cf0429bde15a1ee5fada39c`. The November 19 local-only/published hash map must not be mistaken for new ancestry.
- Isolated child: `codex/classrup-blob-contenttype-dedupe-20261121`. No parent, main, or other worker branch was modified.
- Initial shared-contract test commit: `940896442b2feb335e7242785274b1d6c7d61270`; production fix: `9ca4112a2a051875dc629a6c95061dc8823d501f`; further plaintext regression: `2d1fa86fc5ab9ab0088c5c54bbc7404a8a946647`. Fetch and record live head after this documentation commit.
- GitHub comparison after first two commits: 2 ahead / 0 behind, changing only `packages/kernel/src/storage/contract-suite.ts` and `packages/kernel/src/storage/tx.ts`. Recompare the finished head before integration.
- Existing v1 signed bytes, identity material, encryption primitives, product and test limits, runner selection and production codec registry are untouched. Parent PR #102 remains draft and separately owned.

## Bounded source-confirmed finding and change

The content-addressed blob reference hashes bytes, **not MIME metadata**. At the observed parent source, duplicate same-tenant `tx.blobs.put` requests with identical bytes and encryption flag but conflicting `contentType` returned success using the original stored MIME. It also applied a requested privacy lowering before returning the original type. This could silently disregard the requesting caller's declared interpretation (for example, an existing `image/png` blob reused as `text/html`). This is a source-level correctness/metadata-integrity finding, **not a demonstrated remote vulnerability or application exploit**.

The shared `blobStore.put` path now returns `CONFLICT_STATE` with `reason: blob_content_type_mismatch` if an existing same-tenant content-addressed blob has a different content type, before changing privacy or other metadata. Replacing a type requires an explicit, separately authorized remove/reinsert; same-type dedupe and privacy lowering continue. Other tenants may retain the same byte ref with different MIME and encryption classifications. A caller relying on MIME aliases should undergo compatibility review rather than silently changing the stored type.

New shared storage-contract coverage, wired into the existing memory, SQLite and fake IndexedDB suites, exercises both conflicting MIME directions, unchanged metadata and bytes, tenant isolation, normal same-type dedupe and privacy lowering, and a public plaintext case. The contract test was authored before the production correction but was **not run RED**. No repository TypeScript, Vitest, browser or full domain runner was executed locally; the host still lacks GitHub DNS resolution for an isolated checkout. Do not label the source review a product test.

## Qualification and preserved historical evidence

- Parent #102 exact-head hosted Alpha [44954171316](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44954171316) and CLI [44954171320](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44954171320) both completed successfully. Alpha plan/domain jobs, CLI plan and Ubuntu Node 22/24 clean installs all completed/success. These qualify **only parent #102**, not this child.
- Check child's own **published** exact-head Alpha/domain/browser and CLI after PR creation; inspect detailed steps, actual tests, skips and original failures. Parent success is not transferable, and queued jobs are not passing gates.
- Preserve original 2026-11-19 full local domain exit 137 with no report, historical PR #56 main-push Alpha cancellation, and PR #57's separately qualified main-push successes. Avoid restarting unchanged queued or killed runs without a concrete remedy.
- No independent code, functional or defensive-security review worker was launched or completed in this invocation. Current connector access supports source reads/writes and hosted status, but not a separate agent workforce or a local remote-ref worktree.

## Fresh worker assignments — pending, not approvals

1. **Independent code auditor:** freeze the actual latest branch and parent SHAs in separate worktrees when connectivity works; inspect all blob `put` callers for legitimate MIME aliases and the compatibility implications of conflict admission. Review MIME/tenant/privacy boundaries, content-addressed key assumptions and reference lifecycle. Run full typecheck and affected contract tests serially, record precise commands, source SHA, failures and skips.
2. **Functional bug hunter:** run the new shared test against the pre-fix test-only commit to demonstrate RED, then the finished child to demonstrate GREEN on memory, SQLite and fake IndexedDB. Exercise encrypted P2, public P0, same-byte/different-MIME across tenants, same-type privacy publication, rollback and reopen. Add only confirmed regression repairs with evidence, not speculative feature extensions.
3. **Source-focused defensive security reviewer:** examine how MIME metadata is trusted at display/export boundaries, content sniffing and role authorization; inspect whether a caller can serve HTML from supposedly image-only bytes. Keep work strictly defensive code review/hardening, not interrupted offensive reproduction follow-ups. Report what was observed versus not executed.

Each worker should leave source SHA/tree, exact test receipts, code findings, incomplete gates, ownership conflicts and concrete instructions for the next fresh workers. Do not infer independent approval from this author handoff. Merge only after **this final head** has required hosted qualification plus truly independent reviews, and integrate the existing draft stack in verified dependency order. Verify actual resulting main tree and main-push runs separately.

## Remaining P1 scope

Merged main already contains 15-codec encrypted restore/reopen acceptance; do not count it again. The owner's remaining-work register still separates attachment/reference recovery, delivery and lease state, rotation, device-interruption acceptance, canonical authority and native WebKit existing-key import. This MIME metadata correction is an adjacent storage integrity fix, **not** completion of backup recovery. Continue the highest-priority unblocked bounded recovery feature after reviewing current ownership and gates.

No merge, release, deployment, force push, branch deletion, paid API or unrelated automation change is authorized. No exhausted owner credit budget was observed.
