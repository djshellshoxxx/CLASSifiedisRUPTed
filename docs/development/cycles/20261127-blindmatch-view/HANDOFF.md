# BlindMatch local view — continuation handoff

Date: 2026-11-27. Branch: `codex/blindmatch-local-ui-20261127`.
Inspected main: `2ee8b924a71338617d6166679f3d33282ea17789`.
This candidate preserves #169 `9543224da6da794a2a0b9b923cc4ea718263c58b` and
#168 `f9e247f3285e5595aa2a619e73dfa7430c418d13` in ancestry. Their refs and the
separately owned storage sequence #162–#167 are unchanged. The [analysis](ANALYSIS.md)
records the unfinished-work census and source-specific earlier evidence.

## Delivered implementation

The private view supports session opt-in, draft creation/editing, exact price
filters, explicit activation/matching, pause, cancellation and confirmed erasure.
It reuses the encrypted intent store and sixteen-codec recovery registry. Saved
active intents never run automatically on view/vault reopen. Native date input
normalization preserves an unchanged expiry's subsecond precision.

The local candidate adapter verifies canonical keys, real signatures and
author/subject/revision/projection/fork binding, then rejects a changed second
snapshot. Its input contains only an abort signal and fixed limit, never private
criteria or intent IDs. It has no network, write or logging port. **More than 128
total retained rows**, including withdrawn/conflicted records, rejects the entire
load. This bounds admission/signature work, not whole-vault decryption cost.
Results are minimal public references to a verified local snapshot, not current
global availability, contact permission, consent, reservations or trade authority.

View generation, operation identity and row-render generation guard every
asynchronous completion. Disable, lock, replacement and destroy revoke the view
before cancellation and clear private forms/cards/results. Policy or listing
refresh invalidates pending matching even while activation/read is awaiting.
The main action handler excludes BlindMatch buttons so unrelated work cannot
disable Cancel or overwrite the component's button state. Cancellation and late
errors do not claim rollback of writes that may already have committed.

Local erasure retains no identifying event, hash, tombstone, request or completion
history. Independent backups, peer copies and physical storage remnants are
outside this operation; account/profile/item/media/derivative erasure is separate.

## Activation and acceptance boundaries

Production keeps literal `ENABLE_LOCAL_BLINDMATCH_PREVIEW = false`, with no URL,
local-storage or runtime override. F19 stays `FUTURE`. The native test fixture
mounts the real component/vault/adapter through same-origin parser-loaded HTML
under the production CSP. It is component qualification, not public activation.

Browser acceptance covers actual production vault unlock with the gate off,
keyboard opt-in/matching, adjacent 18-digit prices, encrypted native persistence,
save/edit/pause/erase/reopen, unsaved-form clearing, 320/375-pixel layouts, and
delayed results after cancel/disable/lock/account replacement. All material is
synthetic. No real keys, funds, provider or confidential protocol is introduced.

The prior #169 Firefox failure remains preserved. Parser loading follows normal
production script loading without weakening CSP. Dependency code includes a
guarded evaluation-capability probe, so source inspection does not prove the
original failure's sole cause. Native execution is the repair gate.

Local browser downloads returned HTTP 403; the system Chromium launcher targeted
a missing executable and exited before assertions. Bundling/discovery is not a
browser pass. Hosted Chromium/Firefox/WebKit execution remains required.

## Review and continuation

Independent runtime review found the global button-ownership issue; integration
fixed it. Independent browser-source review prompted unsaved-canary clearing and
complete selected-filter assertions. The view worker corrected native expiry
normalization. No source review is a submitted GitHub approval or cryptographic
certification. The landscape reviewer approved the gated runtime after inspecting
the button selector fix. The UI author separately reviewed browser fixture/oracle
source and did not self-approve their implementation.

Finish source-specific hosted gates, merge ordinarily,
then verify the actual main-push checks. Real-device resource/latency/cancellation,
manual screen-reader/accessibility, localization and explicit activation review
remain open. Continue cross-domain erasure and consent/disclosure as separate
milestones; confidential matching needs a separately reviewed protocol. Storage
#162–#166 retains its own serial integration process. No release, deployment,
force push or branch deletion is part of this continuation.

## Local verification receipt

Runtime/test candidate: `c361c650` (documentation closeout follows). Full domain
execution began at `8be21259`; subsequent edits affected documentation, browser
acceptance and the main button selector, not domain source or domain tests.
TypeScript and build were verified after the selector change. The final PR must
still pass its own exact-source hosted gates.

| Check | Observed result |
|---|---|
| Full domain/integration suite | **1,100/1,100 passed**, zero failed or pending; JSON report `test-results/domain.json`. |
| Canonical specifications | 150/150 modules, zero errors/warnings. |
| Dependency / generated registry | Passed: 19 features, 150 modules, 568 edges. |
| TypeScript / setup / production build | Passed. |
| CLI / tooling | 46/46 CLI and 27/27 tooling tests passed. |
| Independent Python money reference | 331 vectors passed. |
| Money bundle budget | 2,355 gzip bytes; budget 12,288 bytes. |
| Browser discovery | 99 journeys in seven files, across Chromium/Firefox/WebKit. **Discovery is not execution.** |
| Native local execution | Environment-blocked as described above; no native pass claimed. |
| Execution-backed requirement trace | 487/4,570 requirements covered; 152 gaps in implemented MVP modules. Generated counts are not a product completion percentage. |

Focused foundation, form and adapter counts are included within the full 1,100,
not additional assertions. The matcher also includes bounded independent-oracle
property cases. Real mobile devices and manual accessibility were not executed.
Actual hosted runs and merge identities belong to the integration PR after
observation; a parent result cannot qualify a changed candidate.

## Hosted browser diagnosis

The first published candidate passed all 1,100 domain assertions and the six
CLI platform jobs, but Alpha run `45983924162` was cancelled with ten UI failure
markers before its final browser report. The job now prints each failure as it
happens and allows 30 minutes for the expanded serial suite; per-test limits,
zero retries, all three engines, assertions and CSP remain unchanged.

Focused Linux diagnostic `45988430917` identified Playwright rejecting
`2026-11-28T12:00:00` at the native `datetime-local` fill before save. The fixture
now supplies the control's normalized minute representation and explicitly
asserts the same canonical UTC expiry after save and edit. This repairs test
input, not production parsing or the activation gate. The temporary PR diagnostic
workflow is removed. Full final-source browser and main-push qualification still
belong to the integration PR's observed receipts.
