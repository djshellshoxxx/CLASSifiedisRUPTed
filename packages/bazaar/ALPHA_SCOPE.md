# Bazaar / retained discovery alpha slice

Implemented paths reuse the kernel bus, scoped repositories, optimistic revisions, idempotency and transactional outbox. Production durability depends on the composition root supplying the persistent unlocked vault storage; memory storage is used only by contract tests.

- Single-item sell, wanted and giveaway draft creation, full-field editing while draft/unpublished, explicit publish, signed unpublish and archive after unpublish.
- Owner checks run in handlers even if the outer capability adapter is permissive. The composition root must still bind the unlocked principal and vault tenant; callers must not choose arbitrary tenants.
- Exact minor-unit money strings use the kernel Money schema. Public projections explicitly omit private notes and exact inventory counts; unsupported location keys fail strict parsing. Category acceptance requires an explicit local category policy callback.
- Local single-item reservations have at most a 30-day lifetime, bounded by publication expiry. These are local promises; another device may fork its inventory. Reservation signatures use `classrup.alpha.reservation/v1` with `{subjectId,revisionHash,giverId,itemId,expiresAt,holdId}`. No remote/global lock is claimed.
- Discovery verifies before writing, retains signed evidence, rejects owner substitution and stale revisions, freezes conflicting same-revision statements, and excludes expired/blocked/conflicted/unavailable records from search. Quota: 2,000 retained subjects; import beyond it fails closed.
- Export/restore composition **must** register `validatePublicationRecord` and `validateRetainedRecord` as async codec validators. A valid backup encryption tag does not make embedded peer assertions authentic.

## Explicit protocol limitations

The file-exchange slice uses **per-subject publication sequence chains**, not the full CTR-FED-001 global per-author ordering/buffering protocol. Listing revisions and signed-envelope sequence numbers are separate: private draft edits do not create signed statements. Canonical relay federation, gap buffering and remote revocation are not implemented.

Unpublication uses the explicitly experimental `classrup.alpha.tombstone/v1`: `{target,reason,listingId,ownerId,revision}`. The signed subject/revision fields let a restored vault validate the tombstone without retaining the withdrawn listing's content. This is not the canonical target-only federation tombstone. Publication artifacts remain available in the author's own vault; copies exported by users cannot be recalled.

Not implemented here: media validation/upload, governance policy packs or moderation, full kind-specific sell/wanted terms, quantity/variant inventory, signed reservation release statements, hold consumption, automatic lifecycle sweeps, conflict recovery UI, renewal limits, transactional cross-party consent, relay transport, canonical federation, or the full F01/F06 requirement closure. Callers must not present these alpha commands as completion of those specifications. The app's manually selected categories are an explicit local allowlist, not a fully implemented governance catalog.
