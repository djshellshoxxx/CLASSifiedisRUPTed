# ClassRup: prevalidate registered codecs before acquiring a writer fence

Checkpoint: 2026-11-21 UTC. This is a distinct bounded continuation of draft PR #81; it does **not** replace or rewrite its ancestor, and is not a release.

## Exact source and concurrent ownership

- Repo: `djshellshoxxx/CLASSifiedisRUPTed`. Main observed at `449a619f1ae7b66cb42d9cab43dd5493bfe42c2e`, tree `8fe1965ae60c385042f09c690eabe7d0828b36e8` (PR #63 merged).
- Exact parent: draft PR #81 `codex/classrup-openvault-init-disposal-20261120`, `9ed978b4f4dd4323eddf287fd1feff5cdbfa2d9d`, tree `7327e21d5ca02eff71c40afcbbb88be5e87fe76c`. Parent remains unchanged. Its separate **Alpha 44858402294** and **CLI 44858402045** are reported successful on that exact parent source; they **do not** qualify this child.
- Own branch: `codex/classrup-vault-early-codec-admission-20261121`, forked at that parent commit. Production commit `aedb1be13656923eddf0149bef3ebb640edf6052`; regression commit `9c5003833637766dbe4cf521b03408dcac47177d`, tree `efeba9fcb125ff8a125c98d94889c6b9b30edb07`. This document is a later documentation-only commit: read fresh head/tree before comparison or integration.
- GitHub compare at this test checkpoint: 2 commits ahead / 0 behind parent, modifying **only** `packages/vault/src/vault.ts` and `packages/vault/src/vault.test.ts`. No other PR or main was modified.

## Confirmed source-level gap and focused remedy

The #81 repair closes storage after `vaultFromStorage` rejects a malformed registry. But `openEncryptedStorage` calls `openIndexedDbConnection`, which **claims a new writer token before codec validation**. In environments with no exclusive Web Lock, a rejected malformed-codec open can invalidate an existing, otherwise live writer even though the rejected new connection is closed. This follows directly from `packages/kernel/src/storage/indexeddb.ts` `claimWriter` and writer-fenced `persist`. It is a source-level correctness/integrity availability gap, **not** a reported field incident or an executed exploit.

The child extracts the existing codec method-binding and registry-name validation into `snapshotBackupCodecs`, invokes it **before** opening IndexedDB and again in the public `vaultFromStorage` seam. This preserves the previous receiver-bound snapshot, duplicate/reserved-name/256-type checks and original rejection text. The double snapshot wraps already bound functions; the original closures and receivers remain unchanged. #81's post-open cleanup remains as defense in depth for any unexpected subsequent composition error. No v1 archive format, identity, signatures, encryption policy, key/index semantics, product caps, dependencies, timeouts, CI selection or public ABI was intentionally changed.

New integration-style regression (existing 30-second case limit) models absent exclusive Web Locks by admitting competing connections, opens a valid encrypted vault, tries both empty-name and duplicate-codec rejected opens, then requires the original vault to **commit** ordinary owner records after each rejection. On the pre-change code the invalid contender would claim the writer token and the original commit would reject with `vault_superseded`. This test is authored but has **not yet been executed** at this source.

## Verification facts and limits

- A read-only connector comparison verified the exact two-file source/test delta and unchanged original parent commit. The new helper and test were inspected statically for stable callable bindings and no modified application/test caps; static inspection is **not** a TypeScript build, Vitest pass or product-browser execution.
- The local host has Node 22 and TypeScript 5.8 but cannot resolve `github.com`, and no repository checkout or pinned pnpm workspace exists there. No isolated checkout, real application tests or genuine independent workers were completed in this invocation; **do not report them as passed**.
- #81's parent-head Alpha/CLI success and earlier #80 hosted success are distinct prior-source evidence. Preserve the November 19 complete-domain exit 137, the #56 main-push cancelled Alpha, and all historical incomplete/failed/queued jobs as their original outcomes.

## Fresh, separately owned review lanes — still pending

1. **Code review:** in an isolated checkout based on this exact remote head, inspect the extracted helper against the parent implementation, including class-prototype/private-method binding, mutation of original codec objects after opening, type-map/reserved-key/cap parity, and double snapshot receiver semantics. Inspect #81 cleanup preservation and all DI error paths. Record source/tree, diff, commands and actual failures. Do not count static review as executed tests.
2. **Functional bug hunt:** after a successful pinned install, run `corepack pnpm typecheck`, then the **focused vault composition and IndexedDB writer-fence tests sequentially**, and verify the new case fails for the parent implementation but passes for this head where possible. Inspect errors, exception paths, valid create/unlock, reopen and export. Then inspect this head's hosted Alpha domain, applicable native-browser and CLI jobs. Keep source/job IDs, assertion counts, exits and any setup failure distinct; do not launch concurrent resource-heavy suites.
3. **Defensive security review:** source-review the no-Web-Locks writer-token policy, original/current writer fencing, potential side effects of untrusted codec property getters, cleanup on unexpected registration failures, tenant isolation, identity/key capture and error channels. Confine work to review and defensive hardening, not interrupted reproduction follow-ups. Distinguish demonstrated defects from theoretical risks.

The next owner should read `docs/development/cycles/20261119/HANDOFF.md`, `QUALIFICATION.md`, all newer 2026-11-20 handoffs, `docs/development/REMAINING_WORK.md`, current PRs and this handoff. Keep this child **draft**, and do not integrate until ancestor qualifications, **current exact-head** required hosted checks and genuinely independent reviews pass. Verify prospective and actual merge trees, then main's own push CI. No unrelated automation changes, PR #8 wholesale merge, deployment, release, force push, branch deletion or paid API calls are authorized.
