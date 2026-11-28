# PS-107-09 — Contract and acceptance tests: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-107-09.R02** Contract tests check commands, statements and event payloads against the schema registry.
- **PS-107-09.R03** Send-path tests assert that no push or email leaves without a granted registered consent.
- **PS-107-09.R04** The screens listed under ux meet the listed a11y items, verified by an axe scan with zero serious issues, a keyboard and screen-reader walk-through and a no-JavaScript run of the unsubscribe page.

## Specification

See the module test table below (all processes).

**Fixtures:** Vault U with devices A and B, relay R offering push and email with relay key chain k1 and k2, relay R2 offering push only, relay B with its own key, privacy consents PC1 (notify_push at R) and PC2 (notify_email at R) granted through a privacy.consent.check double, F16.S02.M02 registry double with an active and a revoked key, fake push and email modules on R, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T01 | unit | PS-107-01.R01, PS-107-01.R02, PS-107-02.R01 | opt in to push on R, withdraw, then re-grant | first record withdrawn terminal; re-grant creates a new record; statement signed and carries privacyConsentId, privacyPurpose and relayKeyId |
| TEST-PS-107-09.T02 | unit | PS-107-02.R03, PS-107-02.R02, PS-107-01.R03 | each rule V01 to V09 violated in turn including email on R2, a token that does not verify, and a reused valid token | documented error code returned; the reused token returns 200 withdrawn unchanged; state unchanged otherwise |
| TEST-PS-107-09.T03 | property | PS-107-03.R01, PS-107-03.R02, PS-107-03.R03 | random sequences of opt in, opt out, expiry, unsubscribe and privacy withdrawal | terminal states never change; withdrawal always wins over grant; every relay-side withdrawal emits a relay-local opted_out |
| TEST-PS-107-09.T04 | contract | PS-107-04.R01, PS-107-04.R02, PS-107-09.R02, PS-107-01.R04 | each command and query executes in its environment | outputs, statements, receipts and event payloads validate against registry schemas; statement schemas differ from the record schemas; relay events in the SQLite transaction of the change |
| TEST-PS-107-09.T05 | integration | PS-107-04.R03, PS-107-02.R04 | privacy.consent.withdrawn for notify_email at R; privacy.consent.granted superseding PC1 then withdrawn | only email at R withdrawn with via privacy_withdrawal; push consent re-linked to the new F10 ID and withdrawn when the new grant is withdrawn |
| TEST-PS-107-09.T06 | abuse | PS-107-05.R01, PS-107-05.R02, PS-107-05.R03 | forged opt-in from another user's key; unsubscribe attempting to grant; operator trying to create a consent | rejected in each case; operator withdrawal produces a relay_policy receipt |
| TEST-PS-107-09.T07 | integration | PS-107-06.R01, PS-107-06.R02, PS-107-06.R03, PS-107-03.R04 | register twice, unsubscribe twice, vault offline during a relay unsubscribe then list_changes | single registration and one receipt; peer_accepted only after the acceptance signature; apply_relay_change withdraws with via unsubscribe_link |
| TEST-PS-107-09.T08 | abuse | PS-107-07.R01, PS-107-07.R02 | 11th unsubscribe in a minute; token guessing run of 10 000 attempts; inspect logs and the relay database | RATE_LIMITED, no success, no tokens stored or logged; only redeemed markers, which a fake clock shows purged 365 days after withdrawal |
| TEST-PS-107-09.T09 | integration | PS-107-09.R03, PS-107-04.R02 | dispatch with no consent, withdrawn consent and expired consent; then an email unsubscribe link at R | relay sends nothing in each case; after the link no address ciphertext remains at R within 24 h and no push subscription of U remains after a push withdrawal |
| TEST-PS-107-09.T10 | load | PS-107-08.R01, PS-107-08.R02, PS-107-08.R03 | 50 register and unsubscribe per second for 2 minutes and sweep 100 000 | budgets met |
| TEST-PS-107-09.T11 | unit | PS-107-09.R01 | traceability tool run | every PS-107 requirement maps to a passing test |
| TEST-PS-107-09.T12 | integration | PS-107-10.R01, PS-107-10.R02, PS-107-10.R03 | export, import into fresh vault, restore relay from backup | consents round trip; imported granted consents are re-registered only after user confirmation |
| TEST-PS-107-09.T13 | a11y | PS-107-09.R04 | settings and unsubscribe page with screen reader, keyboard and without JavaScript | switches labelled, page works, zero serious axe issues |
| TEST-PS-107-09.T14 | abuse | PS-107-04.R04, PS-107-02.R01, PS-107-07.R04 | withdrawal receipt signed by relay B for a consent at R; receipt signed by a user device key; consent statement whose audience key is not R's key; R rotated to k2 and signs with k2 within 7 days and with k1 after 8 days | B's and the device-signed receipts refused NOTIFY_CHANNEL_RECEIPT_INVALID; wrong audience refused VALIDATION_FAILED; k2 accepted; stale k1 refused |
| TEST-PS-107-09.T15 | integration | PS-107-02.R05, PS-107-04.R05 | enable push before the registration is accepted; then after acceptance; email module renders a List-Unsubscribe URL and a complaint arrives | push enable refused PRECONDITION_FAILED then accepted; UnsubscribeTokenPort URL verifies; complaint withdraws through RelayWithdrawalPort with via unsubscribe_link |
| TEST-PS-107-09.T16 | integration | PS-107-03.R05, PS-107-04.R06 | deletion requested, cancel on day 13; a second request executed; DeletionPort plan, export section and retention purge with F10 doubles | during grace consents show paused and nothing reaches relays; cancel restores granted with no event; at execution withdrawals with via account_deletion are queued to every relay before destroy_keys; section exported; records pseudonymized when kept |
| TEST-PS-107-09.T17 | integration | PS-107-03.R03 | consent passes expiresAt while the app is closed | relay sweep expires it, issues a receipt with via expired and emits relay-local opted_out; vault applies it on next sync with via expired |
| TEST-PS-107-09.T18 | e2e | PS-107-07.R03, PS-107-07.R01 | fresh vault opens Channels settings and the opt-in sheet, refuses, reopens after 1 and 31 days; inspect the consent record | both channels not enabled by default; sheet text names the relay and what it learns; no re-prompt before 30 days; record holds no address or endpoint |
| TEST-PS-107-09.T19 | contract | PS-107-01.R05, PS-107-04.R04 | opt in to email at R; register a statement lacking privacyConsentId, one lacking privacyPurpose and a valid one; capture all relay-bound traffic | record, statement and registration carry privacyConsentId and privacyPurpose notify_email; incomplete statements refused at the relay; the only relay-facing consent artifact is classrup.notify.channel_consent_statement/v1 and no F10 statement is sent |
| TEST-PS-107-09.T20 | integration | PS-107-03.R06, PS-107-03.R03 | push consent at R reaches 351 days, then expiresAt, with PC1 still granted; user reconfirms; a second run where PC1 was withdrawn before reconfirmation | prompt names the channel only; reconfirmation creates a new record and statement linked to PC1 without any F10 prompt or change; opted_out via expired leaves PC1 granted; with PC1 withdrawn the F10 grant flow is shown instead of reconfirm |

## Acceptance criteria

- All tests T01 to T20 pass in CI.
- No push or email is ever sent without a granted, unexpired, registered consent.
- Unsubscribe works with one click and no login, cannot grant consent, and reaches the vault as a relay-signed receipt.

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, F07.S02.M01, F11.S01.M01, F11.S03.M01, F15.S01.M01, F15.S02.M01, F16.S02.M02, F12.S03.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
