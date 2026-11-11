# F13.S02.M04 (PS-106) In-app notification preferences

## Implemented
- Vault commands: `notify.preference.set` (cells <= 21, per-cell `expectedRevision`), `notify.preference.reset` (capability `notify.preference.set`).
- Relay command (surface `relay`): `notify.preference.mirror` (signed `classrup.notify.preference_mirror/v1`: exactly 7 cells of category, push, email, strictly increasing seq).
- Queries: `notify.preference.get_matrix`, `notify.preference.resolve` (relay-internal: system or relay actor only; allowed = mirrored flag AND an active channel consent at this relay).
- Event: `notify.preference.changed`. Subscribers: `notify.preference_channel_opted_in` (marks channel active, sends the full snapshot to the relay holding the new consent), `notify.preference_channel_opted_out` (marks inactive, keeps stored flags).
- Exports: `DEFAULT_MATRIX` (golden table, defaults version 1), `inAppEnabled(tx, category)` (used by F13.S01.M03), `mirrorStateOf(syncEntries)`, `prefErrors` (`NOTIFY_PREF_LOCKED`).
- The matrix is created lazily (all 7 cells at revision 1) by the first command or opt-in event; reads of an untouched vault return the defaults at revision 1.

## Ports (`PreferenceOptions`)
- `localPrincipal()`, `signStatement(type, payload, seq, previousCid)`, `verifyStatement(envelope)`; relay only: `relay: { relayId, signReceipt(payload) }`.
- Imports the opt module (`../opt/index.ts`) for `hasActiveConsent` and the channel events.

## Deviations
- `get_matrix` also returns `mirrorRef` (CID of the last mirror statement); queries cannot read the sync outbox, so the UI maps it to a state with `mirrorStateOf(tx.sync.list({ref}))`. `set` returns `local_committed` when a mirror was queued, else `none`.
- Cell `mirrorSeq` is updated only on cells changed by the mirrored edit (untouched cells keep their revision, which keeps per-cell merge intact); the strictly increasing seq itself lives in `notify.pref_state`.
- V04 on the mirror relay command: an invalid signature, wrong signer and missing channel consent all return `PRECONDITION_FAILED` as the rule table says; a payload that is not a well-formed 7-cell statement (including any in-app column) returns `VALIDATION_FAILED`.
- V05: an older or conflicting seq returns `CONFLICT_STATE` without change; an identical replay (same seq and CID) returns the stored receipt. The spec says "acknowledged without change" and lists `CONFLICT_STATE`; both are covered this way.
- The in-module rate counters (60 edits per hour, 30 mirrors per hour per user) count successful operations only; rejected calls roll back. Per-call limits of rejected traffic belong to the relay `RateLimitPort`.
- A cell edit whose resulting values already equal the stored values is an idempotent no-op even with a stale `expectedRevision`.
- `set` returns the touched cells in matrix order, not request order.
- Unknown future categories are not stored (v1 has exactly the 7 known categories; the repo schema enforces it). `inAppEnabled` treats unknown categories as on.

## Test rows not covered
- T09 (app update with a new category): needs the unknown-category/import path, not implemented; the relay-storage inspection part is asserted inside T07 without claiming T09.
- T11 load, T12 traceability, T14 a11y.
- T13 export/import/backup: the export/import machinery (ExportSectionPort) is not available; no import path, so "security inApp forced true on import" and "unknown categories kept" are not implemented. The repo schema refuses any stored security cell with in-app off.
- Not implemented: relay mirror purge 30 days after the channel consent ends (needs a relay scheduler hook), Mirror retry/backoff (kernel sync sender does it).

## Open questions
- Whether the relay mirror purge should be a relay sweep exported here or owned by the relay composition.
