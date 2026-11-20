# Read-only branch preservation reconciliation — G8

## Result

At the **November 19, 2026, 10:45 p.m. Pacific** observation, all **57 original
non-main branch names still point to their exact original heads**. None is
missing or moved. Current main, PR #58, PR #59 and preserved PR #8 match the
expected heads supplied by the integration owner. No conflicting published
head drift was found in this snapshot.

The remote-head read ran from `2026-11-20T06:45:02.707859Z` through
`2026-11-20T06:45:07.949666Z`. GitHub API observations followed at
`2026-11-20T06:45:20Z`. The report was assembled at
`2026-11-20T06:45:46.351974Z`. These are point-in-time observations, not a lock
on future changes or proof that other workers have no unpublished work.

## Counts and original source preservation

| Scope | Count |
|---|---:|
| Original inventory, including main | 58 |
| Original non-main heads compared | 57 |
| Original non-main heads unchanged | **57** |
| Original non-main heads moved or missing | **0** |
| Current remote branch names, including main | 65 |
| Additional names since the original inventory | 7 |
| Original non-main heads ancestral to current main | 34 |
| Additional heads ancestral to current main | 5 |
| All current non-main heads ancestral to main | 39 |
| Current non-main heads not ancestral to main | 25 |
| Ancestry checks with unavailable objects/errors | 0 |

Ancestry counts describe Git history only. They do not establish that the
remaining branches contain missing product work, nor reclassify their
content-equivalent or intentionally preserved contributions. This audit did
not perform semantic source review or recommend any branch deletion.

The baseline is
`docs/development/evidence/20261118/inventory.json` in the canonical repository.
The full comparison retains every original branch name and both head values
in [audit.json](audit.json). Baseline and command-output hashes are recorded
there and in [remote-heads-receipt.json](remote-heads-receipt.json).

## Current source identities and open PRs

| Source | Head | Observed state |
|---|---|---|
| `main` | `137d88e36cc6b1611b062daa33cf84c3d29c86b3` | Matches expected current main |
| [PR #58](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/58), `codex/classrup-mixed-codec-recovery-20261120` | `25b4708191f04516cab74371c84a15663cc6f6a6` | Open draft; target `main` |
| [PR #59](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/59), `codex/classrup-recovery-next-20261120` | `86cd564e0692e8c777538200675dc20f2651ab51` | Open draft; target `main` |
| [PR #8](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/8), `claude/bold-mccarthy-qklhl6` | `a403614bb34d3d176d4693730e512e14959718b8` | Open draft; original source unchanged |

The open-PR endpoint returned exactly these three entries; the requested page
size was 100. Both current recovery PRs report base SHA `137d88e3`. PR #8's
response still carries the older `95c46be4` base SHA while naming `main`;
that metadata is not substituted for the independently read current main ref.

GitHub's immutable commit endpoints establish:

- PR #59's sole parent is the exact PR #58 head `25b47081`; its tree is
  `ca413cdad0612f8e602f1ec98e499fd589d68906`.
- PR #58's sole parent is `38ada90037d8176b0e0e319651b712cc396cad5d`; its tree
  is `bc38af24e9d81724de6d463e681fd55db7e3618b`.
- Local Git ancestry queries separately confirm current main is an ancestor
  of PR #58, and PR #58 is an ancestor of PR #59. Both commands exit zero.

The exact API URLs and projected responses are retained in
[github-observations.json](github-observations.json). No hosted result, native
browser result or merge qualification is inferred from these source checks.

## Additional observed refs

| Additional branch | Observed head | Ancestor of current main |
|---|---|---|
| `codex/classrup-engineering-20261119` | `e4bce5196e5086293234a576e3cb03697994cad8` | Yes |
| `codex/classrup-f1b-consolidation-20261119` | `3aa7a17b28ee07ebec4336b49c3527743510bc16` | Yes |
| `codex/classrup-mixed-codec-recovery-20261120` | `25b4708191f04516cab74371c84a15663cc6f6a6` | No |
| `codex/classrup-recovery-next-20261120` | `86cd564e0692e8c777538200675dc20f2651ab51` | No |
| `docs/classrup-feature-qualification-20261119` | `7619ba839a7bcbb38428d6429ab5362c5c18d095` | Yes |
| `docs/consolidation-qualification-20261118` | `7f5c250cd0a956081479891416c0267b26a1fdb1` | Yes |
| `integration/comprehensive-consolidation` | `a111eefb907a9f039f56777715e20b4976ea3d87` | Yes |

## Procedure and limits

The external Git command was `git ls-remote --heads origin` from the root
checkout. It exited zero with 5,844 stdout bytes and empty stderr. The raw
[remote-heads.txt](remote-heads.txt) SHA-256 is
`aaa1566c117268ba00f660d9daeac52ba7cf7aaebbbc54247ac64919cdef4b9e`.
Local ancestry queries used `git merge-base --is-ancestor` against the exact
observed main/source hashes, without moving refs or changing a checkout.

Only these scratch audit files were written. No repository files, local or
remote branch refs, PR metadata, workflows, checkouts or dependencies were
changed. No product tests ran. Refresh the relevant remote heads immediately
before any subsequent publication or merge; this report does not authorize
deleting preserved branches or treating queued CI as successful.
