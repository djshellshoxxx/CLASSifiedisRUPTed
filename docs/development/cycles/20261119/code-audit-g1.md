# Code audit — generation 1, November 19, 2026

## Source and ownership

- Reviewed PR #56 at `3aa7a17b28ee07ebec4336b49c3527743510bc16` against
  `b6d99d87e9f67e76791f2dfff3e85015154cd92f`.
- Local branch: `codex/classrup-code-audit-20261119`.
- Lifetime contract clarification: `3087c33ce665ad4e94f2c271235b266a90a21473`.
- Blob admission repair: `4323b612b1d4ab72a437619e6e86f196760a005c`.
- The root worker owns integration, publication and current CI qualification.
  This worker did not push, merge, deploy or change existing source branches.

## Findings and repair

### Blob admission reread mutable inputs after asynchronous hashing — repaired

`packages/kernel/src/storage/tx.ts` previously checked the caller's blob input,
hashed a copy of its bytes, then reread the original input after the digest
await. A caller could change the source view, replace the bytes, or change the
tenant, content type, privacy, encryption marker and timestamp during that
interval. Reproduction demonstrated stored bytes disagreeing with their content
address, an unexpected tenant, private plaintext entering SQLite despite its
admission rule, and a deduplicated blob's privacy class being lowered without
that being the originally admitted request. Node `Buffer.slice()` aliasing made
Buffer inputs relevant as well as ordinary `Uint8Array` inputs.

The repair captures the admitted metadata before yielding, treats only literal
`true` as an encryption marker, checks the existing byte cap before copying,
and copies the accepted view with `new Uint8Array`. Hashing, deduplication and
persistence all use that snapshot. It does not change blob formats, addresses,
size caps, privacy ordering, transaction lifetime or existing deduplication rules.

The literal encryption check also closes an independently identified adjacent
case: the old SQLite path accepted `encrypted: 'true'` because admission used
truthiness, then stored `encrypted: false` because persistence used strict
equality. An inline baseline probe confirmed that result; the final regression
rejects four nonboolean truthy markers without storing a row.

The new mutation regression file failed all 12 original tests before the repair,
across memory, fake IndexedDB and SQLite. The final file passes all 13 tests,
including the additional encryption-marker test. This is a bounded storage API
integrity finding; no remote exploit or production data loss was demonstrated.

### Asynchronous callback lifetime statement — clarified

The lifetime guard revokes synchronous callbacks before yielding. For a returned
promise, it revokes when the wrapper observes settlement. A microtask already
queued by an asynchronous callback can run first. A deterministic probe and
three adapter characterizations establish that boundary; retained handles still
fail after transaction completion and before subsequent transactions.

The source contract, README and feature-continuation report now state that
callers must await all transaction work. No artificial delay, promise interception
or weakening of the existing synchronous/late-write guards was introduced.

## PR #56 consolidation review

Reviewed the changed public CLI parser, selected-file caps, descriptor reads,
signature/payload admission, author/listing separation, history-conflict refusal,
deterministic ordering and pagination, snapshot binding, fixed errors and terminal
escaping. Also reviewed the declared-value removal path, state/ownership/hold
checks, public history and malformed paired-price validation.

No additional source regression blocker was identified in that delta. The blob
race predates PR #56. Its local CLI listing suite passed 14/14. This code-review
conclusion does not replace the root worker's exact-source hosted browser/CLI
qualification or repository merge checks.

## Executed validation

| Invocation | Result |
|---|---|
| `node --test tests/cli/listings.test.mjs` on the PR #56 baseline | 14 passed; zero failed/skipped |
| Lifetime file with the new characterizations | 31 passed |
| New blob file before the repair | 12 failed; zero passed |
| Fixed blob + lifetime + shared adapter contract files | 73 passed across three files |
| Final blob file, including invalid encryption markers | 13 passed |
| `git diff --check` | Passed |

Counts are separate, overlapping invocations and must not be summed. Complete
raw output, byte lengths and SHA-256 hashes are retained in
[the validation record](evidence/code-audit-g1-validation.json). No full suite,
typecheck, native browser or hardware qualification is claimed by this worker.

## Independent reviews

Security worker generation 1 reviewed the frozen blob source and tests at
`4323b612b1d4ab72a437619e6e86f196760a005c` and found no blocker. It did not rerun
the authored suite, preserving the root worker's serial qualification plan.

This worker independently reviewed the security worker's tenant-scope allowlist
repair at `c3c2c341c22bcaca113787743523663dfe948088`. Two additional inline Node
probes, using memory and SQLite, supplied throwing getters on extra `tenant`,
`bytes` and `now` metadata fields. Neither probe evaluated those extra getters;
the selected tenant and supplied bytes remained authoritative. No blocker found.

## Handoff to a fresh code-audit worker

1. Start from the latest combined integration source. Confirm these two source
   commits and the separate scope repair are present before repeating work.
2. Review the new backup record-type inventory and diagnostics alongside these
   transaction boundaries; the root worker owns that implementation.
3. Investigate the remaining mutable-reference leads in `recordStore.put` and
   `restore` index tuples, and `migrationStore` input/output rows. These are
   unverified leads, not findings or completed repairs. Check all adapters and
   real callers, reproduce any effect, and coordinate ownership before editing.
4. Keep native browser, full recovery, identity/federation and target-device
   readiness separate from this bounded audit. Preserve the asynchronous
   await-all-work requirement and all existing admission/size/lifetime gates.
