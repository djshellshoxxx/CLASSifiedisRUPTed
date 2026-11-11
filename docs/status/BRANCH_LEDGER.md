# Branch and pull-request ledger

Recorded 2026-11-11 (UTC) by the integration lane on `integration/classrup-completion`.
Every row was checked against fetched git objects; trial merges were run against this
branch and aborted. No branch or pull request other than this one was pushed to, rebased,
closed or merged. "Contained" means the head commit is an ancestor of this branch.

Baseline: `main` `95c46be` (planning only) ← Stage 3/4 kernel `3694395` (PR #8) ← local alpha
`429fcfc` (PR #10). This branch starts at `429fcfc`.

## Consolidated here

| PR | Branch | Head | Content | Evidence |
|---|---|---|---|---|
| #8 | `claude/bold-mccarthy-qklhl6` | `3694395` | Stage 3 specs as data, Stage 4 kernel | Ancestor of `429fcfc`; contained |
| #10 | `codex/local-alpha-20261109` | `429fcfc` | Vault, signed listings, barter alpha, CLI | Base of this branch; contained |
| #15 | `chatgpt/zero-codex/federation-recovery-trace-20261110` | `20691f1` | FED/IOX gap map (planning doc) | Clean merge |
| #16 | `chatgpt/zero-codex/outbox-isolation-20261110` | `a294dd2` | Outbox retry scoped by tenant and aggregate type | Clean merge; reviewed; 3 new tests pass |
| #17 | `chatgpt/zero-codex/cli-public-symlink-20261110` | `f8ed3a9` | CLI refuses symlinked public assets | Ancestor of #19 head; contained |
| #19 | `chatgpt/zero-codex/cli-nested-assets-20261110` | `3a66e44` | Nested symlink and linked-directory tests | Clean merge; reviewed; 3 new CLI tests pass |
| #20 | `chatgpt/zero-codex/barter-discovery-status-20261110` | `e0f153f` | Live status for barter discovery results | Clean merge; browser journey asserts it |
| #21 | `chatgpt/zero-codex/noscript-vault-guard-20261110` | `968d63d` | Vault access inert until scripts initialize | Clean merge; 2 browser tests pass |
| #22 | `chatgpt/zero-codex/diagnostic-privacy-regression-20261110` | `9bb0339` | Log message and Error detail redaction | Clean merge; reviewed; 2 new tests pass |
| #23 | `chatgpt/zero-codex/sync-expiry-head-boundary-20261110` | `1255843` | Expired sync heads fail before dispatch | Clean merge; reviewed; 1 new test passes |
| #9 | `codex/classrup-consolidation-audit-20261104` | `59324a4` | 2026-11-04 ancestry audit (historical) | Clean merge; superseded by this ledger |
| #11 | `chatgpt/zero-codex-continuation-spec-20261109` | `d52b293` | ChatGPT lane specification | Clean merge |

These pull requests target `main` or `codex/local-alpha-20261109` and stay open. Once this
branch lands on `main`, #8, #9, #10, #11 and #15–#23 carry no content that `main` lacks at the
heads listed above; closing them is the owner's decision.

## Active lanes, left untouched

| PR | Branch | Why it is not merged here |
|---|---|---|
| #12 | `chatgpt/zero-codex/qualify-pr10-20261110` | Hourly handoff log of the ChatGPT lane; changes every run |
| #13 | `chatgpt/zero-codex/docs-wiki-20261110` | Wiki source and docs log updated hourly; statements pinned to "main is planning only" need the lane's own update after this branch lands |
| #14 | `chatgpt/zero-codex/audit-observability-20261110` | Hourly read-only audit ledger |
| — | `claude/difficult-project-parts-dcqlup` | Sibling Claude session, started 2026-11-11 from `429fcfc`; no commits beyond the alpha head when recorded |

## Superseded lines, preserved unmerged

| PR | Branch | Head | Finding |
|---|---|---|---|
| #1 | `docs/prompt3-foundations-20261022` | `39ac847` | 15 conflicts against generated module documents; contracts were re-derived in Stage 3 |
| #2 | `docs/client-owned-foundations-20261024` | `d804b49` | 336 conflicts; its client-owned constraint is recorded in ADR-0016 |
| #6 | `claude/vigilant-newton-nva2l6` | `7c25259` | README conflict; planning-status wording replaced by the alpha README |
| #18 | `claude/happy-newton-4yttpa` | `e402bd5` | 20 conflicts; edits hand-written process documents that are now generated from `module.spec.yaml`. Any content still wanted must be ported into the YAML specification |
| #3 | `claude/pensive-mendel-30x81m` (= `work/classrup-framework`) | `52bed39` | Mock demo under `app/`; ancestor of the #7 line |
| #4 | `work/classrup-haiku-framework` | `0ac7f96` | Mock demo checkpoint; ancestor of the #7 line |
| #5 | `claude/classifiedisrupted-continue-lcuuwg` | `ab65415` | Mock demo continuation; ancestor of the #7 line |
| #7 | `milestone/framework-browser-verification` | `25fa6f0` | Mock demo browser verification |
| — | `continuation/classrup-20261101` | `fa0cf0c` | #7 plus a storage-fallback fix for the mock demo |
| — | `claude/busy-cerf-vg3hz3` | `34a6892` | Separate TypeScript workspace (comms, federation); different dependency and runtime assumptions |
| — | `claude/gallant-goodall-9cc7yb` | `cc55f8a` | Stale `RESUME_STATE.md` recovery note from 2026-10-28 |

Verified ancestry: #1 → #2 → #4 → #5 → #7 → `continuation/classrup-20261101` form one line (each is
an ancestor of the next), and #3 is also an ancestor of #7. `continuation/classrup-20261101` is
therefore the single head that preserves the whole planning-documents and mock-demo line.

The mock demo (`app/`) uses contracts that conflict with the Stage 3 specifications; the local
alpha ledger (`planning/LOCAL_ALPHA_20261109.md`) records the decision to adapt its user-experience
conventions only. None of these branches was deleted; unique work remains recoverable from them.

## Reproducing a row

```sh
git fetch origin '+refs/heads/*:refs/remotes/origin/*'
git merge-base --is-ancestor origin/<branch> HEAD && echo contained
git merge --no-commit --no-ff origin/<branch>; git diff --name-only --diff-filter=U | wc -l; git merge --abort
```
