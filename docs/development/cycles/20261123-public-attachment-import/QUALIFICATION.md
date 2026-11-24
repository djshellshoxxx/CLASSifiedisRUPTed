# Exact-source qualification — bounded P0 attachment import

Parent draft PR #146: `db2c038d5a33ab9437fd88f5cb57c4c896d60df7`. Its Alpha run `45222485942` and CLI run `45222486074` completed with success, as confirmed via GitHub commit workflow runs. Parent success is **not** child qualification.

Child branch: `codex/classrup-public-attachment-import-20261123-t30`. Latest authored source commit before this qualification ledger: `f7ac354d9c24efaa839829f0c6c76f6b41e6ea69`. Review actual remote head on continuation and do not rely on this historical SHA after further commits.

Changes: restricted P0, unencrypted-source import; verified signed manifest and complete bounded byte admission; detached copies and in-transaction byte rehash; canonical owner/codec/revision/digest revalidation under the destination write; atomic put and deterministic canonical-parent holder attach; explicit private existing-dedup privacy guard. Regression **sources**: `attachment-public-import.test.ts` (valid P0 restore/import) and `attachment-public-import-privacy.test.ts` (existing P1 destination retains privacy on failure). Fixture methods updated.

Execution status at publication: native `git ls-remote` failed (`Could not resolve host: github.com`); no local repository compile, product test, browser test, native worktree or independent review has run. Child-hosted Alpha/CLI checks are pending PR creation and execution; do not report them as passes until completed logs/job conclusions are inspected. Full original #57 runner exit 137 and earlier failed compiler runs remain evidence, not successful tests. No old test caps or signature constraints changed.

Required: child exact-head typecheck, domain tests, PWA build, Chromium/Firefox/WebKit journeys, Ubuntu CLI Node 22/24, two independent reviews plus functional bug hunt. Specifically test two-blob rollback on late conflict, repeated import, stale parent, recipient ciphertext/non-P0 refusal, IndexedDB AES-GCM row persistence and encrypted reopen. The holder labels do not implement matching detach/rotation and are **not** complete lifecycle. No release or merge pending those gates.
