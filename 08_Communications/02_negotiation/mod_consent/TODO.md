# TODO — F08.S02.M02 mod_consent

**Status:** IMPLEMENTED — Signed per-revision consent (context 'consent'), key checked against identity, append-only, verifyConsent/hasAllConsent for other features. Signature is evidence of assertion only.

## Implemented
- [x] Signed consent statements (context 'consent') verified against identity signing keys
- [x] Per-revision records, accept/decline/revoke transition table, freshness window, replay-safe
- [x] verifyConsent and hasAllConsent for other features; status query per thread

## Code and tests
- Code: `packages/comms/src/negotiation/consent.ts`
- Tests: `packages/comms/test/negotiation.test.ts`

## Remaining
- [ ] Mutiny/bazaar adopting verifyConsent through a kernel port
- [ ] Consent receipts export for evidence bundles
