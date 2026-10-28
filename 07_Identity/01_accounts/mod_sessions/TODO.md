# TODO: F07.S01.M02 sessions

**Status:** IMPLEMENTED

## Implemented
- [x] Single-use 5 minute challenges bound to account, key and nonce (test/sessions.test.ts)
- [x] Token = session id + 256-bit secret, only hash stored
- [x] authenticate(token) checks expiry, account status, device key; slides idle window with 60s write granularity
- [x] List, revoke one, revoke all, active session cap of 20
- [x] System expire_due marks lapsed sessions and purges records after 30 days

## Remaining
- [ ] Per-IP rate limiting is relay responsibility; only per-account challenge limiting via RateLimitPort is built in.
- [ ] Process specifications in this directory are still placeholders; requirements were taken from PROJECT_SPEC.md and docs/adr.
