# November 19 feature completion and consolidation

## Baseline and scope

The owner's new continuation starts from main
`b6d99d87e9f67e76791f2dfff3e85015154cd92f`, following merged PRs #54 and #55.
A fresh review found 60 remote branches and only draft PR #8 open. The earlier
safe historical consolidations were already complete. Draft #8 still contains
incompatible unfinished runtime work; no additional settings implementation was
available to recover, and the existing registry on main is more complete.

This continuation combines three independent implementation branches and one
shared validation repair. It preserves historical branches, identity/signature
formats, the encrypted-backup format and existing test limits. No deployment or
release is part of this change.

## Completed behavior

### Public CLI F1b

`listing list`, `listing show` and `search` accept repeated explicit `--file`
inputs. Each file passes signature, CID, strict public-payload, author-binding and
current-expiry validation. Shared PWA retention/search handlers build a temporary
memory view with deterministic per-subject revision handling, duplicate-CID
removal, withdrawal suppression and fail-closed conflict handling.

Versioned JSON and human output provide fixed errors, bounded pages, exact
minor-unit filtering and query-bound snapshot identifiers. Limits are 128 input
files, 1 MiB per file, 16 MiB total and 100 results per page. Terminal formatting
escapes control and formatting characters. There is no implicit network access,
private-key access, signing, browser-vault access or persistent write.

Selected expired files fail admission; this command is not a historical archive
reader. Only the selected evidence is available. Chain continuity, revocation,
unseen revisions, current ownership and trust remain explicitly unestablished.
Persisted retained-cache access, a packaged executable and private CLI phases
remain separate work. See [the complete CLI contract](../CLI_SETUP.md).

### Explicit listing value removal

Draft and unpublished listings support the explicit `removeValue: true` edit
intent. Omission and `undefined` preserve the existing value. Supplying a value
and requesting removal together fails validation. The editor exposes **Remove
declared value**, retains unsaved amount text when the checkbox is undone, and
resets removal on cancel, reopen and lock.

Ownership, revision, state and inventory-hold checks remain enforced. Removing a
previously published value creates material history; existing signed files keep
their original contents. Wanted/giveaway listings may republish without a value.
Sale listings still require a value to publish. See [the editing guide](../LISTING_VALUE_EDITING.md).

### Transaction lifetime repair

The previous storage API allowed retained transaction objects or destructured
methods to access state after the callback returned. Reproduction failed 19 new
regressions across memory, IndexedDB and SQLite adapters. The repair guards both
the public transaction and its underlying driver methods, revoking access before
commit or rollback. It also blocks delayed blob writes and queued microtasks
after synchronous transaction/read callbacks return.

For an asynchronous callback, revocation occurs when the wrapper observes its
returned promise's settlement. A microtask queued before that observation can
still execute inside the current transaction. Callers must await all transaction
work; the lifetime guard is not a replacement for that requirement. Retained
handles remain revoked before persistence and during later transactions.

Awaited asynchronous callbacks and plain/null/thenable read results preserve
their behavior. A real encrypted-vault lock/reopen regression checks that the
identity and committed record survive while the stale handle cannot add a row.
Already returned data copies are not retroactively erased. Backup completeness,
passphrase rotation and full-database rollback protection remain open.

### Shared search validation

Malformed paired price bounds previously reached `BigInt` during schema
refinement and threw a native conversion exception. The shared search schema now
checks the bounded decimal grammar before conversion. The domain regression
checks invalid lower and upper bounds, stable validation failures and unchanged
retained data. Valid exact arithmetic remains unchanged; the CLI also contains
its own fixed-error boundary.

## Review and qualification

**Status: implementation published; corrected-head qualification pending.**
[Draft PR #56](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/pull/56) contains
source `3aa7a17b28ee07ebec4336b49c3527743510bc16`, with tree
`92a6452b4241fbcafe13b334a154765bbac63c3e`. Main remains
`b6d99d87e9f67e76791f2dfff3e85015154cd92f`; this continuation has not merged.

The [first hosted attempt](evidence/20261119-feature-completion/initial-ci/manifest.json)
passed 748 domain assertions, 27 tooling tests and the static/money/setup/build
gates. Its browser result was 72 passed and three failed: every new value-removal
journey stopped at an exact label lookup for a select whose wrapping label also
contains option text. All three failure snapshots identify the exact accessible
combobox name. The corrected test uses that role/name, waits for completed
unlocking and verifies exact unpublished/published revisions. Its behavior
assertions and timeouts remain intact.

The corrected source's [Alpha run 44510361239](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44510361239)
and [CLI run 44510361244](https://github.com/djshellshoxxx/CLASSifiedisRUPTed/actions/runs/44510361244)
are still queued at the
[latest immutable checkpoint](evidence/20261119-feature-completion/corrected-head-queued-checkpoint.json).
Both planning jobs have zero executed steps and no assigned runner. Their
actual checkout and passing checks have not been observed. The prior source's
six CLI platform jobs were cancelled before execution when the correction was
pushed. The correction's local typecheck was killed with exit 137, as recorded
in its [local evidence](evidence/20261119-feature-completion/correction-local/manifest.json).
The full [local qualification record](evidence/20261119-feature-completion/local-qualification.json)
also preserves the original killed domain run, the 745/748 serial domain result
with unchanged timing limits, and the 44/46 concurrent CLI result with two
unchanged subprocess timeouts.

The combined source requires independent review and the normal Alpha and
six-platform CLI workflows. Results and source identity are recorded in the PR
and in the continuation's evidence record; previous main runs do not qualify
this new code. The [independent review](evidence/20261119-feature-completion/independent-review.md)
found no blocking issue and records additional executed adversarial probes.

Focused implementation checks passed 46 CLI assertions, 59 listing/editor
assertions, 30 storage lifetime/close assertions, the new encrypted-vault
lock/reopen assertion and seven shared-search assertions. These are overlapping
focused suites, not a combined total. Full qualification is recorded separately.

The local environment disconnected during initial verification. Two baseline
typecheck attempts exited 137; incomplete baseline tooling runs and interrupted
tests are not claimed as successes. The workspace recovered with patches intact.
The first combined typecheck found a missing required `idempotent` property on a
test-only seed command; that fixture was corrected before qualification. Local
Chromium launch was denied a socket before opening the application, so no local
browser-journey success is claimed. Hosted browser execution is required.

## Remaining work

This is a bounded feature continuation of an incomplete development alpha.
Native WebKit existing-key import compatibility, complete encrypted recovery,
identity/device authority, canonical federation, broader consent/commerce
composition, messaging and the later product families remain in
[REMAINING_WORK.md](REMAINING_WORK.md). No completion percentage is inferred from
source paths or specifications, and no historical security-readiness finding is
closed merely because these changes pass tests.
