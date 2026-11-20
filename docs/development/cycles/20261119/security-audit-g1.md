# Security audit — generation 1, November 19, 2026

## Source and outcome

Repository: `djshellshoxxx/CLASSifiedisRUPTed`.
Reviewed baseline: `3aa7a17b28ee07ebec4336b49c3527743510bc16` (PR #56).
Isolated branch: `codex/classrup-security-audit-20261119`.
Scope repair: `c3c2c341c22bcaca113787743523663dfe948088`.

This bounded review repaired a tenant-confinement defect in the storage scope,
rechecked the current dependency advisory result, and independently reviewed the
adjacent blob snapshot correction owned by the code-audit worker. It does not
establish complete product or release security. No remote branch, deployment,
release, dependency version, protocol format, or cryptographic key was changed
by this worker.

## Reproduced and repaired: blob metadata overrides scoped authority

**Assessment:** medium-impact storage API confinement defect, with limited
observed exposure. No current PWA or application request path forwarding
untrusted metadata to `ctx.tx.blobs.put` was found. The proof exercises the real
storage API; it is not evidence of an exposed remote exploit.

`packages/kernel/src/storage/scope.ts` previously passed
`{ tenant: o.tenantId, bytes, ...meta, now: o.clock.now() }` to the underlying
blob store. A structurally compatible metadata object could carry additional
`tenant` and `bytes` fields. These fields replaced the scope's tenant and the
explicit byte argument. TypeScript accepts such an object through a variable;
the regression does not need a type assertion.

Two independent consequences were reproduced before editing the implementation:

- An operation in tenant A stored the alternate metadata bytes in tenant B,
  instead of storing the supplied bytes in A.
- When B already held the same blob privately, A could supply `tenant: B` with
  public metadata and lower B's recorded privacy class. This changes the stored
  classification; it does not demonstrate decryption of ciphertext.

The correction explicitly copies only `contentType`, `privacy`, and the optional
`encrypted` flag from metadata. The scope continues to supply tenant, bytes, and
clock. Existing accepted metadata behavior is preserved.

The unchanged regression file failed **2 of 3** assertions against the original
implementation. With the repair, the scope tests and shared storage contracts
passed **33 of 33**, with no failed or pending assertions. The contract suite
ran memory, SQLite, and fake IndexedDB adapters. These are API/adapter results,
not native browser qualification.

The separate code-audit worker reviewed this commit without a blocking finding
and reported two additional Node probes, on memory and SQLite, showing that
unexpected metadata getters for `tenant`, `bytes`, and `now` are not evaluated.
Those probes are separate reviewer evidence and are not included in the 33-test
count above.

## Adjacent blob snapshot review

Both workers independently identified `blobStore.put` reading mutable input
after awaiting content hashing. The code-audit worker owns that repair and its
regressions. This security worker reviewed the frozen implementation at
`4323b612b1d4ab72a437619e6e86f196760a005c` (`tx.ts` SHA-256
`4029d17be3c0876a1e769137a83fbe577c26ed2493f842f93578d0e727975a82`):

- Metadata is captured before asynchronous hashing.
- `encrypted` is normalized to the literal Boolean `true` before SQLite privacy
  validation. A truthy non-Boolean marker cannot pass as encrypted and later be
  stored as plaintext.
- A new `Uint8Array` copies admitted content, including Node `Buffer` inputs;
  `Buffer.slice()` would preserve an alias.
- Hashing, deduplication, privacy changes, and persistence use the captured
  values. The byte-size cap is checked before copying.

No blocking issue was found in this bounded source review. The code-audit
handoff owns the executed regression counts and detailed test evidence.
This worker did not launch another copy of that suite while the author's tests
and the integration checks were running.

## Dependency advisory refresh

`corepack pnpm audit --json` completed with exit **0**, **zero reported
advisories**, and **zero muted advisories** across 142 reported dependencies.
The lockfile still selects `picomatch@4.0.7`; no update, override, downgrade, or
audit suppression was applied.

The official [GitHub-reviewed advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)
is withdrawn. The [GitHub API](https://api.github.com/advisories/GHSA-fc5q-39xc-vjpf)
reports `withdrawn_at: 2026-11-18T15:38:56Z` and
`updated_at: 2026-11-19T16:07:41Z`. Its current description says the advisory was
withdrawn because it is not a security issue. The dated November 17 audit remains
valid historical evidence of what that invocation reported; it must not be
silently rewritten or described as the current result. A clean dependency audit
does not certify every source path or future dependency state.

The current audit response and advisory metadata are preserved in
[security-g1/receipt.json](security-g1/receipt.json), with byte lengths and SHA-256
digests for the accompanying evidence.

## Reviewed boundaries and remaining limits

Source inspection covered strict envelope canonicalization, signature and DID
binding, signed listing/want admission, retained evidence reconstruction, scoped
repositories/blobs/sync/leases, encrypted-row integrity, and writer fencing.
It also inspected the existing Actions privilege and installation boundaries.
No additional confirmed current application vulnerability was established in
those inspected paths. This statement is limited to this review, not a claim
that all code or all threat cases have been exhausted.

An optional three-file regression invocation covering alpha security, Base64url,
and signed matching admission was killed with `SIGKILL`; the pnpm wrapper
returned exit 1 and produced no final JSON report. No passing assertion count
is claimed for that invocation. A separate bounded single-threaded TypeScript
check remained without output and was interrupted with exit 130 at the
integration owner's request to release shared resources. No typecheck pass is
claimed. The interrupted and killed outcomes remain explicit in the receipt;
they do not replace the completed 33-test result or root's combined qualification.

The historical 51 planning/readiness findings remain distinct from confirmed
implementation defects. Native WebKit existing-key import, complete backup and
delivery-state recovery, canonical identity/revocation authority, production
private messaging, and the other items in
[REMAINING_WORK.md](../../REMAINING_WORK.md) remain open according to their
own contracts and evidence.

## Fresh-worker handoff

1. Refresh actual main, current candidate heads, and worker ownership before
   editing. Preserve this generation's original failure and audit evidence.
2. Review the integrated scope and blob snapshot repairs together. Use the
   final commit/tree identity from the integration handoff and current hosted
   checks; PR #56's earlier checks do not qualify subsequent source changes.
3. Inspect the new backup scope/restore diagnostics against the actual record
   types and unsupported stores. Root owns that implementation; this generation
   did not review its final diff. Do not present record backups as full database
   or delivery-state recovery.
4. Continue security work on a concrete unaudited workflow. Preserve the alpha
   signature format, client-owned authority, and fixed validation limits. Keep
   API-hardening findings separate from demonstrated external attack paths.
5. Re-run a blocked check only to close a specific remaining qualification gap
   in a supported environment. Do not weaken checks or manufacture a passing
   result from the killed/interrupted invocations.
