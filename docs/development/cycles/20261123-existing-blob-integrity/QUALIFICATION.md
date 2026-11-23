# Qualification — existing P0 blob integrity child

Parent PR #147: `b69aabe23acd25064c4859c421cfce8ae11c7f88`, tree `2604787af6b5edcff53a217a246f2ef53cac03f1`. Its separate hosted Alpha `45233160619` and CLI `45233160682` completed successfully before this branch was authored. These results **do not qualify this child**.

Child: `codex/classrup-existing-blob-integrity-20261123-t31` (live head must be checked after publication). A single code change in `packages/vault/src/vault.ts` verifies that an existing matching-metadata blob’s actual bytes still hash to the signed manifest address inside the destination write transaction, clearing the verifier-owned copy. New regression: `tests/integration/attachment-public-import-existing-integrity.test.ts` with two cases—corrupted snapshot fail-closed/no holder attach, and valid existing P0/duplicate import idempotence.

At publication: native clone/worktrees and local repository tests **not executed** because `git ls-remote` returned `Could not resolve host: github.com`. GitHub Git-object source publishing is not a runtime test. Await current-head Alpha domain/typecheck/build/Chromium/Firefox/WebKit and CLI Ubuntu Node 22/24, plus independent code/bug/security reviews. Preserve all historical failures and killed/incomplete suites. No merge or deployment authorized until gates clear.
