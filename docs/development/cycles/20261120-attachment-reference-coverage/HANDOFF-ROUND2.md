# ClassRup attachment reference coverage — CI typecheck repair and continuation

Date: 2026-11-20. Base: draft PR #68 branch `codex/classrup-attachment-reference-coverage-20261120`, observed before repair at `c3967e37543b361d679ff7193288f47b7e510aec`, tree `29abb4a743066c16ee71af7fd2433fd3cfbdcf74`. Main at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; no unrelated PR branch is touched.

## Exact previous-source qualification and confirmed defect

The first current-head Alpha run [44749698450](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44749698450) completed **failure**, not pending. Its domain job `136335745989` installed dependencies successfully but TypeScript failed:
- `tests/integration/barter-want-intent.test.ts(35,9)`, TS2741: `UnlockedVault` fixture omitted required `attachmentCoverage`;
- `tests/integration/production-barter-recovery.test.ts(448,11)`, same TS2741.
Spec, dependency, domain tests, build, browser journeys and all downstream Alpha steps were **skipped**, not passed. Preserve original logs. The separate CLI [44749698540](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44749698540) passed its two selected Ubuntu Node 22/24 jobs on the original source, but cannot substitute for the Alpha failure or qualify new source.

## Bounded remedy

Add inert `attachmentCoverage()` throwing stubs to the **two test-only** `UnlockedVault` fixtures. Their surrounding feature tests never call this diagnostic and remain isolated. No production driver, vault implementation, AES-GCM/Ed25519 identity, v1 wire format, signature, reference limit, workflow, timeout or API behavior changes from the preceding PR #68 checkpoint. This is a source-targeted type compatibility repair, **not an executed test pass**.

The preceding PR #68 handoff in `HANDOFF.md` remains authoritative for API assumptions, excluded stores and implementation limitations. The new source must receive its own hosted Alpha/domain/browser and CLI qualification. Do not rerun old failed workflows to imply a new pass. The local host cannot resolve `github.com` for git checkout; this repair is published through GitHub Git objects, not through a local worktree.

## Next three distinct fresh independent review lanes

1. **Code audit:** freeze current remote head/tree; review `BlobReferenceCounts` and `referenceCoverage` on driver, memory, SQLite and Tx ports, encrypted IndexedDB snapshot semantics, and the now-complete `UnlockedVault` fixtures. Check that finite per-tenant result count is not mistaken for a bounded whole-database memory scan.
2. **Functional bug hunt:** run the exact changed-source `corepack pnpm typecheck`, then `tests/integration/attachment-reference-coverage.test.ts` across memory/IndexedDB/SQLite; examine missing refs, repeated attaches, zero holders, overflow and post-lock queries serially. Record setup errors separately from executed product assertions.
3. **Defensive security review:** source-check tenant/ref joining, absence of emitted identifiers/bytes, holder-string non-authentication, overflow ambiguity, privacy labels and limits. Do not restart interrupted security reproduction follow-ups. Confirm that no consumer treats these counts as an authenticated attachment-backup certificate.

Reviewers must independently finish, record exact commit and tree, commands/runner IDs/results and remaining issues. Current PR #68 is **draft and unmerged**; absent these independent reviews and successful current-source required gates, do not merge. Do not modify PRs #64–#67, incompatible #8, unrelated automations or historical failure evidence. No release, deployment, force push, deletion or paid external API.
