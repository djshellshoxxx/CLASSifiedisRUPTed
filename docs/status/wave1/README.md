# Wave 1 working material

Reference material from the first parallel implementation wave (2026-11-11). Nothing here is loaded by the
application or by CI.

| File | What it is |
|---|---|
| `lanes.json` | The fourteen lane definitions: branch, modules (ID, PS number, spec directory, code directory), model tier used and the lane-specific guidance each agent received |
| `lane-pipeline.workflow.js` | The per-lane pipeline: implement, two independent reviews (correctness, security and privacy), fix, verify. Run once per lane with `{ "id": "<lane id>" }` as its argument |
| `security-review.workflow.js` | The five-lens review of the existing alpha code: find, then reproduce or refute each claim |
| `lane-reports/` | Each implementing agent's own end-of-step report, generated from the run journal |
| `reviewer-probes/` | Two exploratory test files that reviewers were running when they were stopped. They assert nothing; they show where the reviewers were looking |

The two workflow scripts are kept as they ran, except that session-specific paths were replaced by the
placeholders `<SCRATCH_DIR>`, `<WORKTREES_DIR>` and the commit trailer. To reuse them: create one git
worktree per lane on its branch from the integration head, run `corepack pnpm install --frozen-lockfile`
in each, write one `lane-<ID>.json` per lane into the scratch directory, update `BASE` in the script to the
commit the lanes branch from, and launch one pipeline per lane. A pipeline runs at most two agents at a
time on a four-CPU machine, so parallelism comes from running several pipelines.

Rules the lanes followed, worth keeping: a lane creates files only inside its modules' code directories;
it never edits a package entry point, `package.json`, the lockfile or a specification; dependencies on
modules that do not exist yet are narrow injected ports; a `TEST-PS-…` ID goes on a test only when the test
really performs that row; full-suite runs are serialized with `flock`; browser tests are never run from a
lane (the preview port is fixed).
