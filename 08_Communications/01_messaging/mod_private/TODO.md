# TODO — F08.S01.M01 mod_private

**Status:** IMPLEMENTED — E2E ciphertext only, gapless seq, TTL purge, opt-in receipts, delete-for-me. Sender attribution is relay-asserted; no server-side retention for threads with no active member.

## Implemented
- [x] Send stores MultiRecipientCiphertext only; keys must equal the active participants' box keys (stale or extra keys rejected)
- [x] Per-thread gapless monotonic sequence, server receive time, list since sequence
- [x] 64KB ciphertext limit, structure validation, per-sender rate limit port
- [x] Delete-for-me (record removed once all recipients deleted), disappearing-message TTL plus system sweeper
- [x] Opt-in read receipts (default off), client helpers encryptMessage/decryptMessage with thread-bound AAD
- [x] Test proving the stored snapshot and events never contain plaintext

## Code and tests
- Code: `packages/comms/src/messaging/private.ts`, `packages/comms/src/client.ts`, `packages/comms/src/schemas.ts`, `packages/comms/src/support.ts`
- Tests: `packages/comms/test/messaging.test.ts`

## Remaining
- [ ] Server-side retention for threads with no active member
- [ ] Authenticated sender attribution inside group ciphertext (needs sender signature in plaintext)
- [ ] Key-change warnings in the client
