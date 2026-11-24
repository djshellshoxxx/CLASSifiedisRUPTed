# ClassRup — verified attachment metadata admission handoff

Date: 2026-11-23 UTC. Repository: `djshellshoxxx/CLASSifiedisRUPTed`.

## Source and concurrent ownership

Frozen direct parent is draft PR #134, remote head `2e503d9b81286cc72cc8c9984c703273407aa57b`, tree `1271dbf4098bd8354eb5854bac7955e4b6ae8505`. Child branch `codex/classrup-verified-blob-metadata-20261123-t18` was created from that published GitHub commit, without modifying any ancestor or replaying local-only history. Fresh open-PR inspection found #134 the newest PR; no submitted independent reviews or active file owner was identified. Recheck current remote heads before integration. Native git worktree and local product tests remain unavailable on this host: `git ls-remote` failed with `Could not resolve host: github.com`. GitHub Git objects were used without force push.

## Confirmed source-level gap and bounded repair

`verifyStoredBlob`, `readVerifiedBlob` and `readVerifiedBlobBatch` validate canonical digest, length and byte size, but previously could return a blob with impossible adapter metadata (unrecognized privacy class, nonboolean encryption marker, malformed MIME, invalid creation date, or unsafe/negative holder count). New common metadata admission rejects malformed values before asynchronous hashing; each storage-read path rejects malformed adapter metadata before copying bytes. The MIME grammar is aligned with the existing blob-write admission; a persisted timestamp must equal its ISO representation.

This is **shape validation, not authenticity**: SHA-256 only attests stored bytes (encrypted ciphertext if applicable). Metadata, holder strings and parent-record authority are not signed or otherwise proven. This correction is a bounded P1 attachment-manifest prerequisite, **not** a portable manifest, export or import.

One new direct verifier regression covers valid metadata plus eight invalid shapes; three adapter-specific cases cover memory, SQLite and IndexedDB corrupted metadata on single and batch reads. Test source is published but no local Vitest/TypeScript or browser run occurred. Existing signed v1 archive, signing identity, encryption constraints, per-blob 5 MiB, batch 32 item/20 MiB, product caps and test timeouts are unchanged.

## Current qualification and historical failures

Parent PR #134 completed exact-head Alpha [45120627035](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45120627035) and CLI [45120627132](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45120627132) **success**, including domain plan and Ubuntu Node 22/24 jobs; these qualify only #134. Child's own exact-head Alpha/CLI, independent review, and qualified ancestor chain are required before merge. Preserve all failed/incomplete evidence, especially #57 local complete runner exit 137 without report; #56 separate main-push Alpha cancelled; #120 Firefox; #116/#105 and #126 prior failures. Do not rerun unchanged failed/killed suites without a changed condition.

## Fresh distinct reviewer assignments — not completed reviews

1. **Code audit:** resolve final child SHA/tree and current parent; compare metadata grammar with `tx.ts` write admission and three driver get implementations; inspect canonical timestamp behavior (including noncanonical offset cases) and ensure no valid supported MIME is rejected. Run focused typecheck only on a provisioned host and record source and results.
2. **Functional bug hunt:** run the targeted read and batch integration suites serially on memory/SQLite/IndexedDB; check each invalid metadata case and normal reads, lock/reopen, absent vs corrupt refs; preserve actual assertion counts and any setup errors.
3. **Defensive security review:** source-only review of malformed metadata and tenant scope, non-authenticity of holders/metadata, post-await session liveness, trusted canonical parent-record evidence and future signature authority; hardening only, no interrupted reproduction follow-ups. Distinguish static review from runtime product tests.

No independent workers were launchable with current tooling. These are unexecuted assignments, not approvals. No merge while independent review is outstanding.

## Next P1 implementation

Define a **separately versioned signed attachment manifest** tied to authenticated, canonical principal-owned parent-record data and signing authority, not holder labels; then bounded binary transport, destination re-encryption under its own vault key, rollback, verified restore/reopen and v1 record-only compatibility. Never merge incompatible draft #8 wholesale. No release, deployment, force push, deletion, paid external API or unrelated automation changes.
