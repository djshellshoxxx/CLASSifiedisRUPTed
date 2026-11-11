# PS-076-09 — Contract and acceptance tests: Privacy consent

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M01 Privacy consent](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/consent` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-076-09.R01** Every requirement is covered by at least one automated test.
- **PS-076-09.R02** Contract tests validate command outputs, statements and event payloads against the schema registry.
- **PS-076-09.R03** Default-off behavior is covered by a test that enumerates every purpose on a fresh vault.

## Specification

See the module test table below (all processes).

**Fixtures:** Fresh vault; bundled policies for six purposes with fixed hashes; relay double with canonical relayId relay:3fz7hq2wkmpd5ra6t4ncxb7ygu and a key registry; verifier endpoints https://esplora.example.net and https://node.example.org; F07.S01.M01, F09.S01.M03, F13.S02.M03 and F06.S02.M02 doubles; kernel port registry double; network capture double; fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-076-09.T01 | unit | PS-076-01.R01, PS-076-02.R01 | grant federation_publish, notify_email and notify_push for a canonical relayId and chain_lookup for an endpoint origin with the current hash; grant notify_email without relayId; grant notify_push with relayId relay.example.org | rows stored granted with scope.relayId or scope.endpoint; the federation grant has a signed statement; missing relayId and the hostname both return VALIDATION_FAILED |
| TEST-PS-076-09.T02 | unit | PS-076-01.R02, PS-076-03.R01 | grant, regrant with new version, withdraw | history keeps three rows with statuses superseded, then withdrawn; none edited |
| TEST-PS-076-09.T03 | unit | PS-076-02.R02, PS-076-02.R03, PS-076-02.R06 | rules V01 to V07, V11 and V12 violated in turn | documented error code and nothing stored |
| TEST-PS-076-09.T04 | unit | PS-076-02.R03 | fresh vault, check every one of the six purposes | all return granted false |
| TEST-PS-076-09.T05 | property | PS-076-03.R01, PS-076-03.R02 | random grant and withdraw sequences | at most one granted row per purpose and relay; withdrawn rows never return to granted |
| TEST-PS-076-09.T06 | integration | PS-076-03.R03 | change policy hash with materialChange for a federation consent | consent lapses at unlock, privacy.consent.withdrawn emitted with reason policy_changed, check returns false, and a withdrawal statement naming the grant cid is queued for the relay |
| TEST-PS-076-09.T07 | contract | PS-076-04.R01, PS-076-04.R02, PS-076-09.R02 | execute each command and query, including relay_register and relay_check on a relay double | outputs, statements and events validate against registry schemas; events are in the same transaction as the state change |
| TEST-PS-076-09.T08 | integration | PS-076-04.R03, PS-076-02.R03 | consumer without consent tries processing; error injected into check | processing blocked in both cases |
| TEST-PS-076-09.T09 | integration | PS-076-04.R03, PS-076-03.R01 | notify.channel.opted_out delivered with via unsubscribe_link, settings, expired, account_deletion, privacy_withdrawal and relay_policy, for a matching and a non-matching relay | withdrawn only for unsubscribe_link (source unsubscribe) and settings (source ui) on the matching purpose and relay; every other case ignored; an already withdrawn consent and a replay are no-ops |
| TEST-PS-076-09.T10 | abuse | PS-076-05.R01, PS-076-05.R02, PS-076-05.R03 | another module of a different vault tries to read; relay tries to alter | no access; statements from non-owner rejected |
| TEST-PS-076-09.T11 | integration | PS-076-06.R01, PS-076-06.R02, PS-076-06.R03 | replay command ID; relay offline during withdrawal | original result; local processing stops at once; UI shows prepared |
| TEST-PS-076-09.T12 | abuse | PS-076-07.R02, PS-076-07.R03 | 31 grants in an hour; UI inspection of the grant sheet | 31st grant RATE_LIMITED; no pre-ticked control; limits of withdrawal stated |
| TEST-PS-076-09.T13 | load | PS-076-08.R01, PS-076-08.R02, PS-076-08.R03 | 10 000 checks and 100 changes | check p99 ≤ 2 ms, propagation ≤ 1 s, no telemetry sent |
| TEST-PS-076-09.T14 | a11y | PS-076-07.R02 | privacy settings and grant sheet | axe zero serious issues; keyboard-only completion; switches announced |
| TEST-PS-076-09.T15 | unit | PS-076-09.R01, PS-076-09.R03 | traceability tool run | every PS-076 requirement maps to a passing test |
| TEST-PS-076-09.T16 | integration | PS-076-10.R01, PS-076-10.R02, PS-076-10.R03 | export, import with unknown policy hash, roll back one release | history round-trips; unknown hash imports as lapsed |
| TEST-PS-076-09.T17 | contract | PS-076-01.R03, PS-076-01.R04, PS-076-07.R01 | capture every byte leaving the vault through network and relay doubles during grant, withdraw, lapse, deletion step and export | the only consent data leaving the vault are consent_statement and consent_withdrawal envelopes whose payload has exactly the allowlisted fields with the did only as envelope author, plus the user's export; no PrivacyConsent row leaves the vault |
| TEST-PS-076-09.T18 | unit | PS-076-02.R04 | 100 withdrawals within one hour from UI, unsubscribe events and the deletion step across 5 relays | every withdrawal commits locally; none returns RATE_LIMITED; outgoing statements are coalesced to one batch per relay and none is dropped |
| TEST-PS-076-09.T19 | abuse | PS-076-02.R05, PS-076-04.R04 | relay_register with a replayed grant after its withdrawal, a grant addressed to another relay, a statement signed by a revoked key, a withdrawal naming another author's grant, an extra payload field, and a withdrawal that arrives before its grant | each refused with PRIVACY_CONSENT_STATEMENT_INVALID and the late grant refused; a valid statement is registered and its relay-signed acknowledgement moves the vault to peer_accepted |
| TEST-PS-076-09.T20 | integration | PS-076-04.R04, PS-076-01.R01 | cross-module contract with F13.S02.M03 and F06.S02.M02 doubles: grant notify_email for relay A, F13 opt-in, F13 channel expiry after 365 days; grant location_precise | the channel consent carries consentId and purpose; no F10 statement is sent for notify_*; channel expiry leaves the F10 consent granted; the location_precise grant shares nothing until an explicit per-share action |
| TEST-PS-076-09.T21 | integration | PS-076-04.R05 | deletion DeletionPort plan and execute, retention purge port and export section with stub registries; cancel during grace | plan lists consent rows; cancel leaves every consent unchanged and queues no relay statement; execute withdraws all with source deletion and signs the federation withdrawals before the destroy_keys step; purge removes rows 2 years after withdrawal; section privacy.consents exported |
| TEST-PS-076-09.T22 | integration | PS-076-04.R06, PS-076-04.R03, PS-076-02.R06 | vault composition with the kernel port registry double; F07.S01.M01 double calls ConsentCheckPort for federation_publish before a handle claim with and without a grant; F09.S01.M03 double calls privacy.consent.require for chain_lookup on a granted origin, another origin and with check failing; F06.S02.M02 double asks for location_precise without a grant | ConsentCheckPort answers exactly like privacy.consent.check; no depends_on edge from F07.S01.M01 is needed; the granted origin passes; the other origin, the failing check and the missing location consent return PRIVACY_CONSENT_REQUIRED with params purpose, endpoint or relayId and reason |
| TEST-PS-076-09.T23 | integration | PS-076-01.R01, PS-076-04.R04 | notify.channel.opted_out with via unsubscribe_link for the canonical relayId of the granted notify_email consent and for a hostname of the same relay | the canonical relayId withdraws the consent; the hostname matches nothing and the consent stays granted |

## Acceptance criteria

- All tests T01 to T23 pass in CI.
- On a fresh vault every purpose reports not granted and no consumer processes for any purpose.
- Withdrawal stops in-vault processing within 1 second, is never refused, and the UI states that copies cannot be recalled.
- Exactly one relay-facing statement exists per relay-scoped purpose, and relays refuse replayed, cross-relay or revoked-key statements.

## Dependencies

Module depends on: F07.S01.M01, F11.S01.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S02.M02, F10.S01.M02, F10.S01.M03, F10.S01.M04, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
