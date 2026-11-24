# Exact-source qualification — failed manifest snapshot cleanup
- Parent draft #145: `fba9f1883cec03ddc2ccabe797ebfaa9d41b3e38`, tree `576518e5f18fe916d4e52d8421736384106faf9e`.
- Parent exact-source Alpha 45211530385: completed success (domain/typecheck/build/browser). CLI 45211530452: completed success (Ubuntu Node 22/24). Both statuses are from inspected completed GitHub runs, not child verification.
- Native clone/worktree locally: setup failed, `git ls-remote` reported `Could not resolve host: github.com`. Local application tests: **not run**. Source new regression: **not yet executed**.
- Child Alpha and CLI: pending until actual exact-source job results are inspected. Independent code-audit, bug-hunt and defensive security workers: **not launched and not approved**. The source-author's narrow review is not an independent review.
- Preserve killed #57 complete local domain exit 137 and all prior original failed/partial run records separately; do not restart identical killed suites without a concrete resource remedy. No gates reduced.
- Merge blocked until exact current-source qualification and independent reviewers, then qualified ancestor integration and actual main-push checks.
