export const meta = {
  name: 'classrup-implement-slice',
  description: 'Implement one hard slice from its final design in its own worktree, then adversarially review and fix until no confirmed findings remain',
  phases: [
    { title: 'Implement', detail: 'test-first implementation of the final design' },
    { title: 'Review', detail: 'three independent reviewers with distinct lenses, then a verifier per finding' },
    { title: 'Fix', detail: 'apply confirmed findings, re-run checks; loop until clean (max 3 rounds)' },
    { title: 'Report', detail: 'final checks and slice report' },
  ],
}
// args: { slice, title, design, brief, maps: [...], wt: worktree path, ownership: string }
const a = args
const WT = a.wt
const CHECKS = `cd ${WT} && corepack pnpm typecheck && corepack pnpm spec:check && corepack pnpm deps:check && corepack pnpm run test:tooling && corepack pnpm test`
const COMMON = `Repository worktree for this slice: ${WT} (branch slice/${a.slice}; node_modules installed; run every command from this directory and never from /home/user/CLASSifiedisRUPTed). Read completely before doing anything: ${a.brief}, the final design ${a.design}, and the maps ${a.maps.join(', ')}. File ownership for this slice (do not modify anything outside it): ${a.ownership}. Rules: test first (write the failing test, run it, then implement); vitest for packages/*/src/**/*.test.ts and tests/{unit,property,integration}/**/*.test.ts; every test title that implements a spec test carries its TEST-PS-NNN-09.Tnn id; no node: imports in isomorphic packages; bigint/decimal strings for money; injected clocks; fail closed; bounded collections; no secrets in logs or errors. Iterate with focused runs (corepack pnpm exec vitest run <file>) and finish with the full gate: ${CHECKS} (spec:check must report 0 errors and no more than 33 warnings). Commit your work on the slice branch in small commits with clear messages (git add only files you own; git commit -m "<type>(<scope>): <summary>"); never push. Do not fabricate results: if a check fails and you cannot fix it, say so precisely.`
const IMPL_SCHEMA = { type: 'object', properties: { summary: { type: 'string' }, files_changed: { type: 'array', items: { type: 'string' } }, checks: { type: 'string' }, limits: { type: 'string' }, spec_rows_added: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'files_changed', 'checks', 'limits'] }
const FINDINGS = { type: 'object', properties: { findings: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, file: { type: 'string' }, line: { type: 'number' }, severity: { type: 'string' }, claim: { type: 'string' }, failure_scenario: { type: 'string' }, suggested_fix: { type: 'string' } }, required: ['id', 'file', 'severity', 'claim', 'failure_scenario'] } } }, required: ['findings'] }
const VERDICT = { type: 'object', properties: { id: { type: 'string' }, confirmed: { type: 'boolean' }, evidence: { type: 'string' }, severity: { type: 'string' } }, required: ['id', 'confirmed', 'evidence'] }

phase('Implement')
const impl = await agent(`You are the implementing engineer for slice ${a.slice} (${a.title}). ${COMMON}
Implement the final design completely, following its ordered implementation plan and its numbered test plan: every numbered test must exist and pass, plus property tests where the plan names them. Where the design appends test rows or error codes to a module.spec.yaml, append them exactly (never reorder or delete; keep spec:check at 0 errors and without new warnings). Update the owning package README with an honest "what this establishes / what it does not" section. When done, run the full gate and report: summary, files_changed, the exact final output lines of each check, the limits you documented, and any spec rows you added.`,
  { label: `implement:${a.slice}`, phase: 'Implement', schema: IMPL_SCHEMA, effort: 'high' })
log(`implementation of ${a.slice}: ${impl ? impl.summary.slice(0, 200) : 'FAILED'}`)
if (!impl) return { slice: a.slice, status: 'implement_failed' }

const LENSES = [
  'correctness and specification conformance: compare the code line by line with the final design and the module.spec.yaml requirements it claims to cover; find any behaviour that deviates, any test that does not actually assert what its title claims, any trace id attached to a test that does not cover the mapped requirement',
  'adversarial security: try to break it (replay, forks, downgrade, partial failure, clock skew, resource exhaustion, key or data leakage in errors/logs, unbounded inputs, type confusion, missing fail-closed paths, race between concurrent transactions, tampered persisted state)',
  'engineering quality and integration: existing alpha formats and tests unchanged in meaning, no forbidden files modified, no node: imports in isomorphic packages, deps:check and spec:check clean, no floats for money, dead code, misleading README claims, missing migration or compatibility handling, anything that will break when the five slices are merged',
]
let round = 0
let openFindings = []
while (round < 3) {
  round++
  phase('Review')
  const reviews = await parallel(LENSES.map((lens, i) => () => agent(`You are reviewer ${i + 1} of 3 for slice ${a.slice} (${a.title}), round ${round}. ${COMMON}
Review ONLY (do not modify files). Inspect the diff of the slice branch against its base: cd ${WT} && git diff $(git merge-base HEAD origin/codex/local-alpha-20261109) -- . ':!pnpm-lock.yaml' and read every changed file completely; run the tests you need. Your lens: ${lens}. Report only findings you can substantiate with a concrete failure scenario (inputs/state → wrong outcome); include file and line and a suggested fix. Severity: critical (data loss, security, silent wrong state), high (spec violation, broken guarantee), medium (robustness, misleading claim), low (quality). Return an empty list if you find nothing real. Give each finding an id ${a.slice}-R${round}-${i + 1}-n.`,
    { label: `review:${a.slice}:r${round}:${i + 1}`, phase: 'Review', schema: FINDINGS })))
  const all = reviews.filter(Boolean).flatMap(r => r.findings)
  log(`${a.slice} round ${round}: ${all.length} candidate findings`)
  if (!all.length) break
  const verdicts = await parallel(all.map(f => () => agent(`You are an independent verifier for slice ${a.slice}. ${COMMON}
Do not modify files. Verify or refute this finding by reading the code and, where possible, running a focused test or script in ${WT} (you may write a temporary test file under ${WT}/tests/integration/tmp-verify-*.test.ts and must delete it afterwards). Finding: ${JSON.stringify(f)}. Default to confirmed=false unless you can demonstrate the failure scenario or the spec violation concretely. Return {id, confirmed, evidence, severity}.`,
    { label: `verify:${f.id}`, phase: 'Review', schema: VERDICT })))
  const confirmed = verdicts.filter(Boolean).filter(v => v.confirmed)
  const byId = new Map(all.map(f => [f.id, f]))
  openFindings = confirmed.map(v => ({ ...byId.get(v.id), evidence: v.evidence, severity: v.severity ?? byId.get(v.id)?.severity }))
  log(`${a.slice} round ${round}: ${openFindings.length} confirmed findings`)
  if (!openFindings.length) break
  phase('Fix')
  const fix = await agent(`You are the fixing engineer for slice ${a.slice} (${a.title}), round ${round}. ${COMMON}
Apply fixes for every confirmed finding below (each with evidence). For each: add or adjust a regression test first, then fix the code minimally; never weaken or delete existing assertions to get green; if a finding is wrong after all, explain why with evidence instead of changing code. Run the full gate at the end and commit. Findings: ${JSON.stringify(openFindings)}. Report summary, files_changed, final check output lines, limits, spec rows added.`,
    { label: `fix:${a.slice}:r${round}`, phase: 'Fix', schema: IMPL_SCHEMA, effort: 'high' })
  log(`${a.slice} fix round ${round}: ${fix ? fix.summary.slice(0, 200) : 'FAILED'}`)
}
phase('Report')
const report = await agent(`You are the reporting engineer for slice ${a.slice} (${a.title}). ${COMMON}
Do not change source code. Run the full gate exactly: ${CHECKS} ; then run cd ${WT} && corepack pnpm test --reporter=json --outputFile=test-results/domain.json && corepack pnpm trace --results test-results/domain.json . Then write ${WT}/../reports/SLICE-${a.slice}.md (create the reports directory if needed) containing: what was implemented (files, public APIs, statement/record formats), the exact final output lines of every check, the list of test ids (TEST-PS-…) now passing, the trace coverage line, residual confirmed-but-unfixed findings (if any) with reasons, documented limits, and the exact git log of the slice branch (git log --oneline origin/codex/local-alpha-20261109..HEAD). Return {summary, files_changed: [report path], checks, limits}.`,
  { label: `report:${a.slice}`, phase: 'Report', schema: IMPL_SCHEMA })
return { slice: a.slice, status: openFindings.length ? 'residual_findings' : 'clean', rounds: round, impl, report, residual: openFindings }
