# Security and consolidation review — 2026-11-16

## Evidence boundary

This is a source and branch-ancestry review, not a completed full-code audit, penetration test or release certification. The runnable baseline reviewed for consolidation is `d16abee`; the working integration branch had reached `bb1f4b8` when this documentation worktree was created. Concurrent implementation changes and their test results must be recorded separately against their final commit.

Five historical root security audits and the 51-row `planning/SECURITY_FINDINGS_TRACKER.md` are preserved byte-for-byte from `claude/wonderful-cori-ynhlsb` at `3a5c9e3`. They inspected planning-only trees. All 51 findings remain OPEN in that historical tracker; copying contracts or writing tests for unrelated code does not close them. Its provisional gates and owner assignments remain source proposals, not evidence of independently approved controls. A snapshot of newer contract drafts is under `docs/security-planning/20261116/` to prevent silent replacement of existing implementation contracts.

## Confirmed continuation issues and limits

| Item | Evidence and required follow-through |
|---|---|
| Backup codec evolution | November 11 handoff records that `packages/vault/src/vault.ts` requires exact equality between backup types and active codecs. New codecs prevent older restores. Qualify a fix with old-format/new-runtime coverage while rejecting unknown or incompatible backup types. |
| Partial module integrations | Parked lanes add internal code but generally lack public package exports and PWA wiring. Passing isolated tests does not demonstrate a usable feature. |
| Confidentiality at rest | Baseline project status records unencrypted IndexedDB domain records; encrypted signing keys and export backups do not encrypt these domain records. Encryption and recovery require their own verification. |
| Unimplemented sensitive workflows | Baseline status and pause handoff identify missing commerce, private messaging, identity recovery and canonical federation delivery. Do not represent the presence of specs as implemented security controls. |
| Test traceability | Baseline has 33 specification warnings. Test IDs and generated counts are useful bookkeeping but require assertion-level review before being treated as acceptance evidence. |
| Browser/platform evidence | Previously passing CI only applies to the recorded head. A new combined tree requires new browser/platform evidence; no accessibility manual review is claimed. |

## Newer security/platform checkpoint review

Source: `claude/bold-mccarthy-qklhl6` at `a403614`, a WIP checkpoint. Compared with the runnable baseline's common ancestor it changes 1,914 files, much of it generated specification reconciliation. A wholesale merge would mix substantial contract changes with incomplete runtime code.

| Candidate | Concrete source | Assessment |
|---|---|---|
| Public identifier privacy | `packages/kernel/src/ids/uuidv7.ts`, `validation/schemas.ts` | Adds hour-floored public UUIDv7 generators/validators and CID shape checks. Candidate for a small independent change after clock-domain, boundary, malformed-input and public-payload compatibility tests. Does not remove linkability from existing IDs automatically. |
| Blob verification/tenant limits | `packages/kernel/src/storage/ports.ts`, storage driver/transaction changes | Adds injected image-verifier and tenant/local-limit ports. Requires consistent memory/IndexedDB behavior and transaction/rollback tests; interface presence alone does not enforce a production boundary. |
| Feature registry | `packages/platform/src/configuration/feature/` | Adds dependency graph, hashing and generation pipeline. `registry.ts` imports `registry.generated.ts`, which is absent from this checkpoint's Git tree. Supply generation inputs/output and tests before integrating. |
| Secret lifecycle | `packages/security/src/authz/secrets/` | Adds environment/file ports, loader, redaction and token helpers. Production file adapters, permission/symlink behavior and rotation overlap need independent verification. No colocated test files were found in the checkpoint's security package. |
| Signing/strict JSON | `packages/security/src/cryptography/signatures/` | Adds JCS, duplicate-key rejection, DID/Ed25519/envelope primitives. Requires positive/negative vectors, bounds checks, dependency verification and callers; do not substitute it into existing signatures without compatibility evidence. |
| Security package exports | `packages/security/src/index.ts` | Imports `authz/index.ts` and `cryptography/index.ts`; both are absent from this checkpoint's Git tree. It is not a complete importable security package as committed. |

No candidate above is declared safe or complete merely from this review. The bounded identifier helpers are the smallest prospective port; secret/signature modules need substantially stronger qualification. The loop-based comparison helper's “constant-time” comment is not proof of timing guarantees in a JavaScript runtime.

## Remaining feature inventory

This inventory identifies known unfinished areas; it is not a promise that these are the only missing requirements among 148 specified modules.

- Finish review, public exports and end-to-end application wiring for coarse filtering, privacy classification/metadata, governance, moderation and notifications. Ranking/i18n are already part of `d16abee`, but the PWA still has an English interface at that baseline.
- Implement purchase offers and negotiation; sell/wanted/giveaway-specific terms; noncustodial payment claims, cash evidence and receipts.
- Implement private messaging and threads, trade/privacy consent capture and revocation, safe-meetup workflows, and cycle execution/recovery.
- Implement moderation flags, evidence access and spam workflows beyond the parked antifraud helpers.
- Implement encrypted domain storage, identity/device rotation and recovery, canonical federation streams, relay delivery, import preflight and recovery compatibility.
- Continue services, auctions, rentals, reputation, retention/deletion/export, operations and other specified modules not demonstrated by the local alpha. Their individual completion must be measured from actual code and tests.
- Reconcile the 51 planning findings with runtime control owners and negative tests. Keep governance/operational requirements separate from code-only remediation.
- Complete regression, browser, platform and manual accessibility qualification before a release claim.

The prior generated status reported 14/148 modules with runtime code at the November 11 consolidation and 5/688 exact specified command/query names. Those are historical figures, not current percentages. Regenerate status on the final merged implementation and inspect the methodology rather than extrapolate project completion from branch count.

## Reproducing this review

Use `git for-each-ref refs/remotes/origin`, `git rev-list --left-right --count <baseline>...<branch>`, `git merge-base --is-ancestor`, and `git diff <baseline>...<branch> -- packages` to distinguish inherited from unique code. Use `git cat-file -e <ref>:<path>` to verify checkpoint dependencies. The documentation-only verification for this change checks byte identity of preserved sources, tracker row count and whitespace; no runtime checks are claimed for it.
