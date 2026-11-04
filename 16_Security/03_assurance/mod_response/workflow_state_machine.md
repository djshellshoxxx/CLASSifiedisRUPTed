# PS-132-03 — Workflow state machine: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-03.R01** RB-01 key compromise. User device key: the user revokes it from another device or with the recovery kit within the same session (security.keyrecord.revoke, F16.S02.M02) and rotates (F16.S02.M01); contacts learn through relays as they sync; consents received in the claimed compromise window are labelled. Relay keys: within 15 minutes of confirmation rotate the relay signing and transport keys, publish revocation of the old key, re-sign the active role statements and policy statements, within 60 minutes publish a signed notice confirmed through a second channel, and within 24 hours review the audit log chain for the exposure window.
- **PS-132-03.R02** RB-02 relay breach. Within 15 minutes open a SEV1 or SEV2 incident (F16.S03.M02), within 30 minutes apply the read-only switch (RB-04), preserve disk and logs as read-only copies, rotate all relay secrets (F16.S01.M02) within 4 hours, rebuild from a clean image and restore data from the last verified backup within 24 hours, then verify audit chain anchors; users are told that vault data was never on the relay and that public projections, ciphertext, routing metadata and access token hashes are what the relay held.
- **PS-132-03.R03** RB-03 data leak notification. Within 24 hours determine data classes and the approximate number of affected users from the audit log and relay storage; record the notification decision in the incident; where personal-data breach notification may apply, prepare the regulator notice within the jurisdiction due time (default target 72 hours after awareness, F18.S01.M01) and send the signed user notice through mailboxes within 24 hours of the decision; the notice lists data classes, actions (rotate keys if keys could be affected, treat reports and metadata as exposed) and a contact route.
- **PS-132-03.R04** RB-04 read-only switch. Create the sentinel or set the environment value and send SIGHUP; within 5 seconds the command bus rejects non-exempt mutating commands with SECURITY_READ_ONLY_MODE and Retry-After 300; exempt commands are relay access challenge, session revoke, key revoke, incident commands, export queries and logout; vault outboxes keep statements prepared and the UI shows the relay as read-only; to lift, remove the sentinel, verify with the readiness check and drain outboxes at a rate of at most 50 statements per second per key.
- **PS-132-03.R05** RB-05 federation kill switch. Set flag F11 off for the relay tenant; within 60 seconds inbound POST /fed/v1/inbox returns FEATURE_DISABLED, outbound deliveries stop, in-flight batches abort or finish, and queued deliveries remain in the outbox up to 7 days; peers may also be suspended individually (F11.S03.M01); to restore, set the flag on, verify peer signatures on the first 100 inbound envelopes and re-enable peers one at a time.
- **PS-132-03.R06** RB-06 distributor or release key compromise. Publish a signed hold statement from the release key if still trusted or from the relay otherwise, instructing users not to activate updates; compare served bundle hashes with the signed release manifest; rotate the release signing key held offline, publish the new key fingerprint through at least three independent channels, release a rebuilt version with published reproducible hashes, and tell users how to verify the build hash shown in the app; users who updated during the window are advised to rotate their device key.
- **PS-132-03.R07** RB-07 postmortem. Blameless, due 7 days after resolution for SEV1 and SEV2: timeline, impact, detection, what went well and badly, root causes, contributing factors, action items each with owner and due date within 30 days, and threat register updates (F16.S03.M01); the summary is published to affected users in plain language.

## Specification

**Note:** No entity lifecycle. Runbook procedures are the workflows and are specified in the requirements below as numbered, time-targeted steps.

### Timeouts and scheduled transitions

- Key compromise relay key rotation within 15 minutes of confirmation; read-only propagation within 5 seconds; federation kill within 60 seconds.
- Tabletop drill at least every 6 months and before first public launch.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T03 | integration | PS-132-03.R04, PS-132-04.R02 | set read-only; submit listing publish, offer make, session revoke, key revoke, incident open | non-exempt return SECURITY_READ_ONLY_MODE within 5 s with retryAfterMs 300000; exempt succeed |
| TEST-PS-132-09.T04 | integration | PS-132-03.R05, PS-132-06.R01 | set federation flag off then on twice | inbound inbox returns FEATURE_DISABLED within 60 s; outbound stops; repeated toggles are no-ops with audit notes |
| TEST-PS-132-09.T06 | integration | PS-132-03.R01 | simulate relay key compromise with RB-01 steps in a staging relay | new keys active, old key revoked, role and policy statements re-signed, notice verifies with new key, durations within targets |
| TEST-PS-132-09.T07 | manual | PS-132-03.R02, PS-132-03.R03, PS-132-03.R06, PS-132-03.R07 | tabletop drill of RB-02, RB-03, RB-06 and RB-07 with two maintainers before each release | drill record with date, participants, gaps and action items; last drill date updated |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
