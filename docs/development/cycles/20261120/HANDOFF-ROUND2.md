# ClassRup mixed-codec recovery — second bounded acceptance slice

## Source checkpoint

Target draft PR #58 on `codex/classrup-mixed-codec-recovery-20261120`. Its earlier source commit was `cb14ede1daacc0d6752c80433317f582046b76e3`, tree `4ec65398d136168f9a61044106272801b267067f`, based on main `137d88e36cc6b1611b062daa33cf84c3d29c86b3`. This change is a child of that exact PR commit and contains no merges from unpublished local mapped histories.

## Bounded work

Added `tests/integration/production-codec-compatibility.test.ts` with two additional targeted normal/defensive integration scenarios using real encrypted IndexedDB storage:

1. A valid historical archive-only subset v1 backup must restore and reopen under the newer complete PWA registry, preserving signer identity, archive owner/key, original row and indexes.
2. A legacy mixed-type archive/location export containing a foreign-owned archive (from an older schema-only archive codec) must fail current production restore before creating an identity record, and remain uninitialized after connection reopen.

This is additive acceptance coverage; no production codecs, existing v1 manifest format, keys/signing algorithms, encryption parameters, crypto test vectors, product bounds, CI workflow selection or timeouts changed. The 30-second per-test limit matches the existing integration tests.

## Executed gates and ownership

At inspection, PR #58 head `cb14ede1daacc0d6752c80433317f582046b76e3` had Alpha run 44671373623 queued at planning, and CLI run 44671373518 with its plan successful and two Ubuntu jobs queued. Main's separate PR #57 merge push runs 44671014883 (Alpha; planning passed, domain queued) and 44671014863 (CLI; planning queued) were likewise **not qualified**. Original pending run IDs remain preserved; newly changed source needs its own full checks. No local GitHub clone or test runner was available: these two added tests have not been executed here. No CI success is claimed from source inspection.

No independent fresh worker execution facility was available in this invocation. Fresh reviewers must separately cover: (a) source/API parity and registered-codec ordering; (b) realistic normal owner/listing/retained/publication readers plus error paths; and (c) defensive principal, canonical key, index and empty-destination invariants. Static review is not product-test execution. Respect other active owners and preserve the older paused workflows.

## Next safe integration steps

Check actual source-head Alpha domain, Chromium/Firefox/WebKit and CLI job outcomes, inspect failures/logs, and repair any reproducible defects. Do not restart unchanged queue/killed suites. Require independent code, bug and security review before marking draft ready and merging. Verify actual merge tree and main's own push runs. After this slice, the next recovery work is interrupted-restoration rollback and normal runtime reader acceptance; attachment/blob, delivery/lease, rotation and whole-database recovery remain separately scoped. No release or deployment is authorized.
