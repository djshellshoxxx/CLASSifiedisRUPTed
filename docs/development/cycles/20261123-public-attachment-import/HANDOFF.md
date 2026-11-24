# ClassRup — bounded public attachment import (2026-11-23)

## Source and ownership
Parent: draft PR #146, exact remote head `db2c038d5a33ab9437fd88f5cb57c4c896d60df7`. This isolated child is `codex/classrup-public-attachment-import-20261123-t30`. Do not merge local-only histories, PR #8, or independently owned branches.

## Implemented bounded slice
`UnlockedVault.importPublicAttachmentBatch` accepts only an authenticated, fully verified `classrup.vault.attachment_manifest/v1` and a complete P0, unencrypted-source byte batch. Private, P1–P3, or source-encrypted bytes fail closed; no destination-key inference or relabeling plaintext as ciphertext. Incoming bytes are copied, size-bounded and content-address rechecked inside the destination write transaction. Canonical parent records, revisions, digests, codec-derived refs and complete registered record coverage are revalidated in that same transaction, *before* writing. Blob inserts plus canonical-parent-derived holder labels commit together or roll back together. Temporary copies are cleared on exit. Existing v1 signatures, signing identities, 32-item and 20 MiB caps, and timeouts remain unchanged.

This is the **first P0-only import slice**, not complete portable attachment recovery. The production IndexedDB storage adapter encrypts durable rows with its destination-local key. Plain memory and SQLite adapters are not equivalent at-rest encryption guarantees. The new holder labels require corresponding authenticated detach/lifecycle logic before claiming production completion. Source-encrypted and private attachments require a separate, explicitly specified destination encryption/transport key contract. No delivery/lease/rotation recovery has been implemented.

## Qualification, evidence and blockers
Parent #146 Alpha `45222485942` and CLI `45222486074` completed with success at the parent head. They do **not** qualify this branch. Native worktrees and local repository tests remain unavailable: `git ls-remote` failed with `Could not resolve host: github.com`. A one-blob source-to-v1-restore-to-P0-import integration regression was added, but has not been executed locally. Require exact-child Alpha (domain/typecheck/build/browser) and CLI (Node 22/24), and independent code/bug/security review before integration. Do not count queued or incomplete checks as passes. Historical #57 exit 137, #56 cancelled main-push Alpha and past compiler failures are preserved.

## Fresh worker handoffs (pending, NOT approvals)
- Code reviewer: independently inspect the write transaction, admitted byte-copy lifetime, canonical owner recheck, error/rollback paths, exact source SHA, and compatibility with `Storage.transaction` adapters.
- Functional bug hunter: run the new one-blob regression, add a two-blob late conflict rollback test, repeat import/idempotence, stale-owner mutation, encrypted IndexedDB reopen, and private-blob rejection; serial tests only.
- Defensive security reviewer: audit P0-only source admission, content-address TOCTOU, metadata collision/dedup behavior, holder lifecycle, AES-GCM destination row persistence and lock-before-commit. Restrict review to source hardening, not interrupted offensive follow-ups.

Next: resolve any exact-head CI failures; gather genuinely independent reviews; implement and test matching authenticated holder detaches, full rollback/reopen and destination-key contract for private encrypted attachments. No release, deployment, force push, branch deletion or paid APIs.
