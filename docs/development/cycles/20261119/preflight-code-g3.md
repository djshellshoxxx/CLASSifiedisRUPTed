# Recovery preflight code audit — generation 3

## Source and outcome

- Reviewed candidate: `2917cb4751786bd475df2b34441cb40e1dfbc43f`.
- Candidate tree: `3738fd68754ddd78533572bc78f8d30e8cd6381a`.
- Isolated branch: `codex/preflight-code-g3-20261119`.
- Diff reviewed: `2917cb4^..2917cb4`, with the complete vault and relevant
  domain/storage/envelope callers inspected for context.

No demonstrated source defect or regression blocker was found in this bounded
review. No production or test-suite source was changed. This commit contains an
independent handoff and reproducible native Node evidence only. The integration
owner retains final-source qualification and any remote publication decision;
this worker did not push, open a PR, merge, deploy, delete branches or modify
another worktree.

Read predecessor handoffs `code-audit-g1.md`, `code-audit-g2.md` and
`security-audit-g2.md`. Their findings and test totals are historical evidence,
not new results of this review.

## Standards review

No documented-standard violation was identified in the changed hunks. The
shared helper keeps recovery admission in one place, and the export/restore
call sites explicitly choose their distinct original-validation behavior.
No additional abstraction or style-only patch was warranted. The unchanged
codec registry still captures callable references and binds their original
receiver, preserving class prototype methods and private fields.

The code-review skill's two axes were assessed locally because all available
worker slots were occupied by other independent audits. No separate standards
or specification subagent result is claimed.

## Specification and behavior review

The existing `classrup.vault.alpha_backup/v1` envelope, payload fields, identity
unlock/match checks, signing operation, encryption parameters and scope checks
remain unchanged. Export discards the helper's normalized return value and
signs the captured source records. The helper clones data before parsing and
normalization; validators receive separate clones of both original and recovered
data. The real-crypto probe verified the decrypted and signature-checked records
match the complete original stored rows, including revision and timestamps,
while both callbacks mutate their supplied inputs.

On export, original validation runs before `restoreData` for codecs that have a
normalizer. A rejection stops normalization and returns no backup. Recovered
data is parsed again, its indexes are rebuilt and its canonical key is checked
again before normalized validation. The probe separately confirms rejection at
both validation stages. On restore, original validation is intentionally not
added ahead of normalization, preserving the previous recovery order for data
whose accepted recovered form differs from its stored form.

All records complete preflight before identity wrapping, storage unlocking and
the restore write transaction. The transaction still writes the identity and
all recovered records atomically. A real memory-storage conflict on the second
record demonstrated rollback of the newly staged identity, first record and
rebuilt index. The existing conflicting row retained its full original value.
After removing that conflict, the same vault object successfully retried, with
the same principal/signing identity, original metadata, normalized payloads and
queryable rebuilt indexes.

The class-codec regression retains its private receiver and accepted-method
assertions; only export's expected call sequence changes. The archive regression
now uses the schema-only codec to create a v1 backup with foreign-owner evidence,
so it continues to exercise restore rejection independently of the new production
export rejection. Its destination close/reopen assertion checks persistent
non-initialization, rather than relying only on the immediate failure.

The helper retains structural metadata, supported-type, duplicate-record and
pre-/post-normalization canonical-key checks. Guards bracket asynchronous codec
callbacks, and the existing signature/seal path remains subject to identity and
session revocation. No signature or ownership check was replaced with successful
decryption alone.

## Executed evidence

| Invocation | Result | Scope |
| --- | --- | --- |
| Offline frozen dependency install with scripts disabled | Exit 0; lockfile unchanged | Own-worktree package links verified |
| Native source probe | Exit 0; five named probes completed | Real identity, signing, verification, seal/unseal and memory storage |
| Final `git diff --cached --check` | Exit 0 | Handoff/evidence patch |

The five probe groups cover original-validation rejection ordering, recovered
validation rejection, unchanged signed export evidence, restore-conflict rollback,
and successful retry with a subset backup scope and an additional registered
codec. They are five probe groups, not five Vitest tests, and are not added to
the integration owner's suite counts. The two rejected exports and conflicting
restore are expected rejection assertions inside the passing native run, not
unrecorded failed test invocations.

An initial attempt to launch the probe under `/usr/bin/time -v` exited 127
because that utility is absent. Node did not start for that attempt; its raw
failure is retained separately. A diagnostic `import.meta.resolve` call from
the repository root also exited 1 because that root does not declare a kernel
dependency and the optional parent URL argument was not enabled. The subsequent
direct inspection of the vault package links verified that kernel, identity and
federation resolve to this isolated worktree. Neither setup diagnostic is a
product-test failure or counted as a pass.

See [the evidence receipt](evidence/preflight-code-g3-receipt.json) for exact
commands, source identities and SHA-256 hashes; the native probe source and raw
output are adjacent. No production source changed between review and execution.

## Limits and handoff

This worker did not run the full suite, TypeScript, Vitest, hosted CI, native
browser or IndexedDB. The integration owner separately reported a serial
14-case pass on this candidate; that report is not independently re-counted here.
Conflict rollback was executed on the real memory adapter. Encrypted IndexedDB
rejection/reopen, class private receivers and asynchronous session-close cases
were inspected in the existing focused tests, not rerun by this worker.

Subset compatibility used a current v1 export with one registered type, restored
into a vault with a larger registry. It did not load a saved artifact produced by
a historical binary. Large-vault memory/time behavior, native-browser settlement
and full-database recovery remain outside this evidence.

Codec parsers, indexes and callback closures remain trusted application
composition. The registry freezes accepted method references, not arbitrary
receiver state or retained closure behavior; this review makes no stronger
guarantee. No current production parser transformation defect was found, and no
speculative callback hardening was applied.

Continue with the integration owner's serial combined qualification on the exact
final source. Preserve these bounded results separately from any later source
change, release gate or historical failure record.
