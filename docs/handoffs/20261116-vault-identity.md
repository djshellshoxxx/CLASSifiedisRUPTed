# Vault and identity milestone — November 16, 2026

Base: PR #41 at `560b328dd335aebdc12de01ec339c43ebd164be3`; working branch
`codex/parallel-completion-20261116`. Implementation team: `vault_team`.
Fresh review: `fresh_review_team`; final integrated SHA and aggregate results
are owned by the integration lead.

## Implemented

- `packages/vault/src/session-policy.ts` adds a dependency-free automatic lock
  controller. Default inactivity is 15 minutes; a user can select 1–60 minutes.
  Hidden tabs lock after five minutes. Inactivity, visibility, and policy-change
  handlers check overdue deadlines before resetting anything, including when a
  browser delayed the timer. Repeated hidden signals do not extend the deadline.
  Lock is invoked immediately once; disposal cancels timers and rejected close
  operations reach the supplied error handler.
- The controller uses an injectable monotonic clock and timer. Only the UI
  supplies activity signals. Root's `apps/pwa/src/vault-session.ts` binding
  accepts trusted pointer/keyboard events, handles visibility changes, and
  removes listeners on teardown. Root owns app session invalidation and stale
  result protection. Background delivery or refresh never counts as activity.
- Failed vault unlocks start a one-second local delay on the third failure,
  double on successive failures, and cap at 60 seconds. Blocked attempts do not
  extend the delay or perform key derivation. Verified identity unlock resets
  the counter. The same IndexedDB factory/vault name retains the limiter across
  close/reopen in the current page. This memory-only limiter resets on reload
  and does not prevent offline attacks, other-page attempts, or hostile code.
- Native Ed25519 failures now have fixed `IdentityCryptoError.stage` values:
  generation, public/private export, private/public import, sign, or verify.
  Diagnostics never include the native error message, cause, key material,
  passphrase, or principal. No failed crypto operation is retried or accepted.
  Browser primitive failures do not count as incorrect-passphrase attempts.
  The temporary private-key import buffer is explicitly wiped in `finally`.

## Contract scope and unresolved work

This is the bounded **F16.S02.M01 key-lifecycle policy** slice. It does not
complete the entire key or session contract. F07.S01.M02 specifies a different
idle range (1–480 minutes) and failure policy (five failures, capped at 15
minutes). Reconcile those specifications deliberately before claiming canonical
session completion; this change uses the key-lifecycle requirements above.

The original WebKit creation failure is not declared fixed. The diagnostic
document pins an upstream leading-zero Ed25519 generation/import defect, but
the original failing operation was not captured. New errors will identify that
operation without exposing inputs. A compatible browser release and actual
browser runs remain required; no application cryptography bypass was added.

Canonical 24-word recovery remains unimplemented because it depends on absent
delegated device registration, signed recovery notices/disputes, synchronized
revocations and the 72-hour recovery window. A local kit that silently copies
the current account key would not satisfy those contracts. Also unfinished:
agreement keys/private messaging integration, key rotation/registry, passphrase
change, common-passphrase policy/strength UX, worker-based derivation, complete
recovery export, cross-tab broadcast locking, physical erasure/rollback
resistance, and large-vault load qualification. Existing encrypted backup and
domain-storage guarantees are preserved, not expanded into these claims.

## Verification and fresh-team continuation

`corepack pnpm exec vitest run packages/vault/src/session-policy.test.ts
packages/vault/src/vault.test.ts packages/identity/src/identity.test.ts
--maxWorkers=1`: **16/16 passed**. The fresh reviewer independently ran controller,
UI adapter and action-queue suites: **12/12 passed**. Follow-up encrypted-storage
regressions plus the final session-policy suite: **18/18 passed** (11 storage,
seven policy). No local browser pass is claimed; the current host cannot launch
browser Unix sockets.

Review the final session-policy test after the last deadline correction: a
timeout increase cannot revive a session whose previous deadline already
elapsed. Verify the integration callback invalidates the exact session before
awaiting storage close, cleans up listeners, and never queues automatic lock
behind a pending user transaction. Run the complete domain, typecheck, browser,
and platform gates on the final combined SHA. Keep all unimplemented canonical
recovery and external browser qualification items pending.
