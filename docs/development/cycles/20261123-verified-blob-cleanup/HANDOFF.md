# ClassRup verification scratch-byte lifetime — engineering handoff
Date: 2026-11-23 UTC. Direct remote parent: PR #144, commit `5ba6edc83c441cd7cb9a826b9e6e7d4ec6f5cc9a`, tree `1d999ea7bfea125cfff69b57cbb4eed042cec996`. The published child branch is `codex/classrup-verified-blob-cleanup-20261123-t28`; see its PR checkpoint for its actual commit/tree IDs. This is an independently bounded byte-lifetime correction, not a destination attachment importer.

## Confirmed source finding and remediation
Prior code returned verified blob bytes but left the earlier detached read copy uncleared on successful reads. On a direct verification digest mismatch, the newly allocated verification copy likewise remained uncleared. In batch reads, an earlier copied member remained uncleared if a later member failed while still inside the snapshot transaction. All three paths could retain transient private/ciphertext bytes until GC; none by itself proves exfiltration or an external attacker capability.

This candidate (1) wipes verification-owned bytes on a digest error, (2) wipes the single-read intermediate copy on any completion, and (3) retains batch snapshots in a reachable local array so a later missing/corrupt member or verification failure can wipe all partial copies and all verified prefixes before returning or rethrowing. The verified successful output bytes remain owned by the caller, and adapter-owned source rows are not wiped. It preserves read snapshot, SHA-256, canonical refs, tenant isolation, product caps and existing signature/encryption contracts.

## Qualification and successor tasks
- A focused new integration regression checks digest rejection, detached source survival, single/batch intermediate clearing and late batch failure. Test files are source additions, not evidence they passed.
- Hosted exact-child Alpha (domain, TypeScript, static/build, browser) and CLI are REQUIRED. Native git worktrees could not be formed here: `git ls-remote` returned `Could not resolve host: github.com` on November 23. No local product test claim. Parent #144 exact Alpha/CLI completed successfully, but neither qualifies this child.
- Fresh independent **code-audit**: inspect copied-array ownership, `finally` paths and transaction success/exception behavior on the child's SHA. Provide exact source identity, discovered issues and tests.
- Fresh independent **functional bug-hunt**: run focused + full gates, mutate later batch members, confirm successful reads preserve output, and check memory/SQLite/IndexedDB retry paths.
- Fresh independent **defensive security review**: focus only on privacy-sensitive scratch-buffer retention, malformed/scalar metadata, fail-closed hashing and ownership/authenticated transport boundaries. Do not resume interrupted offensive reproduction.
- None of the three independent assignments is complete or an approval. Keep all historical failed/killed/queued checks (especially #57 exit 137, #140/#141 initial compiler failures, #56 cancelled main Alpha) as separate evidence.
- Next major P1 feature after this correction: reconcile byte admission with a fresh destination write-transaction owner check, authenticated holder lifecycle, destination re-encryption, rollback and encrypted reopen. Until those contracts exist, **do not** label metadata/byte verification as portable attachment recovery or deploy this work.

No release/deploy/force push/branch deletion or changes to older paused/unrelated automations. Do not merge without child-specific gates and independent reviews plus qualified ancestor chain.
