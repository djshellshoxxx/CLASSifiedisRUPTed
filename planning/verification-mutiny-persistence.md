# Independent Mutiny persistence verification

Reviewed working tree based on `3694395272e880d929fcb53693ddd70e14bc47bf`, November 9, 2026. Implementation was written by the Mutiny worker; this verifier owns only the integration tests and this report.

## What the tests actually exercise

`tests/integration/mutiny-persistence.test.ts` uses freshly generated **real Ed25519 key pairs**, the production signed-envelope codec/verifier, real Bazaar create/publish/reserve/release commands, retained peer projections and wants, the production graph admission/matcher, and the production Mutiny repository through the kernel command bus. Each principal has an independent kernel IndexedDB storage instance. Local authority is checked against both principal and tenant.

IndexedDB is supplied by **fake-indexeddb in Node**. Close/reopen exercises the actual kernel adapter's durable state reconstruction within the emulated database. This is not evidence of a real browser engine, disk durability after process termination, cross-tab browser locking, or UI accessibility. Keys in these fixtures use WebCrypto directly; encrypted identity storage and backup cryptography have separate foundation tests.

The feasibility callback re-verifies projections and wants read from the current transaction's own publication/retained-record repositories; it does not return an unconditional success fixture. Local inventory callbacks inspect and release real Bazaar holds in the same transaction.

## Cases

- Two-, three- and four-principal cycles: signed listing/want admission, reverse-order reservation delivery, missing final participant, restart before final consent, commitment after unanimous signatures, subsequent restart and duplicate statement delivery.
- Local consent without an actual inventory hold is rejected; stale optimistic revisions and valid signatures from an outsider are rejected without mutation.
- A second local hold for an already held item is rejected.
- An incomplete proposal expires on explicit refresh and releases its local hold.
- A new proposal revision invalidates prior consent/reservation maps; stale consent is rejected; signed dropout is persisted and releases holds.
- Conflicting remote promises for the same owner/item freeze both subjects atomically and remain frozen after reopening.
- Releasing an actual local hold before the final peer consent prevents commitment.
- Releasing a hold after commitment freezes coordination on refresh, even though old signed reservation evidence remains valid.
- Expired signed reservations freeze committed coordination and release holds.
- External restore normalization never accepts cached commitment/feasibility as authority: both forged cached commitment and a previously legitimate commitment become `restore_requires_review`. Normal local restart uses the private live-replay path and preserves a genuine commitment past the consent deadline while reservations remain valid.
- Actual Bazaar unpublish tombstones remove listings from graph admission.
- Signed dropout remains permitted after the consent deadline for an already committed exchange, and releases holds.
- An injected failure after a hold-release write rolls back both inventory and coordination atomically; a subsequent retry succeeds.

## Review findings and disposition

1. **Historical commitment lost on replay:** initial repository reconstruction returned a proposed state, allowing later clock evaluation to cancel an already committed exchange. The implementation now distinguishes private live reconstruction from untrusted restore normalization and preserves signed/evidenced local commitment on normal restart. Regression covered.
2. **Tombstone integration mismatch:** graph admission originally expected `classrup.federation.tombstone/v1`, while Bazaar emits `classrup.alpha.tombstone/v1` with ownership/revision fields. The implementation now accepts the real alpha contract with authority checks. Regression uses the actual Bazaar command output.
3. **Local reservation checked only when authoring consent:** a local hold could be released before the final remote consent. Every commitment transition now rechecks the actual local hold; a previously committed exchange freezes if its hold disappears. Regressions covered.
4. **Expiry reason precedence:** the local missing-hold check initially hid `reservation_expired` behind `local_reservation_lost`. The verifier requested time evaluation before the local hold guard so the UI can accurately distinguish expiry from other loss. The implementation now evaluates time first. The expiry regression passes with `reservation_expired`, while early hold loss retains `local_reservation_lost`.

## Command evidence

- `corepack pnpm exec vitest run tests/integration/mutiny-persistence.test.ts`: **14 passed**, exit 0, approximately 1.94 seconds on Node 24.22.1 / Linux.
- `corepack pnpm typecheck`: passed after the first 12 integration cases. The final rerun after 14 cases reported concurrent integration errors outside this verifier’s files: `apps/pwa/src/main.ts:134` and `tests/integration/alpha-security.test.ts:299` pass a string where the updated API expects `UnlockedVault`. The integration owner must rerun after resolving those call sites. No errors were reported in this verifier’s tests.

These checks do not establish globally exclusive inventory, atomic physical exchange, live relay delivery, or completed browser/OS acceptance. Proposal/consent messages remain explicit signed file/envelope exchange; no suggestion automatically commits a trade.
