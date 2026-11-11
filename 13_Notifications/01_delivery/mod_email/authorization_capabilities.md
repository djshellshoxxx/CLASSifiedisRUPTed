# PS-102-05 — Authorization and capabilities: Email delivery

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S01.M02 Email delivery](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/delivery/email` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-102-05.R01** Relay policy lets only an active device key of the user add, remove and read its own address, and only with a granted email consent registered at that relay.
- **PS-102-05.R02** Verification is open to the holder of the unguessable token; send and bounce handling are internal to the relay and cannot be called by clients.
- **PS-102-05.R03** Relay operators can access ciphertext of addresses only through the transport adapter at send time; the UI states that the operator can read the address.
- **PS-102-05.R04** Bounce and complaint reports reach report_bounce only from the transport adapter after authentication, so no outside party can mark an address bouncing or withdraw a consent.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| notify.email.enable | local principal | vault policy; privacy.consent.check notify_email granted for relayId; local email ChannelConsent registered |
| notify.email.disable | local principal | vault policy; email target belongs to this vault |
| notify.email.sync_status | local principal | vault policy; own email targets only |
| notify.email.read_local | local principal | vault policy; own email targets only |
| notify.email.add | registered relay device | relay policy; request signed by an active device key of userDid; granted unexpired email consent registered here; one address per user |
| notify.email.verify | anonymous | relay public by unguessable token; 10 attempts per minute per IP prefix through RateLimitPort |
| notify.email.remove | registered relay device | signing key is an active device key of address.userDid; another user's address answers NOT_FOUND (ERR-4) |
| notify.email.send | relay service | relay internal; caller is the F13.S02.M01 gate |
| notify.email.report_bounce | relay service | relay internal; transport adapter only, after VERP, feedback-loop or webhook authentication |
| notify.email.read_own | registered relay device | active device key of the address owner |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-102-09.T07 | abuse | PS-102-05.R01, PS-102-05.R02, PS-102-05.R03 | add by unknown key; add and remove signed by a device key revoked in F16.S02.M02; verify with guessed token; external call to send; operator query for cleartext | UNAUTHENTICATED for unknown and revoked keys and the address unchanged; other calls refused or masked; no cleartext available except in the adapter at send time |
| TEST-PS-102-09.T17 | abuse | PS-102-07.R05, PS-102-05.R04 | forged DSN at the plain bounce address quoting a real Message-ID; DSN with a wrong VERP tag; ARF report from an unknown source; unsigned webhook | each refused NOTIFY_EMAIL_REPORT_UNVERIFIED; address stays verified; consent unchanged |
| TEST-PS-102-09.T19 | e2e | PS-102-07.R03, PS-102-05.R03, PS-102-07.R02 | open the email settings, the opt-in sheet and the example email preview | text says the relay operator can read the address it sends to, that email links the address to the pseudonym at that operator, and the preview shows only the generic subject and app link |

## Dependencies

Module depends on: F13.S02.M03, F16.S02.M02, F11.S01.M03, F07.S02.M01, F15.S01.M01, F15.S02.M01, F15.S04.M03, F12.S03.M03, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
