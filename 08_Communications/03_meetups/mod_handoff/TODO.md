# TODO — F08.S03.M02 mod_handoff

**Status:** IMPLEMENTED — Check-in claims, hashed 6-digit receiver code with 5-attempt lock and expiry, bilateral evidence event, trusted-contact token (window + safe-spot name only). Not proof of delivery.

## Implemented
- [x] Check-in claims around the meetup window
- [x] Receiver-set hashed 6-digit code, giver confirmation, 5-attempt lock, expiry, code bound to meetup revision
- [x] Evidence event comms.handoff.confirmed_by_code
- [x] Trusted-contact share token (hashed at rest, expiring, revocable) revealing only window + safe-spot name

## Code and tests
- Code: `packages/comms/src/meetups/handoff.ts`, `packages/comms/src/client.ts`
- Tests: `packages/comms/test/meetups.test.ts`

## Remaining
- [ ] Live location sharing is intentionally not provided
- [ ] Handing the evidence event to rentals/commerce handoff flows (relay wiring)
