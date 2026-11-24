# ClassRup round 7 — codec-name producer/diagnostic contract alignment

Date: 2026-11-20 (America/Vancouver), continuation of the owner's ClassRup recovery consolidation and independent-review work.

## Frozen source, parent and ownership

- Remote `main` observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`; PR #56 and #57 are already merged. Do not merge the incompatible draft #8.
- Draft parent PR #79 `codex/classrup-backup-coverage-overflow-fixture-20261120` observed at `44e3cfdfb60e657c1b62592fac104fc45eb804ff`. This head is held **unchanged** by this round. Its base is draft PR #78 `ad1e56f9bf9f9f9081391ab678f48dc161860ae4`; upstream #78/#77/#76/#75/#74/#72 remain draft. Parent #79 had zero submitted independent GitHub reviews and no requested reviewers.
- New isolated *remote branch* `codex/classrup-codec-type-admission-20261120` created from the exact parent PR #79 commit, rather than rewriting any existing work. GitHub checkout in the current host remains unavailable (`Could not resolve host: github.com`), so no local worktree or product-test execution was possible.
- Two ordinary child commits: `4f775c31e3db58c599960d8599345ad86bae2eb8` (regression test), `b4edb4dd7c426adc796acefe1f0b64485a75bcd6` (production guard). Current pre-documentation tree `229348917a65544e2a2ba7689201b9f3b2d5b2bf`. GitHub compare: **2 commits ahead / 0 behind**, exactly the vault producer and its dedicated test changed. **Re-fetch final remote head/tree after this handoff is committed.**

## Source finding and bounded fix

A prior PR #79 PWA validator change rejects `registeredRecordTypes: ['']` as malformed. Static review verified that the producer `vaultFromStorage` accepted an empty `BackupCodec.type`, because the original admission required only unique types, no reserved `vault.identity` type, and <=256 names. Consequently a custom caller could create a vault whose producer returned an empty registered type but whose PWA diagnostic refused the corresponding record-coverage report. This is a **source-contract consistency finding**, not a reproduced customer incident or evidence of an exploit.

The new producer guard explicitly rejects **empty or non-string** codec names at initial registration, using the existing `Invalid backup codecs` error. Valid named codecs retain their receiver-bound snapshot, canonical index rules and existing rollback/identity behavior. A new `packages/vault/src/backup-coverage.test.ts` case checks `''`, `null` and `0` at runtime and positively checks a normal named registry/session/coverage. The guard does not attempt to change accepted nonempty character sets, codec signatures, stored rows, signed encrypted v1 backup format, signing identity, recovery, transaction rules or configured limits.

## Real parent-head hosted qualification (distinct from child)

Parent PR #79 head `44e3cfdf...` fully passed its actual Alpha and CLI jobs during this round:

- [Alpha run 44839558559](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44839558559): plan success, domain job `136651978142` success. Full TypeScript/static checks, 27 tooling tests, 854 executed Vitest domain assertions **854 passed / 0 failed / 0 pending / 0 skipped / 0 todo**, build, and 78 Playwright journeys passed (Chromium, Firefox, WebKit, one worker).
- [CLI run 44839558566](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44839558566): plan plus Ubuntu Node 22.18.0 and 24.x clean-install/CLI/setup/build/browser-smoke jobs all successful.
- Historical frozen prior head `928b3f2...` Alpha `44834626391` **failed** (currency winner-order test, 853/854 passing), CLI `44834626369` passed. That failure was not silently converted to a pass; the currency-test fix in PR #79 is what qualified later.
- Original Nov 19 full local domain suite exited 137 before a final report. Historical PR #56 main push Alpha `44658477772` cancelled and CLI `44658477821` succeeded. Retain these as distinct facts and do not conflate test source identities.

**This new child branch's source and authored regression are NOT yet qualified by any executed tests**. No previous successful parent result can qualify the changed vault code. Do not restart unchanged historical queues or the killed local full suite.

## Three separate successor-review scopes

1. **Code-audit reviewer** — freeze exact child head/tree; compare `vaultFromStorage` registry creation and `BackupCoverage.registeredRecordTypes` with the PWA validator. Confirm rejection of empty/non-string values does not affect normal production `productionBackupCodecs` or codec receiver binding, and inspect whether any other callers depend on historically allowed empty names. Record exact static-only findings; do not claim runtime validation.
2. **Functional bug-hunt reviewer** — use a freshly fetched remote ref in an isolated checkout; run the new test in `packages/vault/src/backup-coverage.test.ts` and full TypeScript first, then relevant export/restore and the current-source Alpha/CLI gates with serial resource use. Explicitly test acceptance of ordinary named codecs, identity and backup compatibility. Record exact job IDs, exit statuses and assertion totals. A DNS/setup failure is not a product test failure or a passing result.
3. **Defensive security reviewer** — source-review invalid registry inputs, tenant-scoped coverage, error-message handling and session revocation, preserving the existing signing, encryption, per-principal and v1 format boundaries. Review and harden only; do not restart interrupted reproduction follow-ups or claim independent penetration testing.

Each truly independent worker must leave exact source/tree, tests, confirmed defects and next-generation instructions. These scopes are **assignments only**: no independently executed reviewers are claimed for this invocation. Obtain independent sign-off and exact-child CI before integration. The parent PR #79 remains draft and unmerged pending independent reviews despite its successful exact-head hosted gates.

## Constraints

Do not release, deploy, force push, delete branches, use paid external APIs, auto-merge draft #8, modify unrelated automation tasks, or infer credit exhaustion from CI queues, DNS errors or process kills. Preserve all unsuccessful and incomplete original evidence.
