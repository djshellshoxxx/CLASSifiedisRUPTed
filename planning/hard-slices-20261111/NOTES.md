# Session notes (decisions, pitfalls)
- Base: codex/local-alpha-20261109 @ 429fcfc. Integration lane pushed integration/classrup-completion (PR #24 -> main) = base + seven fixes; none of its files overlap my slices except one export line in packages/mutiny/src/index.ts (they add cycle_execution/recovery) and README link lines.
- Peer finding for slice D: vault.ts restoreBackup requires recordTypes to EQUAL the running codec list; any new repo type makes old backups unrestorable. Slice D implementation must adopt a subset rule (all bundle types must be known; unknown types rejected) plus a format version; also apply the same relaxation to restoreBackup only if the merge step decides (owner: me).
- Workflow concurrency cap is 2 agents per workflow (4 CPUs). Run several workflows in parallel instead of one wide one.
- Worktrees: scratchpad/wt/{A..E} on branches slice/{A..E}; offline pnpm install works (~0.7 s).
