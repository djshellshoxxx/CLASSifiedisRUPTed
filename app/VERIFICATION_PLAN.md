# Framework browser verification milestone — 2026-10-30

## Scope and decision
The product roadmap's next major milestone is M2 (foundational specifications), which remains blocked by unselected security protocols and owner policy decisions. This bounded milestone completes the existing mock framework's browser-verification gap; it does not complete M2, grant spec approval, or permit a main merge. Target the documented demo integration branch work/classrup-haiku-framework, preserving the continuation history in PR #5. Main and PRs #1–#6 stay intact.

## Acceptance criteria
- A clean npm ci installs exact locked development tooling; application runtime remains dependency-free.
- One command starts and stops its own server and runs all eight existing browser check files and smoke journeys on Chromium, Firefox, and WebKit. A missing browser, invalid engine, server startup failure, failed assertion, child failure, or timeout fails the run.
- Existing phone/desktop, narrow viewport, keyboard, saving, editor validation/draft/dialog, read-only barter, contrast, and reduced-motion checks keep their behavioral assertions. Fix discovered browser differences without weakening checks.
- Unit tests and structural audits pass; semantic audit must still report NO-GO.
- CI runs the browser matrix on the demo integration branch and PRs targeting it. No deployment/release workflow.
- Independent diff review, verified remote merge, post-merge checks and committed handoff.

## Approach
Reuse the standalone journey scripts, select their browser through one shared helper, and wrap each as a Playwright Test case with three projects and managed webServer. This preserves existing oracles and gives reliable server cleanup, timeouts and failure artifacts. Rewriting journeys or adding a separate custom process supervisor would add unnecessary complexity.

## Implementation plan
- [ ] Add and run failing engine-selection tests; implement shared helper and migrate all launch sites.
- [ ] Pin Playwright Test, commit lockfile and ignore generated dependencies/artifacts; configure managed server and three browser projects. Add wrappers preserving script exit codes/stdout/stderr.
- [ ] Install browser binaries in workspace; run unit tests, all browser projects and root audits. Diagnose and fix failures with regression coverage.
- [ ] Add read-only CI, document exact commands, evidence and limitations; independent review and fixes.
- [ ] Push using GitHub connector, PR into work/classrup-haiku-framework, inspect checks and merge; verify remote revision and rerun integration checks.
- [ ] Save post-merge handoff in app/handoffs/ with merge SHA, evidence, remaining M2 decisions and next steps; commit/push separately.

## Review focus
No accidental Chromium fallback, no swallowing script failures, no server reuse that tests the wrong tree, no skips reported as passes, no production/spec approval claims. Real assistive-technology testing remains separate from DOM keyboard checks.
