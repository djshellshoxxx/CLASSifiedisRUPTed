export const meta = {
  name: 'classrup-lane',
  description: 'Implement one ClassRup lane to its module specifications in an isolated worktree, review it twice independently, fix and verify',
  phases: [
    { title: 'Implement', detail: 'build the lane modules with requirement-mapped tests' },
    { title: 'Review', detail: 'independent correctness and security reviews of the lane diff' },
    { title: 'Fix', detail: 'resolve findings with regression tests' },
    { title: 'Verify', detail: 'independent verification and full validation' },
  ],
}

const S = '<SCRATCH_DIR>' // directory holding one lane-<ID>.json per lane (see lanes.json)
const BASE = '75d4bf51433ebddef56c86c4065d9619ebe02058'
const lane = args
const WT = '<WORKTREES_DIR>/lane-' + lane.id // one git worktree per lane, on the lane branch
const FILE = S + '/lane-' + lane.id + '.json'
const TRAILER = '<the commit trailer lines your session requires>'

const CTX = [
  'PROJECT: ClassRup (CLASSifiedisRUPTed), a local-first classifieds and barter PWA. TypeScript pnpm monorepo, Node 22, Vitest. The specification is data: every module has a module.spec.yaml with requirements, commands, state machines and a test table.',
  'LANE DEFINITION: read the JSON file ' + FILE + ' first. It gives your git branch, base commit, the modules of this lane (id, ps number, title, specDir, codeDir) and lane-specific guidance. The spec of a module is <specDir>/module.spec.yaml inside the worktree.',
  'WORKTREE: ' + WT + ' (already checked out on the lane branch, dependencies installed). Run every shell command as: cd ' + WT + ' && <command>. Use absolute paths with file tools.',
  'OFF LIMITS: never read or change anything outside this worktree: not the session working directory and not another lane worktree. Never push. Never run browser tests, pnpm dev, pnpm preview or playwright: other lanes share this machine and the port.',
  'READ BEFORE WRITING (in the worktree): packages/kernel/KERNEL_API.md (the API every module uses); planning/adr/ADR-0016.md (local-first: every module runs in the user vault, relays are optional and never authoritative, cross-party state is signed statements); planning/COORDINATION_NOTES.md (cross-module decisions N1 to N20); planning/SPEC_FORMAT.md. When texts disagree the precedence is ADR-0016, then COORDINATION_NOTES, then the module spec.',
  'EXEMPLARS: packages/bazaar/src/listings/index.ts with packages/bazaar/src/listings/listings.test.ts, and packages/discovery/src/search/index.ts. Test harness: packages/kernel/src/testing/harness.ts (createTestKernel) and packages/kernel/src/testing/sample-module.ts.',
].join('\n')

const RULES = [
  'RULES',
  '1. Scope: create files only under the codeDir of each lane module: <codeDir>/index.ts, tests next to it as *.test.ts, further source files if useful, and <codeDir>/NOTES.md. Edit nothing else: no package.json, no package entry src/index.ts, no lockfile, no module.spec.yaml or planning document, no other module. If something outside your scope would have to change, do not change it; record it in NOTES.md and in your result.',
  '2. Canonical names: use command, query, event, capability, error-code and statement-schema names exactly as the spec writes them. Every definition carries module: "<module id>". Module-specific error codes are defined once in the owning module (see how the kernel exposes defineErrors and appError).',
  '3. Dependencies on modules that do not exist yet (the spec depends_on): do not import them and do not stub them inside your module. Declare a narrow port interface in your module, take it through the options of your definitions factory, and use fakes in tests. No imports from @classrup/commerce, comms, moderation, notify, governance, privacy, i18n or platform: they have no entry point yet and other lanes are writing them now. You may import @classrup/kernel and, where tools/deps/deps.mjs layer rules allow, the existing entry points @classrup/discovery, @classrup/bazaar, @classrup/identity, @classrup/federation and @classrup/security. Packages stay isomorphic: no node: imports outside test files.',
  '4. Cross-party effects are signed statements. Take sign and verify callbacks through options exactly like BazaarOptions.signProjection and verifyProjection. Never implement cryptography. Never act on an unverified statement, and check that the signer is the party entitled to make that statement. Where the spec says the receiving vault applies the same transition, export a statement handler (statement type mapped to a function that runs inside a command transaction) for the composition root inbound router; do not add public command names that are not in the spec.',
  '5. Kernel rules: handlers return Result; never call storage.transaction inside a handler (use ctx.tx); repo.put(id, data, { expectedRevision }) with 0 to create; at most 4 indexes per repo; stored data is JSON (money as decimal strings in integer minor units, never bigint or float); events are emitted with ctx.emit in the same transaction as the state change; mutating commands are idempotent and take expectedRevision where the spec says so; use the injected clock, never Date.now() or Math.random() in module code.',
  '6. No placeholders: no TODO stubs, no empty handlers, no code that pretends to satisfy a requirement. If a requirement cannot be implemented correctly inside your scope, leave it out and list it in NOTES.md with the reason.',
  '7. No new npm dependencies. vitest, fast-check, yaml and zod (through the kernel export z) are available.',
  'TESTS',
  'The spec table contract_and_acceptance_tests.tests has rows "Tnn | level | covers | scenario | expected". The traceability tool counts a requirement as covered only when a passing test title contains TEST-<ps>-09.Tnn, for example TEST-PS-011-09.T01.',
  'Put that id at the start of a test title only when the test really performs that row scenario and asserts its expected outcome. A test that asserts less than the row says must not carry the id. An independent reviewer audits this.',
  'Implement the unit, property (fast-check), contract, integration and abuse rows. Implement a load or chaos row only if it runs deterministically in under about 3 seconds with a generous margin and really measures what the row states (precedent: packages/kernel/src/bus/perf.test.ts). Leave e2e, a11y and manual rows unclaimed: they need the PWA.',
  'Also test the sad paths: each validation rule violated returns its documented error code and stores nothing; each edge case in the spec behaves as written.',
  'VALIDATION (from the worktree)',
  'corepack pnpm typecheck; corepack pnpm deps:check; corepack pnpm spec:check (must end with 0 errors); corepack pnpm vitest run <your code directories> --maxWorkers=2.',
  'Do not loop on the whole suite. If you run it, serialize it: flock /tmp/classrup-heavy.lock corepack pnpm test --maxWorkers=2. If a test outside your directories fails, rerun that file alone; if it passes alone it was machine load: report it and do not touch it.',
  'COMMIT: git add -A && git commit on the lane branch, conventional subject, body ending with exactly these two trailer lines:\n' + TRAILER + '\nAfterwards git status --short must print nothing.',
  'NOTES.md per module directory, short and factual: implemented commands, queries, events and statement handlers; ports the composition root must supply (name and signature); deviations from the spec with the reason (cite ADR-0016 or the N number); test rows not covered with the reason; open questions.',
].join('\n')

const IMPL_SCHEMA = { type: 'object', required: ['commit', 'summary', 'modules', 'validation'], properties: {
  commit: { type: 'string', description: 'HEAD commit SHA of the lane branch after your commit, or empty if nothing was committed' },
  summary: { type: 'string' },
  blocked: { type: 'string', description: 'Set only if no committed, passing implementation exists; explain why' },
  modules: { type: 'array', items: { type: 'object', required: ['id', 'commands', 'queries', 'testIdsClaimed', 'testRowsNotCovered', 'portsRequired', 'deviations'], properties: {
    id: { type: 'string' }, commands: { type: 'array', items: { type: 'string' } }, queries: { type: 'array', items: { type: 'string' } },
    testIdsClaimed: { type: 'array', items: { type: 'string' } },
    testRowsNotCovered: { type: 'array', items: { type: 'object', required: ['id', 'reason'], properties: { id: { type: 'string' }, reason: { type: 'string' } } } },
    portsRequired: { type: 'array', items: { type: 'string' } }, deviations: { type: 'array', items: { type: 'string' } } } } },
  validation: { type: 'object', required: ['typecheck', 'depsCheck', 'specCheck', 'laneTestsPassed', 'laneTestsFailed'], properties: {
    typecheck: { type: 'boolean' }, depsCheck: { type: 'boolean' }, specCheck: { type: 'boolean' },
    laneTestsPassed: { type: 'integer' }, laneTestsFailed: { type: 'integer' }, notes: { type: 'string' } } },
  outOfScopeNeeds: { type: 'array', items: { type: 'string' } },
  openQuestions: { type: 'array', items: { type: 'string' } } } }

const REVIEW_SCHEMA = { type: 'object', required: ['verdict', 'findings', 'testsPassed', 'testsFailed'], properties: {
  verdict: { type: 'string', enum: ['approve', 'changes_required'] },
  testsPassed: { type: 'integer' }, testsFailed: { type: 'integer' }, notes: { type: 'string' },
  findings: { type: 'array', items: { type: 'object', required: ['id', 'severity', 'title', 'file', 'evidence', 'expected', 'actual', 'fix'], properties: {
    id: { type: 'string', description: 'short unique id such as C1 or S3' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
    title: { type: 'string' }, file: { type: 'string' }, line: { type: 'integer' },
    evidence: { type: 'string', description: 'how you proved it: the temporary test and its output, or the exact code path' },
    expected: { type: 'string' }, actual: { type: 'string' }, fix: { type: 'string' }, regressionTest: { type: 'string' } } } } } }

const FIX_SCHEMA = { type: 'object', required: ['commit', 'resolved', 'rejected', 'validation'], properties: {
  commit: { type: 'string' },
  resolved: { type: 'array', items: { type: 'object', required: ['id', 'how', 'test'], properties: { id: { type: 'string' }, how: { type: 'string' }, test: { type: 'string' } } } },
  rejected: { type: 'array', items: { type: 'object', required: ['id', 'reason'], properties: { id: { type: 'string' }, reason: { type: 'string' } } } },
  validation: { type: 'object', required: ['typecheck', 'depsCheck', 'specCheck', 'laneTestsPassed', 'laneTestsFailed'], properties: {
    typecheck: { type: 'boolean' }, depsCheck: { type: 'boolean' }, specCheck: { type: 'boolean' }, laneTestsPassed: { type: 'integer' }, laneTestsFailed: { type: 'integer' } } } } }

const VERIFY_SCHEMA = { type: 'object', required: ['verdict', 'headCommit', 'open', 'typecheck', 'depsCheck', 'specCheck', 'suitePassed', 'suiteFailed', 'suiteSkipped', 'scopeClean', 'gitClean', 'statusLine'], properties: {
  verdict: { type: 'string', enum: ['pass', 'fail'] }, headCommit: { type: 'string' },
  open: { type: 'array', items: { type: 'object', required: ['id', 'severity', 'reason'], properties: { id: { type: 'string' }, severity: { type: 'string' }, reason: { type: 'string' } } } },
  typecheck: { type: 'boolean' }, depsCheck: { type: 'boolean' }, specCheck: { type: 'boolean' },
  suitePassed: { type: 'integer' }, suiteFailed: { type: 'integer' }, suiteSkipped: { type: 'integer' },
  loadFlakes: { type: 'array', items: { type: 'string' } }, filesOutsideScope: { type: 'array', items: { type: 'string' } },
  scopeClean: { type: 'boolean' }, gitClean: { type: 'boolean' },
  statusLine: { type: 'string', description: 'the one-line output of pnpm run status' },
  moduleStatus: { type: 'array', items: { type: 'object', required: ['id', 'interface', 'requirementsCovered'], properties: { id: { type: 'string' }, interface: { type: 'string' }, requirementsCovered: { type: 'string' } } } },
  notes: { type: 'string' } } }

const implPrompt = [CTX, '',
  'TASK: implement every module of this lane to its module.spec.yaml, with tests, and commit the result on the lane branch.', '', RULES, '',
  'Report honestly. If something failed or was left out, say so in the result. Set blocked only if you could not produce a committed, passing implementation.'].join('\n')

const LENS = {
  correctness: 'LENS correctness. (a) Spec conformance: command, query, event, capability and error names; input and output shapes; every validation rule and its error code; state machine (only declared transitions succeed, terminal states have no exits); emitted events; idempotency and expectedRevision. (b) Kernel rules from KERNEL_API.md. (c) Test honesty: for every test carrying a TEST-PS id, compare what it really asserts with the spec row scenario and expected result; flag ids on tests that assert less, vacuous assertions, and property tests whose generators cannot reach the interesting cases. (d) Logic errors, races between commands, unbounded queries, money arithmetic (floats, rounding), time handling, use of Date.now or Math.random. (e) Placeholders or stubs presented as implementation, and NOTES.md claims that the code does not back.',
  security: 'LENS security and privacy. (a) Authorization: who can invoke each command and query; ownership checks inside handlers; foreign records hidden as NOT_FOUND; a statement accepted only when signed by the party entitled to make it; replay, stale revision, author or subject substitution, cross-tenant access. (b) Privacy: private fields (notes, exact location, amounts where the spec marks them P2 or higher) never in public payloads, in events of a lower privacy class, in logs or in error messages. (c) Abuse: caps and rate limits the spec requires, resource exhaustion (unbounded arrays, strings, loops, pagination), catastrophic regular expressions, prototype pollution through untrusted JSON keys, untrusted binary parsing. (d) Consent and state integrity: no transition without the explicit consent the spec requires, no double acceptance, no silent rerouting. (e) Injected ports: fail closed when a port errors or denies.',
}
const reviewPrompt = (lens) => [CTX, '',
  'ROLE: independent reviewer. You did not write this code and you must not fix it.',
  'Review the lane changes: cd ' + WT + ' && git diff ' + BASE + '...HEAD --stat, then read every changed file in full and each lane module spec.',
  LENS[lens],
  'Prove what you claim. Run the lane tests (corepack pnpm vitest run <lane code directories> --maxWorkers=2). For a suspected defect, write a small temporary test that demonstrates it, run it and quote the relevant output. Delete every temporary file before finishing: git status --short must print nothing, and you must not commit.',
  'Report only real defects with evidence, never style preferences. Severity: critical = integrity, authorization or privacy break, or data loss; high = wrong behaviour on a specified path, or a claimed test id that does not test its row for a security-relevant requirement; medium = spec deviation or missing sad path with limited impact, or a dishonest test id elsewhere; low = minor. Prefix finding ids with ' + (lens === 'correctness' ? 'C' : 'S') + '. If the lane has no commit beyond the base, return verdict changes_required with one critical finding saying so.'].join('\n')

const fixPrompt = (findings) => [CTX, '',
  'ROLE: fix review findings on the lane branch. Independent reviewers reported the findings in the JSON below.',
  'For each finding: reproduce it first with a failing regression test, fix the root cause inside the lane code directories, and confirm the test passes. If a finding is wrong, change no code for it and explain precisely why, with evidence. Never weaken or delete an existing test to get green. Remove a TEST-PS id from a title only when the finding is that the id was claimed dishonestly and the row cannot be honestly covered; otherwise make the test really cover the row.', '', RULES, '',
  'Update NOTES.md where behaviour or coverage changed. Commit with a fix(<package>): subject and the trailer lines.',
  'FINDINGS:', JSON.stringify(findings, null, 1)].join('\n')

const verifyPrompt = (findings, fix) => [CTX, '',
  'ROLE: final independent verifier. Do not modify tracked files and do not commit.',
  '1. For each finding in the JSON below decide: resolved, correctly rejected (the fixer reasoning is valid), or still open. Read the code and run the regression tests the fixer names.',
  '2. Run from the worktree: corepack pnpm typecheck; corepack pnpm deps:check; corepack pnpm spec:check; flock /tmp/classrup-heavy.lock corepack pnpm test --maxWorkers=2 --reporter=json --outputFile=test-results/domain.json; corepack pnpm run status --results test-results/domain.json. Take passed, failed and skipped totals from the JSON file (numPassedTests, numFailedTests, numPendingTests). If a test outside the lane directories fails, rerun that file alone and report it under loadFlakes when it passes alone.',
  '3. Scope: git diff --name-only ' + BASE + '...HEAD must list only files under the lane code directories. List every other file under filesOutsideScope.',
  '4. git status --short must print nothing (test-results is ignored).',
  '5. Report per lane module the interface and requirements-covered numbers: run node -e on docs/status/feature-status.json after running corepack pnpm run status --results test-results/domain.json --write, then restore the tracked files with git checkout -- docs/status.',
  'verdict is pass only if no critical, high or medium finding is open, typecheck, deps:check and spec:check succeed, no test fails once load flakes are isolated, and the scope is clean.',
  'FINDINGS:', JSON.stringify(findings, null, 1), 'FIXER REPORT:', JSON.stringify(fix, null, 1)].join('\n')

const opts = (label, phaseName, schema, model) => {
  const o = { label: label + ':' + lane.id, phase: phaseName, schema }
  if (model) o.model = model
  return o
}

phase('Implement')
const impl = await agent(implPrompt, opts('implement', 'Implement', IMPL_SCHEMA, lane.model))
if (!impl) return { lane: lane.id, status: 'implementer-died' }
if (impl.blocked && !impl.commit) return { lane: lane.id, status: 'blocked', impl }

let findings = []
let fix = null
let verify = null
for (let round = 1; round <= 2; round++) {
  if (round === 1) {
    phase('Review')
    const reviews = (await parallel(['correctness', 'security'].map((lens) => () =>
      agent(reviewPrompt(lens), opts('review-' + lens, 'Review', REVIEW_SCHEMA)).then((r) => r && { lens, ...r })))).filter(Boolean)
    findings = reviews.flatMap((r) => r.findings.map((f) => ({ ...f, lens: r.lens })))
    log(lane.id + ': ' + findings.length + ' findings (' + findings.filter((f) => f.severity === 'critical' || f.severity === 'high').length + ' critical/high) from ' + reviews.length + ' reviewers')
    if (reviews.length < 2) log(lane.id + ': only ' + reviews.length + ' of 2 reviewers returned a result')
  } else {
    findings = verify.open.map((o) => ({ ...o, title: o.reason, evidence: 'reported open by the verifier', lens: 'verify' }))
  }
  if (findings.length) {
    phase('Fix')
    fix = await agent(fixPrompt(findings), opts('fix-' + round, 'Fix', FIX_SCHEMA))
  }
  phase('Verify')
  verify = await agent(verifyPrompt(findings, fix), opts('verify-' + round, 'Verify', VERIFY_SCHEMA))
  if (!verify || verify.verdict === 'pass') break
  log(lane.id + ': verification round ' + round + ' failed with ' + verify.open.length + ' open findings')
}
return { lane: lane.id, status: verify ? verify.verdict : 'verifier-died', impl, findings, fix, verify }
