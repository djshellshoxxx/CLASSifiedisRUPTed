# PS-110-03 — workflow state machine

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-110-03. **Owner:** [14_Accessibility/01_a11y/mod_screenreader](SPEC.md). **Implementing module:** 14_Accessibility/01_a11y/mod_screenreader. **Consumers:** feature surfaces F01–F13 that resolve or announce catalog labels by `label_id`; shared cross-cutting contracts F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md) and [registry](../../../planning/SPEC_REGISTRY.csv).

## Purpose and scope
Defines four state machines: label row lifecycle, release lifecycle, client-side preference sync, and per-announcement delivery. Field definitions are in [domain_schema.md](domain_schema.md); validation is in [validation_rules.md](validation_rules.md). Transitions are explicit and auditable. No transition implies that an assistive-technology user has heard or read an announcement.

## Requirements
- PS-110-03.R01: **Business outcome.** Catalog changes move through draft, approval and publish without a code deploy, and every published release can be restored. Participants' preference edits converge across devices without losing an offline change silently. **Exclusions:** the state of any feature's own domain record (owned by that feature); delivery confirmation from the operating system.
- PS-110-03.R02: **Cases.** Normal: draft to active to retired. Invalid: transition attempted from a terminal state. Expired: a draft older than 30 days with no publish is moved to `discarded` by the janitor job (A-screenreader-06 covers copy-on-write). Duplicate: a second publish of the same release returns the original result. Concurrent: two publishers race; one receives `SCREENREADER_RELEASE_IN_PROGRESS`. Offline: preference edits remain `pending_sync` until acknowledged. Adversarial: replayed publish with an old checksum; a release manager approving their own staged release.
- PS-110-03.R03: **Budgets.** Publish completes its transaction ≤ 10 s p95 for 3 000 rows. Client state transitions are instantaneous and never block focus or the announcement region. Each state change is reported to the screen reader only through the announcement path defined by [commands_queries_events.md](commands_queries_events.md), never by moving focus.

## Label row lifecycle (`sr_label.status`)

| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| draft | `sr.label.draft_created` (new row) or `sr.label.revision_started` (copy-on-write from an active row) | → active (via staged release publish); → discarded (`sr.label.discardDraft`) | author holds `sr.label.draft.write`; VR-01 to VR-09 pass | no |
| active | `sr.release.published` includes the row | → retired (publish of a release that removes it, or of a newer active row for the same pair) | published release is not superseded | no |
| retired | release publish removes the row, or supersession | none | none | yes |
| discarded | `sr.label.discardDraft` or janitor after 30 days | none | draft has not been published | yes |

Copy-on-write (A-screenreader-06): editing an active row creates a new draft row with `revision + 1`. The active row stays `active` and serves clients until a release publishes the draft.

## Release lifecycle (`sr_release.state`)

| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| staging | `sr.release.stage` creates the release (only one at a time, VR-15) | → published (`sr.release.publish`); → abandoned (`sr.release.abandon`) | VR-12 coverage gate passes before publish | no |
| published | publish commit: release row, row status changes, outbox event written in one transaction | → superseded (a newer release publishes) | checksum matches (VR-13); approvers present if assertive (VR-14) | no |
| superseded | newer release publish commit | none; restoring old content is a new release with `rollback_of` set | none | yes |
| abandoned | `sr.release.abandon` or staging older than 24 hours (janitor) | none | none | yes |

Rollback is forward-only (A-screenreader-07): `sr.release.rollback(target_version)` creates a new staging release whose rows copy the target's content, with `rollback_of = target_version`. A superseded release is never reopened, so client caches only move forward.

## Client preference sync (device-local state, not server state)

| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| local_only | first launch, or sync opt-out succeeds | → pending_sync (local change); → synced (opt-in succeeds) | no server row for participant | no |
| pending_sync | local change while sync enabled, or any change while offline | → synced (server ack with revision); → conflict (409 `SCREENREADER_REVISION_CONFLICT`); → local_only (opt-out) | queue depth ≤ 50 (A-screenreader-11) | no |
| synced | server ack with `revision` | → pending_sync (new local change); → local_only (opt-out) | none | no |
| conflict | 409 on update | → synced (user keeps server values, or local values re-sent with new expected revision) | user choice or automatic keep-server after 3 failed re-sends | no |

Opt-out deletes the server row (`screenreader.preference.setSyncEnabled(false)`) and then moves to `local_only`. The queue is discarded at that point and not replayed.

## Announcement delivery (transient, per emission)

| State | Entry event | Allowed transitions | Guard | Terminal |
|---|---|---|---|---|
| received | caller invokes resolve or announce with `label_id`, `locale`, params | → resolved; → dropped | VR-17 params pass | no |
| resolved | active row found for requested locale, or for en-US fallback | → suppressed; → presented | preference allows the priority class; dedup window (same `label_id` and params within 2 s) not hit | no |
| suppressed | preference off, or dedup hit | none | none | yes |
| presented | text written to the live region (`polite` or `assertive`) | none | none | yes |
| dropped | no active row in fallback chain, or validation failure | none | error code recorded | yes |

Fallback chain: requested locale, then language-only tag, then en-US. An `assertive` announcement that cannot be resolved is dropped with `SCREENREADER_LABEL_NOT_FOUND` and a counter increment; no spoken fallback text is invented.

## Preconditions, timeouts and compensation
- Publish preconditions: staging release exists, coverage gate passes, checksum matches, approvers present.
- Publish timeout: 30 s lock (A-screenreader-12); on timeout the transaction rolls back and the release stays `staging`.
- Compensation for a bad published release: rollback (new release), never row deletion. Compensation for a bad preference write: the next preference update by the participant, or a restore under F10 authority.

## Open decisions
- **A-screenreader-06:** Copy-on-write draft revisions for active labels, so clients never see a half-edited label. Alternative (in-place edit with version bump) is rejected here because it exposes partial state.
- **A-screenreader-07:** Rollback creates a new release instead of reopening a superseded one, keeping version numbers monotonic for cache safety.
- Janitor windows (30-day draft expiry, 24-hour staging expiry) are defaults and are not yet agreed with F15 operations.
