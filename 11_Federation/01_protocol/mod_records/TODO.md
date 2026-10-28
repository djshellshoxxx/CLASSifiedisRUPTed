# TODO — F11.S01.M02 mod_records

**Status:** IMPLEMENTED — Envelope v1, 4 payload schemas, 32KB limit, deep privacy scan (keys, emails, coordinate pairs), regionCell<=5. Forwarding of third-party-origin records is not supported (origin must equal sender).

## Implemented
- [x] Envelope v1 schema and four payload schemas (strict)
- [x] 32KB limit, deep privacy scan for coordinate/address/contact keys and email/coordinate values, regionCell <= 5

## Code and tests
- Code: `packages/federation/src/protocol/records.ts`, `packages/federation/src/types.ts`
- Tests: `packages/federation/test/records.test.ts`

## Remaining
- [ ] Payload schema versioning beyond v1
- [ ] Additional record types (reviews, reputation)
