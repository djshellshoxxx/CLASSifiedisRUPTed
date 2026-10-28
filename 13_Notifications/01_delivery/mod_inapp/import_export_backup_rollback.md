# PS-103-10 — import, export, restore and rollback

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-10 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-10.R01 — export boundary

Notice rows are private local UI state and are excluded from all public projections, federation records, direct-share files, remote adapters, default portable exports and user-visible logs. This module provides no import command. F10/F15 own user-controlled export, erase, vault backup and restore. No export may imply encryption unless F15's key-wrapping format is separately reviewed.

If a future user explicitly chooses a private vault backup that includes in-app state, the backup must preserve notice rows, their consumer cursor/dedupe markers, NoticeSequenceStateV1 including last_local_sequence and exhausted, each row's CAS `revision`, schema version and local principal binding atomically. It must be user initiated, visibly disclose local activity metadata, use F15's approved backup protection, and have explicit destination selection. Until those capabilities are specified and reviewed, omit notice rows and do not claim portable notice recovery.

## PS-103-10.R02 — restore and rollback

For same-vault restore, F15 must restore the notice projection and `(F13.inapp.v1,event_id)` markers as one consistent version. If any row, marker, counter or revision is absent, corrupt, forked or has a different vault/principal, stop inbox writes and catch-up; return `CONFLICT_QUARANTINED` until a reviewed F15 reconciliation supplies a consistent projection/cursor/counter. Sequence values are local to the restored vault; they do not create a global sequence. Never replay the restored source-event history blindly, choose a cursor by timestamp, or synthesize read/consent/delivery state. Restoring an older snapshot may lose later notice rows; disclose that as local history loss, not remote rollback.

Rollback of a failed notice transaction restores both projection and consumer cursor. After confirmed abort, the same event may be retried. After uncertain outcome, query local F15 command receipt and event marker before retrying. Do not create a new command ID or claim success while outcome is unknown.

## PS-103-10.R03 — retention and limitations

Deleting notices is local and irreversible for this module. Source-event dedupe markers remain only as needed to prevent replay while the source may be redelivered, subject to F10 retention. Erasing the vault or those markers sacrifices local replay protection. No guarantee is made about separately copied backups, another device, remote recipient, remote erasure, or restored browser storage.

## Acceptance mapping

- `TEST-PS-103-10`: public export exclusion; explicit private backup consent/destination; rows/cursor atomic restore; mismatched principal/schema/fork; transaction abort/unknown outcome query; marker erasure behavior; user-visible disclosure that portable recovery and encryption are not yet approved. No backup implementation or test evidence is claimed.
