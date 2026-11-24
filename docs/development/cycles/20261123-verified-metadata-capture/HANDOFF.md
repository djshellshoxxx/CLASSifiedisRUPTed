# ClassRup — verified blob metadata capture handoff

Cycle: 2026-11-23 UTC. Repo: `djshellshoxxx/CLASSifiedisRUPTed`.

## Ownership and source
Based on the unchanged observed remote PR #135 head `a26339a1c611a04a9db60fa4f3889347e9af323d`, tree `f868339d29f5715d34f9ede03bf9ba85e8773ee7`. New draft child branch `codex/classrup-verified-metadata-capture-20261123-t19`; look up its published head and tree from GitHub before subsequent work. No parent or other worker branch modified. Native Git checkout cannot resolve github.com, so the change was prepared against fetched exact source and published using GitHub Git objects, without using local-only Git history. No isolated native worktree or local application test was available.

## Bounded confirmed source finding
`verifyStoredBlob` captures scalar metadata before an asynchronous digest, but called `validStoredMetadata(blob)` on the original object, rereading getters after capture. If a stored adapter-sourced object returns different values across reads, invalid captured metadata could be validated against later valid metadata and returned with a verified byte digest. The single-read path could similarly reject a valid captured snapshot due to a second access. The batch path repeatedly read size, bytes and metadata across admission and copy.

The repair validates exactly the scalar fields being returned in all three entry points; batch reads capture ref, size, metadata and source byte view once before validation and copying. Two direct verifier regressions exercise alternating getters, demonstrating failure on a first invalid captured class and success on a first valid class. Both regressions are test *source* until exact-child CI executes them. This is defensive consistency of *structural* metadata, not cryptographic metadata authentication.

## Source-specific evidence
Parent #135 Alpha 45126884542 and CLI 45126884643 both completed success at parent SHA only. Parent Alpha domain reported 963 passed, zero failed/pending/skipped/todo, and 78 Chromium/Firefox/WebKit browser journeys passed. The new source was not tested locally because native git DNS failed; preserve this setup failure distinct from application test execution. [Qualification](QUALIFICATION.md) must be updated with child exact-head results.

## Fresh independent successor assignments (unexecuted)
1. **Code audit:** inspect exact child source; compare `validStoredMetadata` against `tx.ts` write grammar, adapter field access and getter/proxy semantics; inspect the existing asynchronous hashing copy boundary; record actual source, commands and findings.
2. **Functional bug hunt:** run isolated targeted verifier/single/batch tests on all memory/SQLite/IndexedDB adapters and a focused TypeScript check serially; test malformed metadata, absent blobs, rollback, normal reopen; record executed assertions separately from setup errors.
3. **Defensive security review:** static-only assessment of tenant isolation, metadata read races, holder-string non-authority, signer's canonical principal-owned parent-record proof, revocation and stale-session liveness. No offensive reproductions or stopped earlier follow-ups.

These are briefs only, **not completed independent reviews**. If review tooling is unavailable, do not merge.

## Next engineering milestone
Design and implement a separately versioned authenticated attachment manifest that binds canonical parent-record ownership to existing signing authority. Preserve legacy v1 signed-record format and signing identities. Next bounded stages: bounded 32-item/20 MiB binary transport, verified bytes, atomic destination re-encryption with failure rollback, encrypted reopen and v1 record-only compatibility. Do not merge draft #8 wholesale. Do not modify existing product caps, tests, unrelated automations, releases, deployments or protected branches.
