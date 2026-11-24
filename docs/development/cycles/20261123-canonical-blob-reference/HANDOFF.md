# ClassRup — canonical blob-address admission, next-generation handoff

Date: 2026-11-23 UTC. Source repository: `djshellshoxxx/CLASSifiedisRUPTed`. Frozen parent is draft PR #129, branch `codex/classrup-missing-attachment-20261123-t12`, head `6da3dd18e77c02c565f5368d6042199b77e2b79f`. Additive child branch: `codex/classrup-canonical-blobrefs-20261123-t13`. The production change was initially published in `08c50d0bc80820e809ef35e0dc199e710991d7b4`; the three-adapter regression in `70631bf8306ab0f85ca12d9f05c03ee42a419289`. Re-resolve actual remote PR/head/tree before qualification, editing or merging; never merge unpublished local-only history over equal-tree republished commits.

## Observed parent gates and historical preservation

At PR #129's exact head, Alpha [45090870673](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45090870673) and CLI [45090870633](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/45090870633) completed **success**. Alpha's domain job `137419942982` completed the repo typecheck, specification, boundary/registry, money vectors, 27 tooling tests, **945 passed / 0 failed / 0 pending / 0 skipped** domain assertions, setup/build, and 26 Chromium journeys. CLI's two Ubuntu clean-install jobs (Node 22.18.0 and Node 24.x) passed. This is parent source-specific evidence **only**, not this child's qualification. PR #129 had zero submitted GitHub reviews when inspected.

Keep the original #126 TypeScript failure `45074487619`, #126 fixture-initialization failure `45074614282`, #120 Firefox failure, #116 and #105 Alpha failures, PR #56's cancelled main-push Alpha `44658477772`, and the original complete local suite exit 137 without a final report separate from subsequent successful runs. PR #56 main-push CLI `44658477821` succeeded. Do not rerun unchanged queues or killed suites without a targeted remedy.

## Bounded confirmed code finding and repair

`packages/kernel/src/storage/tx.ts` used `/^blob:sha256-[A-Za-z0-9_-]{43}$/` to admit blob references, but SHA-256 is 32 bytes. Unpadded base64url therefore encodes 42 complete six-bit symbols plus a final four-bit symbol whose two lower pad bits **must be zero**. Previously, an alternate final alphabet character differing only in those unused bits was accepted even though it represented the same decoded digest. The new acceptance check allows only canonical final characters; it does **not** change the SHA-256 address algorithm or re-encode existing references. `tx.blobs.attach` already calls this predicate before writing a holder row.

New `tests/integration/blob-reference-canonical-admission.test.ts` checks actual generated addresses, a noncanonical alias, and malformed encodings; it asserts that rejected refs create no holder rows and canonical refs still create a valid missing-blob holder through memory, SQLite and IndexedDB drivers. Static inspection confirms this code path; actual repository test execution is a **separate current-head gate**. A standalone Node check accepted 4,096 actual SHA-256 base64url addresses and rejected 12,288 altered-pad-bit aliases. That is a mathematical/regex sanity check, **not** a repository or browser test and not independent security review.

This is narrow canonical reference hardening ahead of portable attachment recovery, **not** a versioned authenticated attachment manifest. Legacy malformed holder rows, if any, are not silently removed or migrated. There is no new owner/holder authority assertion and v1 backups still exclude blobs and references. Existing signed wire, cryptographic identities, storage encryption, record caps, test timeouts and browser selection remain unchanged.

## Fresh successor worker assignments — not launched

1. **Code-audit worker:** re-read the exact child tree, `tx.ts`, storage port, memory/IndexedDB/SQLite holder implementations, and `blobRefOf`. Independently verify canonical digest encoding and check any existing legitimately formatted refs that could be rejected. Record exact head SHA, tree, source files and executed/static checks; do not report static inspection as runtime qualification.
2. **Normal functional bug-hunt worker:** run the new focused test first and record failures at their actual source. Check valid generated refs, duplicate attachment semantics, missing-blob counts, ref aliases and failed-transaction rollback, then inspect the current-head Alpha/CLI jobs. Do not run concurrent resource-heavy suites.
3. **Defensive source security-review worker:** inspect only canonical-address validation, tenant-scoped holders, untrusted arbitrary holder labels, and prospective manifest authority. Recommend hardened fail-closed validation as appropriate; do not run the previously interrupted security reproduction work. Record exact evidence and limitations.

No independent worker execution or review approval was available in this invocation. These are assignments, not completed audits; approval remains an integration gate.

## Next P1 feature, integration and preservation

Prioritize an **authenticated, separately versioned attachment manifest**, proving authority through principal-owned canonical parent records rather than unverified holder labels. Bound aggregate transport independently of per-blob limits, verify each SHA-256 byte address and owner mapping, prove atomic destination re-encryption/rollback and encrypted reopen. Preserve signed v1 record-only restore and separate missing-reference diagnostics. Later work includes delivery/queue/lease state, rotation and native WebKit import.

Keep this child draft until its *actual current source* passes Alpha/CLI and independent review is submitted, then qualify ancestors before ordinary integration. Verify exact actual merge tree and main's independent push gates if merging. No release, deployment, force push, branch deletion, paid API or unrelated/paused automation changes.
