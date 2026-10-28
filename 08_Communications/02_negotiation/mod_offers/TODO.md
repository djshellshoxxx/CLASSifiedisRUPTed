# TODO — F08.S02.M01 mod_offers

**Status:** IMPLEMENTED — Cards reference offer/proposal/cycle by id + revisionHash; new revision supersedes. Existence and hash of the referenced record are not verified (owner ports not in kernel).

## Implemented
- [x] Cards {refType, refId, revisionHash, summary} for offer/proposal/cycle with id-prefix validation
- [x] New revision supersedes older current card; duplicate revision rejected
- [x] Participant-only post and list

## Code and tests
- Code: `packages/comms/src/negotiation/offers.ts`
- Tests: `packages/comms/test/negotiation.test.ts`

## Remaining
- [ ] Verify card references and hashes against bazaar/mutiny (owner lookup ports not in kernel)
- [ ] Card action buttons wired to bazaar/mutiny commands in the PWA
