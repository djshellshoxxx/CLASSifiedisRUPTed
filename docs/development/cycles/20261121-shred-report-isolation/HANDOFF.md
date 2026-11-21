# ClassRup — detach key-shredding reports from live transaction state

Checkpoint: 2026-11-21. **Draft bounded hardening, not an integration, independent security assessment or deployment.**

## Exact starting point and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`. Current stacked parent: draft PR #96 on `codex/classrup-encrypted-shred-final-type-20261121` at `acbe6b7d9f7411ec361710652bd6612e55a05432`, tree `dd20bcd8e07461c2ffbd113a2a84b2c14e03d73a`. The parent ref was checked identical (0 ahead, 0 behind) before forking.
- Isolated remote child: `codex/classrup-shred-report-isolation-20261121`, originally created directly from the published parent SHA. Test-first commit `fbee522179d6622749812feac350be63299afcd0`, production fix `b83a2d581f61ebcfe27af7e0c4407041d7747745`, code/test tree `7d88b3a9c340aaf8ad4698dbd7e08ef879383249`; this documentation commit advances the published head, so resolve its actual tree afresh.
- Do not rewrite parent, main, incompatible draft #8, paused automation tasks or other workers' refs. Keep this child draft until its own exact-source qualification and genuinely independent reviews pass. No force pushes or releases.

## Source-confirmed issue and correction

`packages/kernel/src/storage/tx.ts` kept pending tenant/ref key-deletion intents in a `Map<string, ShreddedBlob>`, but returned `[...shredded.values()]`. This copies only the array, not the objects. The `readonly` TypeScript interface does not make runtime JS objects immutable. A callback that changes `shredded()[0].tenant` or `.ref` mutates the internal map entry, allowing a **subsequent** report in the same transaction to carry wrong tenant/ref key deletion targets. This is a source-confirmed API isolation defect; no real key-owner misuse, unauthorized access or exploit is demonstrated.

The fix returns `[...shredded.values()].map(({tenant,ref}) => ({tenant,ref}))`, preserving tenant/ref ordering and pending-shred cancellation while returning detached objects. The additional shared `storageContractSuite` regression creates an encrypted orphan, collects it, mutates the exposed report object to a different tenant/ref and requires the subsequent report and successful transaction result to retain the legitimate target. The shared suite is instantiated for memory, SQLite and fake IndexedDB. No signature/encrypted backup v1, encryption algorithm, key identity, ref format, privacy admission, limits, test timeouts or workflow configuration changed.

## Exact qualification boundaries

- Parent PR #96 Alpha [44921509799](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44921509799) **completed success** with logged 846 passing domain assertions (0 failed/pending/skipped/todo), 27 tooling tests and 78 passed browser journeys. CLI [44921509852](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44921509852) **completed success** on both Ubuntu Node 22.18.0 and 24.x; inspected Node 24 log reports 46 tests and 0 skips. These belong to #96, **not** this changed child.
- A standalone Node 22 map-copy reduction was executed and demonstrated that mutation of the returned object changes the original map value. This is a *language-level reproducer*, **not** the repository's test runner or a credential/key-store exploit.
- Local `git ls-remote` still fails `Could not resolve host: github.com`. No isolated local worktree, pinned dependency install, TypeScript, shared adapter test, Playwright or runtime key-store acceptance ran locally. Any later hosted CI result must be separately matched to **this child head**.
- Preserve the historical November 19 local suite exit 137 with no final report, earlier queued, failed and cancelled CI runs, PR #56 main-push Alpha cancellation and CLI success. Do not count old gates as current success and do not rerun unmodified killed suites.

## Fresh reviewer assignments (not yet executed)

1. **Code-audit worker:** independently fetch and pin the actual new head/tree in an isolated worktree. Compare parent #96 code/test tree. Confirm the new map projection cannot expose internal objects; check memory overhead/order, repeated calls, repeated delete/reinsert, each tenant's key and any competing mutable report paths. Run targeted TypeScript and storage suite if source checkout works; publish exact counts, failed commands and next-worker instructions.
2. **Functional bug-hunt worker:** in separate worktree run pinned `corepack pnpm typecheck` and `packages/kernel/src/storage/storage.contract.test.ts` focused via the package's actual Vitest runner, serially on memory, SQLite and fake IndexedDB. If possible run prior-parent RED/current-child GREEN on the new case. Inspect child head's hosted Alpha/browser/CLI logs, not the parent's. Confirm normal encrypted and plaintext reinsert, final detach, rollback, tenant isolation and orphan sweep.
3. **Source-focused defensive security worker:** review the actual key-owner consumer and transaction result boundary, checking that only the **successful committed final** list is acted on, that mutable copies cannot redirect a later key-deletion target, that stale or duplicate requests are not actionable and that per-tenant authorization remains intact. Static-only review must be labeled static; do not resume interrupted exploitation reproductions. Publish source identities and remaining questions.

These are separate outstanding tasks; no independent agent/reviewer completion is claimed in this run. Fix only confirmed defects, preserve tests, and hand off to fresh workers on the next cycle. Compare prospective/actual merge trees, qualify each stacked ancestor, verify a real merge and main's separate push runs before counting integration.

## Next bounded P1 boundary

Record-only encrypted backup/reopen using the 15 production codecs has already merged via #63. Attachment bytes/references and delivery/lease state are still excluded; their future recovery requires versioned authenticated manifests, owner authority, atomic blob/reference commit and interrupted-load acceptance. Do not duplicate merged functionality or wholesale adopt incompatible PR #8. No release, deployment, force push, branch deletion or paid API work authorized.
