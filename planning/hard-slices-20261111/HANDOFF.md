# Hard-slices lane — handoff (paused 2026-11-11 ~01:20 UTC)

**Status: PAUSED by owner instruction ("stop all workers except ghostpay and p2p offramp; finish gracefully and update to github").** Nothing in this directory is implemented code; it is the verified baseline, subsystem maps and candidate designs for the five hardest remaining parts of ClassRup, preserved so the work can resume without rediscovery.

## Branch and base
- Branch `claude/difficult-project-parts-dcqlup` is fast-forwarded onto the local-first alpha head `codex/local-alpha-20261109` (`429fcfc`, draft PR #10), **not** onto the planning-only `main`. Everything below assumes that base.
- The parallel integration lane pushed `integration/classrup-completion` (draft PR #24 → main) = the same base plus the seven small ChatGPT-lane fixes; none of its files overlap the slices below except one export line in `packages/mutiny/src/index.ts`. Rebasing this branch onto it should be conflict-free.
- Slice worktrees (`slice/A`…`slice/E`) existed only in the session scratchpad with zero commits; nothing was lost by discarding them.

## What was done (verified in this session)
1. Baseline reproduced on `429fcfc` with Node 22.23.4 / pnpm 10.28.0: `typecheck` clean; `spec:check` 148/148, 0 errors, 33 warnings; `deps:check` 0 errors; vitest 162/162 across 63 files; `test:tooling` pass; `trace` 99/4510 requirements, 3/148 modules with tests.
2. Six implementation-ready subsystem maps written by reader agents (`maps/`): kernel storage, kernel bus, mutiny/bazaar, app composition and trace conventions, federation+identity specs (PS numbers, requirement IDs, test rows), vault+money specs.
3. Shared architecture brief and slice ownership (`ARCH_BRIEF.md`, `slices.json`), coordinated with the integration lane (they confirmed every listed path is ours).
4. Candidate designs from independent designers with distinct lenses (`designs/design-<slice>-<n>.md`): A×3, B×2, C×3, D×2, E×2 (E-3 was in progress when paused). Each has data model, state machines, API signatures, threat model, numbered test plan with TEST-PS ids, and honest limits.

## What was in flight when paused
- Judge panels (2 judges per slice) and the synthesis of a final `DESIGN-<slice>.md` for A–D; designer 3 for E. All stopped; **no final synthesized design exists**. A usage-credit outage had already killed the first judging round at ~01:13 UTC.

## The five slices (ranked hardest first by the alpha ledger `planning/LOCAL_ALPHA_20261109.md` and PR #15)
| Slice | Goal | Owns |
|---|---|---|
| A | CTR-FED-001 FED-3/FED-4: per-author seq/prev chains, 24 h gap buffer, fork freeze (no last-writer-wins), replay rejection, author-signed tombstones (purge ≤24 h, retain 180 d), storage-reopen replay, alpha per-subject chains untouched | `packages/federation/src/**`, `tests/integration/federation-*.test.ts`, append-only rows in `11_Federation/**/module.spec.yaml` |
| B | Encryption at rest for every vault table (DEK wrapped by one scrypt derivation per unlock, XChaCha20-Poly1305 per row with AAD binding, forward migration of plaintext vaults, fail-closed tamper handling) | `packages/kernel/src/storage/indexeddb.ts`, new `at-rest*.ts`, `packages/vault/src/vault.ts`, identity key helpers, tests |
| C | ADR-0013 account/device log: device link (counter-signed), revoke, rotate, one-time recovery kit, 72 h disputed recovery claim, deterministic fold to a portable identity document, forks freeze | new files under `packages/identity/src/`, tests, append-only spec rows |
| D | IOX-2 read-only import preflight and idempotent import into an existing vault (new/identical/conflicting classification, one transaction, same-principal only, subset rule for record types + format version) | `packages/vault/src/import.ts`, index export, one method on `UnlockedVault` at merge |
| E | CTR-MNY-001 money/FX/tolerance, deterministic compensation legs, pinned quotes ≤24 h, quantity-aware wants/holds/feasibility, digest compatibility for `classrup.alpha.proposal_revision/v1` | `packages/mutiny/src/**`, additive `packages/bazaar/src/listings/index.ts`, tests, append-only spec rows |

## How to resume
1. Read `ARCH_BRIEF.md`, then the maps a slice needs (listed in `slices.json`).
2. Run `workflows/judge-synth.js` (Workflow tool, args as in `slices.json` plus `designs: [...]`) per slice to produce `DESIGN-<slice>.md`; for E first finish a third candidate or judge the two that exist.
3. Create a worktree per slice (`git worktree add <dir> -b slice/<X> <base>`; `corepack pnpm install --frozen-lockfile --offline`), then run `workflows/implement-slice.js` per slice (implement → 3-lens review → verify each finding → fix loop → report).
4. Merge slices in the order B → D → A → C → E (D depends on B's vault surface staying a guarded kernel `Storage`; C and A share only an interface: A keys chains by signer did:key, C maps device DIDs to accounts).
5. Full gate before any PR: `corepack pnpm typecheck && corepack pnpm spec:check && corepack pnpm deps:check && corepack pnpm run test:tooling && corepack pnpm test --reporter=json --outputFile=test-results/domain.json && corepack pnpm trace --results test-results/domain.json`.

## Known facts and pitfalls recorded
- `restoreBackup` in `packages/vault/src/vault.ts` requires the bundle's `recordTypes` to equal the running codec list exactly; registering any new record type makes earlier backups unrestorable. Slice D should adopt a subset rule and a format version (finding from the integration lane).
- `tests/integration/alpha-security.test.ts` and `tests/browser/alpha.spec.ts` carry no `TEST-PS-…` ids, so they count for nothing in `pnpm trace`; new tests must put the id in the `it(...)` title.
- The Workflow tool runs at most 2 concurrent agents on this 4-CPU container; run one workflow per slice in parallel rather than one wide workflow.
- Admission in `packages/mutiny` does not run `validateEdge`; currencies are `/^[A-Z]{3}$/`; quantity/compensation extensions must thread through the closed key sets and hash domains listed in `maps/mutiny.md` §8.

## CI
No CI ran for this branch beyond the base commit's own history (the branch contains no code changes). Nothing is red; nothing was skipped or weakened.
