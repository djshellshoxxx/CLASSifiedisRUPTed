# ClassRup — existing public attachment integrity handoff (2026-11-23)

## Source ownership and precise parent
Direct parent: draft PR #147 `codex/classrup-public-attachment-import-20261123-t30`, observed head `b69aabe23acd25064c4859c421cfce8ae11c7f88`, tree `2604787af6b5edcff53a217a246f2ef53cac03f1`. New isolated child branch: `codex/classrup-existing-blob-integrity-20261123-t31`; do not rewrite, squash or integrate a local-only history into its published counterpart. Review the child’s live head and tree after publishing, as authored SHAs can change.

## Source-confirmed finding and bounded correction
`importPublicAttachmentBatch()` already authenticates the manifest, verifies incoming bytes, revalidates destination parents and refuses conflicting privacy/metadata. But its existing-P0-blob path calls `tx.blobs.info` and then `tx.blobs.put`. The kernel deduplication path returns a matching existing content-addressed row without independently rehashing the bytes stored under that address. A damaged stored row with matching metadata could therefore be attached as successfully recovered content. This is a source-level integrity gap, not an observed remote exploit.

Inside the same destination write transaction, the child additionally reads an existing matching-metadata blob, copies its bytes, verifies the stored content address, guards session liveness and clears only its private scratch copy. Failure throws, allowing the existing transaction rollback; no silent overwrite, integrity bypass or privacy downgrade. The new test seeds a corrupted low-level memory-driver snapshot (an impossible state through normal blob put), confirms fail-closed/no holder attachment, and separately tests legitimate existing bytes and repeated idempotent import. No code touches legacy signed v1 backups, identity/signing, 32-link/32-blob, 5 MiB/20 MiB, timeout, or product limits.

## Qualification and unfinished gates
At the start of this cycle, exact-head parent PR #147 Alpha `45233160619` and CLI `45233160682` were both observed completed/successful. These are **parent-only** results. Child code and tests were published via GitHub Git objects because native `git ls-remote` failed to resolve github.com; local full typecheck, product tests, browser journeys and native worktrees could not execute. Child CI and independent reviews must be checked at the current child head; do not label draft, queued, failing or partial results passing. The original 2026-11-19 full-suite exit 137 and all previous failures/incomplete checks remain separate.

## Next fresh review assignments (not performed or approved)
- Independent code audit: inspect source-level byte hashing under transaction, adapter read semantics, scratch-copy zeroization, exact ref/tree, and transaction rollback on corruption. Check whether any metadata or format drift weakens admission.
- Functional bug hunt: execute the two new tests and existing P0 import, two-blob rollback, stale destination-owner, encrypted IndexedDB reopen and idempotence cases serially. Distinguish setup errors from executed product tests.
- Defensive security review: focus on non-destructive corrupt-row detection, privacy-downgrade refusal, authorized holder lifecycle, transaction liveness and destination encryption. Do not resume interrupted offensive reproduction.
All three remain pending unless actual separate reviews and evidence are recorded. No independent agent service was available during this invocation.

Next substantive milestone: matching authenticated holder detach/record lifecycle and the explicit private/source-encrypted destination-key contract, followed by transaction rollback/encrypted reopen acceptance. Do not merge before child exact-head required gates and genuine independent review, nor release, deploy, force-push, delete branches or consume paid APIs.
