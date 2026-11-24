# Source-specific qualification — authenticated attachment byte admission
- Remote parent PR #143 exact published head: `c42e12531569e17eb4f55ec26734b8787ab0aa16`; tree `8d543607193be38a638838b9eb3cb549ea94b952`.
- Child branch: `codex/classrup-verified-attachment-bytes-20261123-t27`. Published commit/tree and PR URL belong in the GitHub checkpoint. Git object publication is not local product test execution.
- New integration test source: two authentic attachment-bearing records, signed+encrypted metadata, actual verified source blobs, complete acceptance, negative altered/swapped/absent/oversized/wrong principal and ordinary v1 destination owner reconciliation.
- All child exact-head TypeScript, static/build, domain, browser and CLI gates: **not yet observed on publication**. Separate parent #143 Alpha/CLI results cannot qualify this source. Do not label queued/partial jobs passing.
- Independent code-audit, normal functional bug-hunt and defensive security review: **pending/unexecuted**, no approvals.
- Native Git DNS on this host failed; no native worktree, local TypeScript, Vitest or browser test run. Preserve older failed/incomplete evidence; do not repeatedly restart unchanged queued jobs or killed suites.
- Merge only after current-source required checks and independent review, then compare actual tree and main push qualification. No deploy/release/force push/delete.
