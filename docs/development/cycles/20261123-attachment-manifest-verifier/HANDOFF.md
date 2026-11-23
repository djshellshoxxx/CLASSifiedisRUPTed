# ClassRup P1 attachment-manifest receiver verification — handoff

2026-11-23 UTC. Direct parent draft PR #140 at `83230ec04af2de74901d936ff70dabb050564abf` (tree `a5d2bbe62e474038823a4bf3f078972f829e5c80`) was observed unchanged before this isolated continuation. Native Git checkout/worktrees could not be created: the host still reports `Could not resolve host: github.com`. A separate child branch was created from the exact published parent through authenticated GitHub Git objects. No local-only commit history was merged; ancestors and main were not modified.

## Source delta and scope

- Add `verifySealedAttachmentManifest(sealed, passphrase, expectedPrincipal)`, a **read-only** receiver preflight for the separately versioned `classrup.vault.attachment_manifest/v1` format.
- Decrypt with existing scrypt/XChaCha policy, zero the detached plaintext in all paths, cap decoded envelope bytes, verify Ed25519 author/CID/signature and exact type using the unchanged federation verifier.
- Treat `expectedPrincipal` as trusted caller input, never as authority from the artifact. Reject unknown fields, empty/duplicate/unsorted parents, invalid keys/revisions/digests, malformed or duplicate reference/metadata rows, orphan or missing blobs, noncanonical timestamps/MIME/privacy, and aggregate overflows. Preserve 32 links/unique refs, 5 MiB/blob and 20 MiB aggregate.
- Return frozen parsed metadata. NO attachment bytes are imported or exported, no stored parent identity is rechecked, no destination write/rollback/re-encryption/reopen has been implemented. A signed metadata reference does not prove actual attachment content or destination ownership.
- Add a focused structural-negative test matrix and one signed+sealed valid-envelope test. These are **test source only** until CI executes at this new head. Do not claim local product test execution.

## Qualification and historical context

Parent #140 exact-head [Alpha 45169943207](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45169943207) and [CLI 45169943149](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45169943149) both completed success (all required jobs); these results qualify parent code only. The first #140 Alpha 45169663837 failed TypeScript and stays failed. #57's killed local domain runner exit 137 stays incomplete. #56's separately cancelled main-push Alpha 44658477772 stays cancelled; its CLI 44658477821 succeeded. All earlier signed-v1, production record codec and identity contracts remain unchanged.

Current child requires full exact-head Alpha+CLI qualification and three genuinely independent reviews before integration. Do not equate code inspection or planned workers with executed testing or review approval.

## Next fresh worker assignments

1. **Code audit (new independent worker):** inspect exact child and parent manifests; verify parser's byte cap, canonical ordering, independent blob/ref sets, envelope signature/author/type checks, no mutation of source and no destabilization of v1. Check `validateAttachmentManifestPayload` remains internal, structurally validating only.
2. **Functional bug hunt (new independent worker):** run focused tests plus complete current-source Alpha/CLI, test valid production `exportAttachmentManifest` output through new receiver and encrypted IndexedDB reopen. Check wrong author/passphrase, orphan refs, duplicate parents, old v1 refusal and unchanged normal restore.
3. **Defensive security review (new independent worker):** analyze source-only authenticated parsing, hostile schema/metadata, unbounded allocations, session/identity boundary, decode and plaintext clearing. Do not resume interrupted reproduction follow-ups or perform offensive runtime work.

No separate workers could be launched by the available connector in this invocation, and zero independent approvals were reported. Fresh reviewers must leave exact SHAs, commands, executed/failed results, residual risks and successor handoffs. No release, deployment, force push, branch deletion, paid external API, or unrelated automation change is authorized.

## Subsequent P1 slice

Bind a verified manifest against **actual recovered destination canonical records** and production codec-derived refs in one principal-scoped snapshot, then introduce bounded ciphertext transport and fully atomic destination re-encryption/rollback/reopen as separately qualified changes. Never treat this metadata preflight alone as portable recovery.
