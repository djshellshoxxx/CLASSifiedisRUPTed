# PS-002-03 — Draft creation state and transitions

**Status:** SPECIFIED_REVIEW_PENDING — architecture/security/protocol review outstanding; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Inherits [client-owned architecture](../../../planning/CLIENT_SIDE_ARCHITECTURE.md), [core commands/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md) and [listing contract](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md). These contracts supersede conflicting backend assumptions in historical parent text. Stable requirement/test IDs retained with explicitly revised local semantics.

## Requirements
- PS-002-03.R01: Domain transition ABSENT -> DRAFT/private/revision1 only. UI operation state `local_pending -> local_committed` after IndexedDB transaction completion, or typed failure with no acknowledged mutation. Offline completion is valid; no remote submission required.
- PS-002-03.R02: listing.created v1 plus receipt and object are one local transaction. Draft event remains private; never enqueue draft payload for peer sharing or public search. Local outbox consumers can process at least once, deduplicated by event ID.
- PS-002-03.R03: F01 mod_edit owns later revisions, mod_publish local review/export eligibility, mod_archive local archive/delete. F10 governs user-controlled retention. No server moderation queue or universal deletion effect; publication/sharing need their own reviewed disclosure/crypto gates.

## Failure and race behavior
Transaction abort leaves no object/event/receipt; quota/schema/locked vault fail closed. Interrupted callback/reload queries command receipt before retrying same ID. Same-vault tab races re-read principal/local policy and command key inside readwrite transaction; UI mutex alone insufficient. Separate vaults may create independently and cannot enforce global ownership. Neither local commit nor future peer ACK means consent/payment/handover.

## Acceptance
TEST-PS-002-03 proves sole creation transition, atomic rollback, one logical event, no public projection and valid network-blocked local commit. Browser crash/transaction-completion behavior requires real-browser evidence; not run.
