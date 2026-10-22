# PS-002-07 — Privacy, retention and abuse controls

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements
- PS-002-07.R01: Draft not public, cache-control private,no-store. No precise home location, contacts, EXIF or browser GPS in public fields/events/logs; reject unwanted fields and F06 permits manual coarse area selection.
- PS-002-07.R02: F10 data rights govern export/delete; default after owner request purge unreported draft in <=30d operational data, backup copies expire <=90d unless scoped hold with recorded reason/expiry; active removal triggers downstream tombstone where applicable.
- PS-002-07.R03: Default posting throttle max 10 create attempts per hour and 30 drafts/day/member, reject excess with 429 and Retry-After, cap tenant/actor distribution to mitigate Sybils. F12 controls account sanctions and transparent appeals. Moderation verifies against F18 forbidden goods policy.
- PS-002-07.R04: Client-side offline draft should not claim encryption at rest absent device-key design; sensitive fields not persisted if key protection unavailable.
## Tests
TEST-PS-002-07 uses synthetic canary home address/EXIF and confirms no export/index/log leakage, disabled geolocation usable, quota abuse tests, data removal restore test. Pending.
