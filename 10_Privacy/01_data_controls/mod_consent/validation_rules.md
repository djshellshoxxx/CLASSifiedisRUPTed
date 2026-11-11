# PS-076-02 — Validation rules: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-02.R01** Grant input is validated strictly, including purpose, scope and policy hash.
- **PS-076-02.R02** A grant is accepted only for the currently bundled policy version of the purpose.
- **PS-076-02.R03** Defaults are enforced in code, so processing is allowed only when a granted, non-lapsed consent exists.
- **PS-076-02.R04** Withdrawal always succeeds locally whatever its source (user, unsubscribe, deletion step or lapse) and is never refused for rate reasons; only the outgoing withdrawal statements are coalesced in the sync outbox.
- **PS-076-02.R05** A relay accepts a consent or withdrawal statement only after verifying signer key and role, audience, field allowlist, chain position and that the grant was not already withdrawn.
- **PS-076-02.R06** Scope identifiers are validated in canonical form only, a relayId per F15.S02.M01 and a chain_lookup endpoint as a bare HTTPS origin, and a consumer whose check is not granted refuses with PRIVACY_CONSENT_REQUIRED.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | purpose is one of the six defined purposes | VALIDATION_FAILED |
| V02 | relayId is present for federation_publish, notify_email and notify_push, is a canonical relayId ('relay:' plus 26 lowercase RFC 4648 base32 characters, F15.S02.M01) and refers to a relay the user selected | VALIDATION_FAILED |
| V03 | policyHash equals the hash of the current bundled policy text for the purpose | PRIVACY_POLICY_STALE |
| V04 | the purpose is available in this build and not disabled by a feature flag (CTR-FLG-001) | FEATURE_DISABLED |
| V05 | the user command withdraw targets a granted consent | CONFLICT_STATE |
| V06 | scope.recordKinds has at most 20 entries from the known record kinds | VALIDATION_FAILED |
| V07 | at most 30 grant operations per hour per vault through RateLimitPort (F12.S03.M03); withdrawals are never counted or refused | RATE_LIMITED |
| V08 | relay_register - the envelope signature verifies over JCS bytes with a registered, non-revoked device key of the author did (F16.S02.M02), the signer role is principal per F11.S01.M01 roleFor, and the payload has exactly the allowlisted fields | PRIVACY_CONSENT_STATEMENT_INVALID |
| V09 | relay_register - payload relayId equals the receiving relay, seq and prev extend the author's chain at this relay, and a grant whose cid already has a recorded withdrawal is refused | PRIVACY_CONSENT_STATEMENT_INVALID |
| V10 | relay_register - a withdrawal names in targetCid a grant of the same author, purpose and relay; an unknown targetCid is recorded so that grant is refused if it arrives later | PRIVACY_CONSENT_STATEMENT_INVALID |
| V11 | endpoint is present for chain_lookup and absent for every other purpose, and is an https origin without path, query, fragment or user info | VALIDATION_FAILED |
| V12 | privacy.consent.require and every consumer refuse processing for a purpose unless privacy.consent.check returns granted true for that purpose and scope (relayId, endpoint or recordKind); any check error counts as not granted | PRIVACY_CONSENT_REQUIRED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T01 | unit | PS-076-01.R01, PS-076-02.R01 | grant federation_publish, notify_email and notify_push for a canonical relayId and chain_lookup for an endpoint origin with the current hash; grant notify_email without relayId; grant notify_push with relayId relay.example.org | rows stored granted with scope.relayId or scope.endpoint; the federation grant has a signed statement; missing relayId and the hostname both return VALIDATION_FAILED |
| TEST-PS-076-09.T03 | unit | PS-076-02.R02, PS-076-02.R03, PS-076-02.R06 | rules V01 to V07, V11 and V12 violated in turn | documented error code and nothing stored |
| TEST-PS-076-09.T04 | unit | PS-076-02.R03 | fresh vault, check every one of the six purposes | all return granted false |
| TEST-PS-076-09.T08 | integration | PS-076-04.R03, PS-076-02.R03 | consumer without consent tries processing; error injected into check | processing blocked in both cases |
| TEST-PS-076-09.T18 | unit | PS-076-02.R04 | 100 withdrawals within one hour from UI, unsubscribe events and the deletion step across 5 relays | every withdrawal commits locally; none returns RATE_LIMITED; outgoing statements are coalesced to one batch per relay and none is dropped |
| TEST-PS-076-09.T19 | abuse | PS-076-02.R05, PS-076-04.R04 | relay_register with a replayed grant after its withdrawal, a grant addressed to another relay, a statement signed by a revoked key, a withdrawal naming another author's grant, an extra payload field, and a withdrawal that arrives before its grant | each refused with PRIVACY_CONSENT_STATEMENT_INVALID and the late grant refused; a valid statement is registered and its relay-signed acknowledgement moves the vault to peer_accepted |
| TEST-PS-076-09.T22 | integration | PS-076-04.R06, PS-076-04.R03, PS-076-02.R06 | vault composition with the kernel port registry double; F07.S01.M01 double calls ConsentCheckPort for federation_publish before a handle claim with and without a grant; F09.S01.M03 double calls privacy.consent.require for chain_lookup on a granted origin, another origin and with check failing; F06.S02.M02 double asks for location_precise without a grant | ConsentCheckPort answers exactly like privacy.consent.check; no depends_on edge from F07.S01.M01 is needed; the granted origin passes; the other origin, the failing check and the missing location consent return PRIVACY_CONSENT_REQUIRED with params purpose, endpoint or relayId and reason |

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
