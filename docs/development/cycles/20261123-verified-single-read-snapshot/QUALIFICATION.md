# Single-blob snapshot correction — qualification

Parent PR #133 remote head `f74564a12376efa44ad23fb348ad6c7dea0744c7`, tree `a74895bd0e520f736162a32fff92369ed53a90e5`. Child: `codex/classrup-verified-single-read-snapshot-20261123-t17`. Resolve child final head SHA/tree after publication.

| Gate | Evidence | Attribution |
|---|---|---|
| Parent Alpha 45114101513 | Completed success; plan and domain jobs including typecheck, static, tooling, domain, build, Chromium browser | Parent only |
| Parent CLI 45114101477 | Completed success; Ubuntu Node 22.18.0 and 24.x clean-install jobs | Parent only |
| Child local TypeScript, Vitest, browser | Not executed: github.com DNS failed, no worktree/dependencies | Unqualified |
| Child current-head Alpha / CLI | Not yet observed | Required |
| Independent code/bug/defensive reviews | No worker results or approvals available | Required |
| Qualified ancestor merges and main-push workflows | Not performed | Required |

The regression is published test source, **not an executed pass**. Original PR #57 complete domain exit 137 without report and other failed/incomplete CI artifacts remain distinct. No signatures, identity, encryption, product cap, or timeout modified.
