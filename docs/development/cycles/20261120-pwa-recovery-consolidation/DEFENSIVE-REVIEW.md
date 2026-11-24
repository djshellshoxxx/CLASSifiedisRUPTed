# PR #70 defensive source review

Reviewed head: `eb9577bf9403741c53c2a53f6d5a67fd4e0825a9`.
Complete tree: `f709642281d1d5a29f00c05b0a155b0bdb4ad376`.
Comparison base: `6d4f6ea7ba9bcf886ae69edd0f167a621308d4b2`.

**No blocking defensive source finding was identified in the three changed executable files.** This is a static review of the bounded PWA diagnostic, with adjacent session and storage contracts inspected for context.

## Findings

- **Principal and session scope:** The action captures the exact unlocked vault object. Existing queue binding drops actions accepted by an obsolete session; `runForSession` checks identity before and after the combined work. Both vault methods independently guard their reads. Attachment counts use `identity.principal`, with no tenant chosen by the UI. The memory index and SQLite tenant predicate retain owner scoping. [Action and lock handling](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/eb9577bf9403741c53c2a53f6d5a67fd4e0825a9/apps/pwa/src/main.ts); [vault contract](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/eb9577bf9403741c53c2a53f6d5a67fd4e0825a9/packages/vault/src/vault.ts).
- **Display lifetime:** The prior report clears before the new read. Lock invalidates the session and clears the coverage DOM before awaiting storage close. Obsolete action errors are suppressed. After the final session check, rendering contains no additional awaited work. Values are assigned through `textContent`; the formatter does not render holder labels, content identifiers, filenames, MIME types or bytes. [Session guard](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/eb9577bf9403741c53c2a53f6d5a67fd4e0825a9/apps/pwa/src/vault-session.ts); [formatter](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/eb9577bf9403741c53c2a53f6d5a67fd4e0825a9/apps/pwa/src/backup-coverage.ts).
- **Meaning of counts:** Overflow yields unavailable counts rather than partial totals. The ordinary and zero-holder paths still disclose that unheld blobs are outside the inventory, holder labels are unauthenticated, and v1 excludes both attachment bytes and references. The report neither authorizes export nor changes its validation. Successive record and attachment reads are not presented as an atomic completeness certificate. This agrees with [the declared scope](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/blob/eb9577bf9403741c53c2a53f6d5a67fd4e0825a9/docs/development/BACKUP_SCOPE.md).

## Qualification limits and handoff

The three new formatter cases were inspected, not executed. They do not establish native PWA check/lock/reopen behavior. Current-source compiler, focused integration and hosted Alpha/CLI qualification remain separate gates; no older or parent result is transferred to this head.

All **51 historical readiness findings remain OPEN**, as recorded by the unchanged readiness reconciliation. No runtime, browser, vulnerability reproduction, remote operation or repository edit was performed. Continue with source-specific functional qualification and preserve the earlier failed and pending parent results.

## Integrated-source revalidation

Reviewed final executable source: `9cf6c56c9b65a421a95676f89e9fcc3800bca573`;
complete tree: `f506c9282299b034cef6b540017e49ffeac88362`.
Its merge ancestor `28b2c624d5b92056ddc066636501d3cae9544ec9` retains ordered
parents PR #71 `b89e7047ea352a3d47703b134c6c12a7ea589a04` and PR #70
`eb9577bf9403741c53c2a53f6d5a67fd4e0825a9`.

**No blocking defensive source finding was identified in the combined delta.**
Source comparisons show no changes under `apps/` or `packages/` from the reviewed
PR #70. The PWA action and formatter retain blobs
`2e9679cc47ddc59891cec1db7ac1de2ffec532e5` and
`4e7a86ded78e8a0940fa8bb4b6d959e7a7d33a86`, respectively. The principal,
session, DOM lifetime and exclusion conclusions above therefore still apply to
this inspected source; they remain static conclusions.

The [future-codec rejection test](../../../../tests/integration/production-future-codec-rejection.test.ts)
is byte-identical to PR #71, blob `ebc626830218ec8a05f2ed1669530be4134bb441`.
Its raw observer remains test-local and read-only, rejects unexpected database
creation/upgrade, and compares all persisted rows immediately after rejection.
Only the writer token is excluded across the deliberate reopen. The compatible
retry's populated-record control remains. This test adds no product authority,
storage write path or backup format change; source inspection does not establish
native crash or interruption behavior.

The only executable addition after the merge is three assertions in the existing
[backup coverage browser journey](../../../../tests/browser/alpha.spec.ts).
They require the ordinary fresh-vault display to show zero held counts, v1
attachment exclusion, and the unauthenticated-holder/unheld-blob limits. Existing
private-title exclusion, lock clearing, password clearing and reopened-report
checks remain. The new assertions strengthen the expected disclosure without
adding fixtures that bypass product authority or loosening an assertion, timeout
or product cap.

This revalidation executed no tests, compiler, browser or remote operations and
performed no vulnerability reproduction. Only this documentation appendix was
written. Neither incoming review establishes runtime qualification for this
combined tree. Inspect actual current-source qualification separately, preserve
the parent failures and pending results, and keep all **51 historical findings
OPEN**.
