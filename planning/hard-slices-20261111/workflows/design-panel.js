export const meta = {
  name: 'classrup-design-panel',
  description: 'Judge panel: 3 independent designs for one hard slice, 2 judges, 1 synthesis into a final design spec',
  phases: [
    { title: 'Design', detail: 'three designers with distinct lenses' },
    { title: 'Judge', detail: 'two judges score every design' },
    { title: 'Synthesize', detail: 'one final design with acceptance tests' },
  ],
}
// args: { slice, title, goal, constraints, maps: [paths], brief: path, out: dir, lenses: [3 strings] }
const a = args
const ROOT = '/home/user/CLASSifiedisRUPTed'
const read = `Read first, completely: ${a.brief} and these subsystem maps: ${a.maps.join(', ')}. Then read the repository source files the maps point to for anything you rely on (repository at ${ROOT}). Do not modify repository files.`
const DESIGN_SCHEMA = { type: 'object', properties: { path: { type: 'string' }, summary: { type: 'string' } }, required: ['path', 'summary'] }
const JUDGE_SCHEMA = {
  type: 'object',
  properties: {
    scores: { type: 'array', items: { type: 'object', properties: { design: { type: 'string' }, correctness: { type: 'number' }, security: { type: 'number' }, fit: { type: 'number' }, testability: { type: 'number' }, total: { type: 'number' }, critique: { type: 'string' } }, required: ['design', 'total', 'critique'] } },
    winner: { type: 'string' },
    must_fix: { type: 'array', items: { type: 'string' } },
    best_ideas_from_others: { type: 'array', items: { type: 'string' } },
  },
  required: ['scores', 'winner', 'must_fix', 'best_ideas_from_others'],
}
phase('Design')
const designs = await parallel(a.lenses.map((lens, i) => () => agent(
`You are designer ${i + 1} of 3 for slice ${a.slice} (${a.title}) of ClassRup. Your lens: ${lens}.
${read}
GOAL: ${a.goal}
HARD CONSTRAINTS: ${a.constraints}
Produce a complete, implementation-ready design document (Markdown, 1500-3500 words) at ${a.out}/design-${a.slice}-${i + 1}.md with sections: 1 Summary and scope (MVP vs deferred, each deferral justified); 2 Data model and on-disk/statement formats (exact JSON shapes, versioned type names, size bounds); 3 Algorithms and state machines (states, transitions, guards, timeouts, terminal states; complexity); 4 Public API (exact TypeScript signatures, file paths, how it composes with existing code; migration/compatibility with existing alpha formats); 5 Threat model and failure handling (adversarial cases, replay, forks, clock, resource bounds, what freezes vs rejects, typed error codes); 6 Test plan (numbered test cases with expected results: unit, property-based with fast-check, integration, negative/abuse; which module.spec.yaml requirement IDs they cover); 7 Open questions resolved with your recommended default and rationale (no TBDs left); 8 Honest limits (what the design does not establish). Prefer reusing existing primitives (envelope, seal/unseal, kernel tx/repo/leases/migrations) over new ones. Cite file:line for every existing API you depend on. Return JSON {path, summary}.`,
  { label: `design:${a.slice}:${i + 1}`, phase: 'Design', schema: DESIGN_SCHEMA })))
const ok = designs.filter(Boolean)
log(`${ok.length}/3 designs for ${a.slice}`)
phase('Judge')
const judges = await parallel([0, 1].map(j => () => agent(
`You are judge ${j + 1} of 2 for slice ${a.slice} (${a.title}). ${read}
GOAL: ${a.goal}
HARD CONSTRAINTS: ${a.constraints}
Read these candidate designs completely: ${ok.map(d => d.path).join(', ')}.
${j === 0 ? 'Judge primarily as an adversarial security reviewer: try to break each design (replay, forks, downgrade, partial failure, clock skew, resource exhaustion, key compromise, data leakage), and check that the design is honest about limits.' : 'Judge primarily as the implementing engineer: can this be built on the existing kernel/vault/federation/mutiny code exactly as described, with the stated tests, without breaking existing alpha formats and tests; is it the simplest correct design; are the file-level APIs concrete.'}
Score each design 0-10 on correctness, security, fit-with-existing-code, testability; total = sum. Name the winner, list must_fix items the winner needs before implementation, and the best ideas from the other designs worth grafting in. Be specific and cite file paths.`,
  { label: `judge:${a.slice}:${j + 1}`, phase: 'Judge', schema: JUDGE_SCHEMA })))
const jk = judges.filter(Boolean)
phase('Synthesize')
const final = await agent(
`You are the synthesizer for slice ${a.slice} (${a.title}). ${read}
GOAL: ${a.goal}
HARD CONSTRAINTS: ${a.constraints}
Candidate designs: ${ok.map(d => d.path).join(', ')}.
Judge verdicts (JSON): ${JSON.stringify(jk)}.
Write the FINAL design at ${a.out}/DESIGN-${a.slice}.md: start from the winning design, apply every must_fix, graft the best ideas, and resolve any disagreement between judges with an explicit decision and rationale. The final document must be self-contained (an implementer reads only it plus the brief and maps), with the same eight sections, exact TypeScript signatures and file paths, exact statement/record formats, a numbered test plan (each test with expected result and the spec requirement IDs it covers), an ordered implementation plan (small reviewable steps, test first), and a short 'Interface contract for other slices' section listing exactly what other slices may call. No TBD/TODO/placeholder words. Return JSON {path, summary}.`,
  { label: `synthesize:${a.slice}`, phase: 'Synthesize', schema: DESIGN_SCHEMA })
return { slice: a.slice, final, designs: ok, judges: jk }
