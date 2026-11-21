# ClassRup — PR #82 hosted qualification and next review handoff

Checkpoint: 2026-11-21 UTC. Documentation-only continuation; do not treat this as an independent execution or merge approval.

## Source identity and ownership

- Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
- Existing draft #82: `codex/classrup-vault-early-codec-admission-20261121`; published and workflow-observed SHA `ba13461483382d8dbeb053ae41fcd7ec9c4ee060`, tree `7bf2c24f395664ce71591f1ea829a4a0b8285e1c`.
- Exact frozen parent: draft #81 `9ed978b4f4dd4323eddf287fd1feff5cdbfa2d9d`. GitHub remote compare against the #82 branch returned 3 ahead, 0 behind and precisely these deltas: `packages/vault/src/vault.ts`, `packages/vault/src/vault.test.ts`, and `docs/development/cycles/20261121-vault-preflight/HANDOFF.md`.
- This continuation is in a **separate documentation branch**, `docs/classrup-pr82-qualification-review-20261121`, started from the observed #82 remote branch; #82 source/branch, ancestors and main are unchanged. Re-read actual remote branch heads before any integration. Prior local-only SHA aliases must not be merged indiscriminately.

## Exact hosted run update

GitHub's commit-associated workflow endpoint returned completed/success for the #82 published commit:
- Alpha verification: https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44863669437 — completed/success. Its latest-attempt jobs include `plan` and `domain`, both success. The `domain` job steps reported success for frozen pnpm install, typecheck, spec/dependency/registry checks, money vectors/bundle budget, tooling tests, full domain test command with JSON report, noninteractive setup, build, and browser journeys. Screenshot-on-failure upload was skipped by design; this is not a skipped domain/browser test.
- CLI setup: https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44863669521 — completed/success. Inspect each latest-attempt job and native-platform/version details before recording a precise test count.

These are current published-commit hosted qualifications; they supersede the former queued status **only for this source**. This checkpoint did not download full job logs or assertion totals. Do not infer any assertion count, current release readiness, or independent-review completion from these status results. Historical local full-suite exit 137, old failed/queued/cancelled statuses, and the separate #56/#57 merge-and-main-push receipts remain historically unchanged.

## Bounded source review

Inspected the #82 `vault.ts` implementation through GitHub's source connector and compared with its parent:
1. `openVault` now invokes `snapshotBackupCodecs` before `openEncryptedStorage`. This is the right ordering for invalid registry rejection before a durable IndexedDB writer-token claim.
2. The helper destructures callback references and applies `bind(codec)`, capturing method receivers while not freezing trusted closure state. `vaultFromStorage` repeats the snapshot at the public composition seam; #81's post-open `close()` remains present for downstream composition failures.
3. The helper currently reads properties and calls `.bind` before validating whether codec elements and callback members have appropriate runtime types. An invalid object, an accessor throwing during property access, or a noncallable callback can reject with an ordinary JS error rather than `Invalid backup codecs`. This is a **source-observed error-consistency boundary**, not a demonstrated data loss or writer-fence regression. Crucially, it occurs before IndexedDB acquisition on the `openVault` path. Do not label it an exploitable security issue without independently confirming an actual trust boundary.
4. Reader/writer ownership, cleanup timing, cross-vault isolation, and native browser lock behaviors still need separate focused evidence. Do not infer their complete correctness from the helper's shape.

No production edit was made in this round. A local `git ls-remote` check failed with `Could not resolve host: github.com`; no isolated local worktree, pinned install, local Vitest or independent agent execution was possible on this host. Connector source inspection and hosted CI are different evidence categories.

## Next fresh, separately owned review generation

- **Code audit** — isolated worktree at actual live #82 head; compare with #81 and `main`; inspect prototype/private-field binding, double snapshot and class receiver identity, property getter side effects, null/noncallable input behavior, reserved/duplicate-name/256-cap parity and all `openVault` exception paths. Record exact commit/tree, findings and command exits. Any remedy should be in its own bounded child branch, with focused tests and no changed caps.
- **Functional bug hunt** — in a separate worktree, use pinned install, serial typecheck and targeted `vault.test.ts` / IndexedDB writer-fence tests; run the new invalid-contender case against the frozen parent and #82 source if practical, then valid create/unlock, persist, close/reopen, export/restore. Inspect hosted browser job/logs for actual engine coverage, especially no-Web-Locks simulations. Never rerun unchanged killed full suites without changed conditions.
- **Defensive security review** — source-focused review of writer-token fencing, unexpected codec getters and method exceptions, storage disposal, per-tenant authority and error disclosure. Recommend mitigations only for confirmed defects; do not resume interrupted reproduction follow-ups or imply penetration testing occurred.
- Each reviewer must leave an independent source-specific handoff with commands, test outcomes, unresolved findings, and instructions for another fresh worker. None of these reviews is marked completed by this documentation checkpoint.

## Next bounded feature / qualification plan

After this reviewed writer-fence correction, the highest-priority remaining backup work is a **mixed production-codec-set encrypted restore and reopen** with canonical record IDs, rebuilding four-slot indexes, preserved principal/signing identity and normal reader compatibility. Existing full-registry tests cover a 15-type record archive on a prior source, not whole-database/attachment/delivery-state recovery. Confirm current branch ancestry and existing test fixtures to avoid duplication, implement just the missing encrypted IndexedDB restore/reopen acceptance, and preserve v1 bytes, existing signatures, crypto policy, size/type caps and test timeouts. Keep attachment bytes, excluded stores, lease/delivery state, rotation, device load, and native WebKit identity import qualification separately pending.

PR #82 remains draft with zero submitted reviews at this checkpoint. Do not merge this child or its stacked ancestors without exact-source reviewed gate evidence and qualified integration order, actual merge-tree verification, and separate main-push checks. No release, deployment, force push, branch deletion, paid API, unrelated automation change, or wholesale draft #8 integration is authorized.
