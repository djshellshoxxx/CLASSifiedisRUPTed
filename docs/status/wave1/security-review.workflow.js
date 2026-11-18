export const meta = {
  name: 'classrup-security-review',
  description: 'Independent security and privacy review of the existing ClassRup alpha code: five lenses find, then each finding is reproduced or refuted',
  phases: [
    { title: 'Find', detail: 'five independent lenses over the existing alpha code' },
    { title: 'Reproduce', detail: 'each finding is proven with a runnable test or refuted' },
  ],
}

const WT = '<WORKTREES_DIR>/secreview' // detached worktree at the integration head
const PRIOR = '<path to a copy of docs/audits/CHATGPT_RANDOM_AUDIT_LEDGER.md from pull request 14>'

const CTX = [
  'PROJECT: ClassRup (CLASSifiedisRUPTed), a local-first classifieds and barter PWA. TypeScript pnpm monorepo, Node 22, Vitest. Every domain module runs in the user browser vault (IndexedDB); identity is a user-held Ed25519 key (did:key); other parties are reached only through signed statements exchanged as files; relays are optional and never authoritative (planning/adr/ADR-0016.md). Trust boundaries are stated in PROJECT_SPEC.md.',
  'CHECKOUT: ' + WT + ' (detached at the integration head, dependencies installed). Run every shell command as: cd ' + WT + ' && <command>. Use absolute paths with file tools.',
  'OFF LIMITS: never read or change anything outside this checkout: not the session working directory and not another worktree. Never push, never commit. Never run browser tests, pnpm dev, pnpm preview or playwright.',
  'PRIOR WORK, read it first so you do not repeat it: planning/verification-foundation.md and planning/verification-mutiny.md in the checkout (earlier independent reviews), planning/LOCAL_ALPHA_20261109.md (known limits), and ' + PRIOR + ' (another lane read-only audit ledger). Known and already documented limits are NOT findings: local domain records are plaintext in IndexedDB; backup scope is partial; no device rotation or recovery; reservations are local only; the alpha statement types are experimental.',
].join('\n')

const LENSES = [
  { key: 'statements', scope: 'packages/federation/src/envelope.ts, packages/discovery/src/search/index.ts, packages/bazaar/src/listings/index.ts, packages/mutiny/src (all), tests/integration',
    ask: 'Signed-statement trust. Can a statement be accepted that its claimed author did not sign, or whose signer is not the party entitled to make it? Replay of old statements, sequence and prev-chain handling, same-revision forks, tombstone targeting, subject or owner substitution, canonical JSON edge cases (duplicate keys, unicode normalization, number forms), size limits, expiry and clock handling, statements for one listing or proposal applied to another. In mutiny: consent bound to the exact proposal digest, revision invalidation, dropout, double acceptance, reservation release, a participant impersonating another, restart or restore paths that trust cached state.' },
  { key: 'vault-crypto', scope: 'packages/vault/src, packages/identity/src, packages/security/src, packages/kernel/src/storage (IndexedDB adapter and browser entry), packages/kernel/src/browser.ts',
    ask: 'Key and vault handling. KDF parameters and salt handling, nonce or IV generation and reuse, AEAD associated data binding (can ciphertext be swapped between vaults, fields or versions), key wrapping, what remains in memory or storage after lock, wrong-passphrase behaviour, backup export and restore (atomicity, validation before write, downgrade or version confusion, restoring into a non-empty vault, principal mismatch), concurrent tabs and the writer lock, vault name handling, error messages that leak secrets.' },
  { key: 'pwa', scope: 'apps/pwa (index.html, src/main.ts, src/barter.ts, src/barter-runtime.ts, public/sw.js, public/manifest.webmanifest, public/styles.css), tests/browser',
    ask: 'Browser surface. DOM injection from peer-controlled data (titles, descriptions, tags, DIDs, error text) through innerHTML, attributes, URLs or CSS; untrusted file import (size limits, deep or huge JSON, prototype pollution, type confusion after JSON.parse); download handling; the service worker (cache scope, what is cached, cache poisoning, update and stale-asset behaviour, navigation fallback); absence or weakness of Content-Security-Policy and related protections for a statically hosted app; passphrase handling in forms; state left visible after lock; race conditions between UI actions; the no-script guard.' },
  { key: 'kernel-cli', scope: 'packages/kernel/src/http, packages/kernel/src/bus, packages/kernel/src/storage/sqlite.ts, packages/kernel/src/sync, packages/kernel/src/outbox, packages/kernel/src/observability, packages/kernel/src/node.ts, tools/cli/classrup.mjs, tests/cli',
    ask: 'Kernel surfaces and the CLI. Relay HTTP handler: authentication and relay access tokens, authorization order, tenant isolation, request size and timeout limits, header and method handling, error bodies leaking internals, idempotency-key abuse, rate limiting defaults. SQLite adapter: injection through identifiers or values, unbounded queries. Sync and outbox: poisoning, unbounded retries, cross-tenant leakage. Redaction gaps in logs and diagnostics export. CLI: path traversal, symlink handling, argument or config injection, what the dev and preview servers bind to and serve (directory listing, dotfiles, traversal outside dist, missing security headers), config file permissions.' },
  { key: 'privacy', scope: 'whole checkout, with PROJECT_SPEC.md and planning/contracts/CTR-PRV-001.md as the yardstick',
    ask: 'Privacy and metadata. Trace every byte that can leave a vault: signed listing files, tombstones, proposals, reservations, consents, backups, downloads, diagnostics export, log lines. Look for private notes, exact inventory, precise location (anything finer than the documented coarse cell), timestamps that reveal more than needed, stable identifiers that correlate a user across contexts beyond what the spec accepts, data kept after unpublish, archive or lock, and anything the UI promises about privacy that the code does not keep.' },
]

const FINDINGS = { type: 'object', required: ['findings'], properties: { findings: { type: 'array', items: { type: 'object',
  required: ['title', 'severity', 'file', 'claim', 'path', 'impact', 'fix'], properties: {
    title: { type: 'string' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
    file: { type: 'string' }, line: { type: 'integer' },
    claim: { type: 'string', description: 'the defect, stated precisely' },
    path: { type: 'string', description: 'the concrete steps or inputs that trigger it' },
    impact: { type: 'string' }, fix: { type: 'string' } } } }, coverage: { type: 'string', description: 'what you read and what you did not get to' } } }

const VERDICT = { type: 'object', required: ['confirmed', 'severity', 'reasoning'], properties: {
  confirmed: { type: 'boolean' }, severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'none'] },
  reasoning: { type: 'string' },
  reproTestPath: { type: 'string', description: 'repo-relative path where the regression test should live' },
  reproTestSource: { type: 'string', description: 'complete source of a test that FAILS on the current code because of this defect and would pass once fixed' },
  reproOutput: { type: 'string', description: 'the relevant test output you observed' },
  alreadyKnown: { type: 'boolean', description: 'true if prior work already documents this' } } }

const findPrompt = (lens) => [CTX, '',
  'ROLE: security reviewer, lens "' + lens.key + '". Scope: ' + lens.scope + '.',
  lens.ask,
  'Read the code in scope in full before judging. Report at most 8 findings, the most serious first. Each must name the file and line, the exact triggering path, and the impact. Do not report documented limits, style, or hypotheticals you cannot tie to a concrete code path. If you find nothing real, return an empty list and say what you covered.'].join('\n')

const verifyPrompt = (lens, f, i) => [CTX, '',
  'ROLE: skeptical verifier. A reviewer (lens "' + lens.key + '") claims the defect below. Your job is to refute it or prove it. Default to confirmed=false when you cannot demonstrate it.',
  'Read the cited code and its callers. Then try to reproduce: write a test under tests/integration or next to the code, named zz-secreview-' + lens.key + '-' + i + '.test.ts (or .test.mjs under tests/cli for CLI issues, run with node --test), that fails on the current code because of the defect. Run it with corepack pnpm vitest run <path> --maxWorkers=2 and record the output. For a browser-only issue where no unit test is possible, give the exact code path line by line instead and say so.',
  'A confirmed finding needs either an observed failing test or an airtight code path. Re-rate the severity yourself: critical = authorization, integrity or confidentiality break exploitable by a peer or a hostile file; high = same with a meaningful precondition; medium = defence-in-depth gap or limited impact; low = minor.',
  'Before finishing delete the temporary test file: git status --short must print nothing. Return the complete test source in reproTestSource so it can be added later as a regression test.',
  'CLAIM:', JSON.stringify(f, null, 1)].join('\n')

const results = await pipeline(LENSES,
  (lens) => agent(findPrompt(lens), { label: 'find:' + lens.key, phase: 'Find', schema: FINDINGS }),
  async (found, lens) => {
    if (!found) return { lens: lens.key, error: 'finder returned nothing', findings: [] }
    log(lens.key + ': ' + found.findings.length + ' claims to verify')
    const out = []
    for (let i = 0; i < found.findings.length; i++) {
      const f = found.findings[i]
      const v = await agent(verifyPrompt(lens, f, i + 1), { label: 'verify:' + lens.key + ':' + (i + 1), phase: 'Reproduce', schema: VERDICT })
      out.push({ ...f, lens: lens.key, verdict: v })
    }
    return { lens: lens.key, coverage: found.coverage, findings: out }
  })

const all = results.filter(Boolean).flatMap((r) => r.findings)
const confirmed = all.filter((f) => f.verdict && f.verdict.confirmed)
log('security review: ' + all.length + ' claims, ' + confirmed.length + ' confirmed')
return { claims: all.length, confirmed, refuted: all.filter((f) => !f.verdict || !f.verdict.confirmed).map((f) => ({ lens: f.lens, title: f.title, why: f.verdict ? f.verdict.reasoning : 'verifier returned nothing' })), coverage: results.filter(Boolean).map((r) => ({ lens: r.lens, coverage: r.coverage, error: r.error })) }
