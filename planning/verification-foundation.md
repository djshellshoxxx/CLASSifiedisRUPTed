# Independent foundation and listing review — 2026-11-09

Reviewed the local alpha changes against baseline `3694395272e880d929fcb53693ddd70e14bc47bf`. This is engineering review and automated evidence, not a cryptographic certification or completed milestone declaration.

## Executed evidence

`corepack pnpm exec vitest run tests/integration/alpha-security.test.ts` — **19 tests passed** on Linux, Node 24.22.1, pinned pnpm 10.28.0 (11.64 seconds). The suite uses real WebCrypto Ed25519 and the selected noble scrypt/XChaCha20-Poly1305 implementation. IndexedDB tests use `fake-indexeddb`; these are not native-browser evidence. `corepack pnpm typecheck` also passed for the complete integrated workspace at this review boundary.

The independent suite checks:

- Restore-batch rollback, including persistence after reopening; isolated principal databases; rollback and retry after injected persistence quota failure.
- Expected signer authority; signature, author, CID, payload and type substitution; immutable verification snapshots despite caller mutation; unsupported versions, malformed chains and timestamp windows.
- Principal/private-key binding, incorrect passphrase, unsupported KDF, lock revocation, strict JSON input limits and rejection of ambiguous values.
- Retained listing ownership and private-field rejection; duplicate handling; freezing on two signed projections at one revision while preserving signed evidence.
- Retention input mutation during asynchronous verification.
- Encrypted signed backup round-trip, atomic rejection of a malformed later record without initializing the target, and rollback of an awaited write interrupted by vault locking.
- Atomic rejection of a forged peer projection inside an otherwise correctly signed and encrypted local backup, using the actual domain restore validator.
- Correctly signed coordination evidence with a forged cached feasibility verdict does not restore as committed. The production barter codec persists the normalized state after actual encrypted backup restore.
- The actual PWA runtime consent command rejects disabled policy, missing local holds and blocked peers. With an admitted signed graph and matching local reservation it signs a valid consent. Releasing the hold prevents commitment despite complete signed evidence; renewing the real local hold is the positive control that permits commitment.
- A newly signed authorized dropout after the consent deadline still cancels the committed exchange during its execution window.

## Findings resolved during review

1. The kernel canonicalizer alone accepts values outside the signing contract. Federation now validates the complete JSON value tree before canonicalizing and signs detached snapshots.
2. Retained projections initially discarded full signed evidence. Discovery now retains evidence envelopes needed for re-verification.
3. Discovery originally verified a snapshot but stored the caller's mutable object. It now clones before verification and stores the same snapshot; the independent race regression passes.
4. Listing revisions were initially forwarded as envelope sequence numbers, causing first publication to violate the envelope's `seq=1, prev=null` rule. These counters are now separated. Full per-author federation ordering remains outside this alpha and must be documented explicitly.
5. Inventory reservation emitted an event with an unchanged listing aggregate revision and release emitted none. Dedicated hold aggregate events now represent reservation/release changes.
6. Generic backup schema validation cannot establish embedded peer signature authority. The vault now supports asynchronous codec validators before mutation. The PWA wires the publication and retained-record validators; the independent forged-peer restore regression passes. Alpha tombstones bind subject, author and revision explicitly so validation does not require retaining withdrawn content.
7. Coordination restore originally replayed an untrusted cached feasibility boolean into a committed state. Restore now normalizes signed evidence without trusting that verdict and freezes previous commitments for explicit review. The vault persists the normalized data rather than discarding it after validation.
8. Runtime feasibility initially permitted missing local holds and hardcoded trust policy. Both the runtime and domain commitment boundary now require the actual matching hold. Session policy defaults off and includes the user's blocked principals.
9. PWA consent originally signed before checking current feasibility. The UI now calls an atomic domain command that verifies policy, exact revision, signed graph and matching reservation before signing and ingesting. Refresh reconciles expiry and lost reservations; releasing a linked hold first creates a signed withdrawal. Evidence download reloads the current record.
10. The consent deadline cutoff now excludes authorized withdrawals; a post-deadline dropout during execution is covered by the independent runtime regression.

## Remaining release evidence and limits

- Native-browser backup/restore journeys must exercise the PWA's domain validators, including tombstones and same-revision conflicts. A local principal's signature on a backup does not authorize forged statements attributed to another principal.
- Native-browser IndexedDB, Web Locks/concurrent tabs, restart/offline journeys, storage denial, browser eviction and UI recovery remain separate browser checks.
- Device delegation, identity rotation/revocation, one-time recovery kits and the full federation gap-buffering protocol are not established by this review.
- Passphrases/private keys are not intentionally returned or logged; browser physical erasure is not guaranteed. Domain records in the existing kernel IndexedDB adapter are not encrypted at rest merely because identity keys and exported backups are encrypted.
- The final integrated `corepack pnpm test` review run passed **162 tests across 29 files** (20.40 seconds). The earlier outdated tombstone fixture was corrected. The later focused runtime regression including post-deadline dropout also passed. Final commit-level CI and browser evidence remain the integration owner's responsibility.
