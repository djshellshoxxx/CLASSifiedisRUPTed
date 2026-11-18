export const meta = {
  name: 'classrup-judge-synth',
  description: 'Judge already-written candidate designs for one hard slice with two judges, then synthesize the final design spec',
  phases: [
    { title: 'Judge', detail: 'two judges score every candidate design' },
    { title: 'Synthesize', detail: 'one final design with acceptance tests' },
  ],
}
// args: { slice, title, goal, constraints, designs: [paths], maps: [paths], brief: path, out: dir }
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
phase('Judge')
const judges = await parallel([0, 1].map(j => () => agent(
`You are judge ${j + 1} of 2 for slice ${a.slice} (${a.title}). ${read}
GOAL: ${a.goal}
HARD CONSTRAINTS: ${a.constraints}
Read these candidate designs completely: ${a.designs.join(', ')}.
${j === 0 ? 'Judge primarily as an adversarial security reviewer: try to break each design (replay, forks, downgrade, partial failure, clock skew, resource exhaustion, key compromise, data leakage), and check that the design is honest about limits.' : 'Judge primarily as the implementing engineer: can this be built on the existing kernel/vault/federation/mutiny code exactly as described, with the stated tests, without breaking existing alpha formats and tests; is it the simplest correct design; are the file-level APIs concrete.'}
Score each design 0-10 on correctness, security, fit-with-existing-code, testability; total = sum. Name the winner, list must_fix items the winner needs before implementation, and the best ideas from the other designs worth grafting in. Be specific and cite file paths.`,
  { label: `judge:${a.slice}:${j + 1}`, phase: 'Judge', schema: JUDGE_SCHEMA })))
const jk = judges.filter(Boolean)
log(`${jk.length}/2 judges for ${a.slice}`)
phase('Synthesize')
const final = await agent(
`You are the synthesizer for slice ${a.slice} (${a.title}). ${read}
GOAL: ${a.goal}
HARD CONSTRAINTS: ${a.constraints}
Candidate designs: ${a.designs.join(', ')}.
Judge verdicts (JSON): ${JSON.stringify(jk)}.
Write the FINAL design at ${a.out}/DESIGN-${a.slice}.md: start from the winning design, apply every must_fix, graft the best ideas, and resolve any disagreement between judges with an explicit decision and rationale. The final document must be self-contained (an implementer reads only it plus the brief and maps), with sections: 1 Summary and scope; 2 Data model and on-disk/statement formats (exact JSON shapes, versioned type names, size bounds); 3 Algorithms and state machines; 4 Public API (exact TypeScript signatures and file paths; composition with existing code; migration/compatibility); 5 Threat model and failure handling (typed error codes; what freezes vs rejects); 6 Numbered test plan (each test: level, expected result, spec requirement IDs covered, the TEST-PS-NNN-09.Tnn id to put in the title, and which spec rows must be appended); 7 Ordered implementation plan (small reviewable steps, test first); 8 Honest limits; 9 Interface contract for other slices (exactly what other slices may call or must not assume). No TBD/TODO/placeholder words. Return JSON {path, summary}.`,
  { label: `synthesize:${a.slice}`, phase: 'Synthesize', schema: DESIGN_SCHEMA })
return { slice: a.slice, final, judges: jk }
