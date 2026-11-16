# Branch consolidation review — 2026-11-16

## Latest parallel continuation

Draft PR #42 (`codex/parallel-completion-20261116`) continues PR #41 at
`560b328`; first-wave runtime `36428cc` was qualified after browser-harness
repair `7bf7d51`. Latest reviewed source is `bdd2971`, adding currency
registry commit `5c2e766`, coarse preferences and worker offload; its final CI
evidence is tracked in PROJECT_STATUS. All 63 browser journeys and six platform
jobs passed on `bdd2971`; later documentation commits preserve that source. PR #39 → #40 → #41
remain the prerequisite stack. Current `main` was `32c9d7e` at review.
The older selected-baseline entries below are historical.

The new content audit confirms the parked coarse discovery, taxonomy/prohibited
policy, privacy metadata, antifraud, notification and CI paths are already
incorporated. They must not be merged again simply because their original commits
were not ancestors. Money, consent, lifecycle and session additions were written
as separate commits with fresh review handoffs. See
[the exact branch inventory](../handoffs/20261116-inventory-audit.md) and
[the current integration handoff](../handoffs/20261116-parallel-integration.md).
No source branch or old PR was deleted, closed or automatically merged here.

Read-only ancestry and source review of all fetched remote heads. This entry supersedes the earlier ledger's branch dispositions where explicitly stated. It does not claim that pending branches have been merged or that source review is runtime verification.

## Selected baseline and scope

The runnable baseline is `chatgpt/zero-codex/review-ranking-i18n-20261112` at `d16abee`, which contains `integration/classrup-completion` at `75d4bf5` plus ranking and i18n. The consolidation branch starts from it. Newer `main` (`76d39e3`) and `claude/wonderful-cori-ynhlsb` (`3a5c9e3`) are planning-only trees, not newer versions of the runnable PWA.

| Branch or group | Reviewed head | Disposition |
|---|---|---|
| `integration/classrup-completion` | `75d4bf5` | Contained in baseline; retains local alpha and seven corrective fixes |
| `agents/discovery/ranking` and `agents/i18n/languages-currencies` | `de8f44d`, `a0f9422` | Contained in `d16abee`; avoid duplicating these integrations |
| `agents/discovery/coarse-filters` | `4f60ff9` | Integrated by `bb1f4b8` before this documentation worktree was created; verification belongs to the implementation report |
| `agents/privacy/classification-metadata-consent` | `2752f04` | Additive classification/metadata candidate; consent was not implemented on this branch |
| `agents/governance/taxonomy-prohibited` | `9972491` | Additive taxonomy/prohibited-policy candidate; requires review, exports and application integration |
| `agents/moderation/rate-limits-signals` | `c098f1b` | Additive rate/account-limit/signal candidate; requires review and caller wiring |
| `agents/notify/prefs-inapp` | `d6076d1` | Additive preferences/in-app candidate; requires review and application wiring |
| `agents/ci/trim-workflows` | `3f41b81` | Workflow planner candidate; execution evidence required after adoption |
| `agents/orchestration/wave1-handoff` | `6406a03` | Preserve remaining-work details; November 11 status is historical |
| `claude/bold-mccarthy-qklhl6` | `a403614` | Unique partial security/platform implementation and contract changes; selective qualification required, not a blanket merge |
| `claude/difficult-project-parts-dcqlup` | `566778c` | One planning checkpoint beyond its alpha baseline; does not deliver the planned encryption/recovery runtime |
| `main`, `claude/wonderful-cori-ynhlsb` | `76d39e3`, `3a5c9e3` | Preserve security audits/tracker; archive newer contract drafts separately rather than overwrite existing runtime contracts |
| `chatgpt/zero-codex/audit-observability-20261110`, `docs-wiki-20261110`, `qualify-pr10-20261110` | fetched heads | Historical audit/handoff/docs logs; retain findings without copying stale status claims |
| `planning/future-cli-specs-20261110` | `af4dcc5` | Future CLI proposal, distinct from the working local-alpha setup/serve CLI |
| `continuation/classrup-20261101` and old demo ancestors | `fa0cf0c` | Preserves the mock-demo lineage; adapt useful UX individually, not conflicting storage/contracts |
| `claude/busy-cerf-vg3hz3` | `34a6892` | Separate workspace/runtime assumptions; feature-level port only after review |
| `claude/happy-newton-4yttpa` | `e402bd5` | Hand-written process changes conflict with generated documents; reconcile into YAML rather than overwrite |
| `claude/vigilant-newton-nva2l6`, `claude/gallant-goodall-9cc7yb` | fetched heads | Historical documentation/recovery notes; no independent current runtime baseline |

The old demo ancestors include `docs/prompt3-foundations-20261022`, `docs/client-owned-foundations-20261024`, `work/classrup-haiku-framework`, `claude/classifiedisrupted-continue-lcuuwg`, `milestone/framework-browser-verification`, and `claude/pensive-mendel-30x81m` / `work/classrup-framework`. All are ancestors of `continuation/classrup-20261101`.

No source branch is deleted or force-pushed. “Preserved” is not “merged”: incompatible historical implementations stay recoverable in Git rather than being installed beside the active runtime.

## Qualification sequence

1. Continue from the reviewed alpha baseline; qualify the additive parked modules independently.
2. Add package exports and honest integration tests, then connect application workflows separately.
3. Fix confirmed runtime defects with regression tests, including backup codec evolution.
4. Reconcile the newer security/platform checkpoint in bounded changes with its missing generated files, exports, adapters and tests supplied.
5. Reconcile preserved planning findings against the runnable code; retain OPEN status until each acceptance criterion has evidence.
6. Run complete available checks on the combined tree and record exact CI heads before deciding which PRs are redundant.

## Historical ledger (2026-11-11)

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

## November 16 implementation consolidation outcome

PR #37 combines the latest reviewed runnable alpha with the reviewed code from `agents/discovery/coarse-filters`, `agents/governance/taxonomy-prohibited`, `agents/moderation/rate-limits-signals`, `agents/privacy/classification-metadata-consent`, `agents/notify/prefs-inapp`, and `agents/ci/trim-workflows`. These are content integrations with additional regression fixes, not indiscriminate merges of every historical branch. Current `main` is merged into the candidate; the new planning contracts remain archived separately. The incomplete `a403614` foundation checkpoint and incompatible mock-demo histories remain preserved and unmerged. See PROJECT_STATUS.md for actual wiring and remaining runtime gaps.
