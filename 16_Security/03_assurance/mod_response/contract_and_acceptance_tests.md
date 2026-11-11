# PS-132-09 — Contract and acceptance tests: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-09.R01** Every requirement of this module is covered by at least one automated test or a recorded drill.
- **PS-132-09.R02** Switch contracts are covered by integration tests against the relay with fixture modules.
- **PS-132-09.R03** The linter has fixtures for each error code.

## Specification

See the module test table below (all processes).

**Fixtures:** Relay fixture with command bus stub, F16.S01.M01 role fixtures (relay_operator R1, admin A1, tenant operator T1, member U), peer relay P, hosted vault V, outbox with 1 000 queued statements, runbook and template fixtures (valid and one per error), module spec fixtures for the inventory, fixed clock 2026-11-04T10:00:00Z.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T01 | unit | PS-132-01.R01, PS-132-02.R01, PS-132-02.R03, PS-132-04.R03, PS-132-09.R03 | lint the seven runbooks and each broken fixture | valid passes; each broken fixture yields its SECURITY_RUNBOOK_* code with runbook ID |
| TEST-PS-132-09.T02 | unit | PS-132-02.R02, PS-132-05.R01 | security.containment.set with empty reason, a 5-character reason, member U's key and tenant operator T1's key | VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN, FORBIDDEN |
| TEST-PS-132-09.T03 | integration | PS-132-01.R02, PS-132-01.R04, PS-132-03.R04, PS-132-04.R02, PS-132-09.R02 | set read-only; submit listing publish, offer make, identity.session.revoke, security.keyrecord.revoke, security.incident.open, security.roleassignment.revoke, platform.relay_identity.revoke, federation.peer.suspend and several queries | non-exempt commands return SECURITY_READ_ONLY_MODE within 5 s with retryAfterMs 300000; every exempt command ID succeeds; queries unaffected |
| TEST-PS-132-09.T04 | integration | PS-132-03.R05, PS-132-06.R01, PS-132-09.R02 | federation off then on twice; a request from peer P and one from hosted vault V to /fed/v1/inbox; a mailbox put and a consent statement during the kill | P gets FEATURE_DISABLED with reason federation_killed within 60 s; V's request accepted; outbound to peers paused; mailbox delivery and consent keep working; repeated toggles are no-ops with audit notes; no module flag changes |
| TEST-PS-132-09.T05 | chaos | PS-132-06.R02, PS-132-06.R03 | database down while applying read-only with --local; restart with the sentinel present; restart with RELAY_CONTAINMENT_READ_ONLY=1 after lifting | sentinel works without the database and the OS user is recorded, the audit entry is appended at the next start; read-only still active after restart; the environment value re-applies it at start with a warning |
| TEST-PS-132-09.T06 | integration | PS-132-03.R01 | simulate relay identity key compromise with RB-01 on a staging relay with the key file readable, then again with the key file deleted | first run: the revocation is signed by the compromised key and names successorRelayId equal to the relayId that --new-identity activates; second run: the revocation uses the pre-signed certificate (useCertificate true) and has no successorRelayId; both runs: the new identity's restore announcement and notice name the old relayId, role statements are re-signed by the new key, no rotation is signed by the compromised key, the vault shows the new relay as unverified until the fingerprint is confirmed, durations within targets |
| TEST-PS-132-09.T07 | manual | PS-132-03.R02, PS-132-03.R03, PS-132-03.R06, PS-132-03.R07 | tabletop drill of RB-02, RB-03, RB-06 and RB-07 with two maintainers before each release | drill record with date, participants, gaps and action items; last drill date updated |
| TEST-PS-132-09.T08 | abuse | PS-132-05.R01, PS-132-05.R02, PS-132-05.R03, PS-132-07.R03 | member invokes containment; relay_operator toggles 11 times in an hour; single admin grants admin to self; documentation change approved only by its author | FORBIDDEN; 11th RATE_LIMITED; FORBIDDEN; merge blocked |
| TEST-PS-132-09.T09 | abuse | PS-132-07.R01, PS-132-01.R03 | notice text claiming no data was accessed without an evidence reference; document with 'externally audited'; runbook containing a token-like string | rejected by template validation; SECURITY_RUNBOOK_FORBIDDEN_CLAIM; F16.S01.M02 secret scan fails |
| TEST-PS-132-09.T10 | integration | PS-132-03.R04, PS-132-06.R01 | outbox of 1 000 statements during read-only then lift | statements stay prepared; drained at 50 per second per key; none lost or duplicated |
| TEST-PS-132-09.T11 | load | PS-132-08.R01, PS-132-08.R02, PS-132-08.R03 | 1 000 requests per second during toggle on a staging relay | propagation ≤ 5 s; overhead ≤ 0.1 ms; gauges correct |
| TEST-PS-132-09.T12 | unit | PS-132-09.R01 | traceability tool run | every PS-132 requirement maps to a passing test or a recorded drill |
| TEST-PS-132-09.T13 | integration | PS-132-10.R01, PS-132-10.R02, PS-132-10.R03 | export runbooks and templates, import into fork, schema bump; restore a relay backup taken while read-only | linter results identical; old version parsed for 180 days; restored relay stays read-only |
| TEST-PS-132-09.T14 | unit | PS-132-08.R03 | drill record dated 7 months ago | SECURITY_RUNBOOK_DRILL_STALE and gate failed |
| TEST-PS-132-09.T15 | integration | PS-132-04.R01, PS-132-04.R04, PS-132-07.R03 | CLI containment read-only on signed with R1's device key; get_status | sentinel written; audit entry with reason and actor; rate limit counted; status shows since-time, actor and propagation result |
| TEST-PS-132-09.T16 | unit | PS-132-02.R04, PS-132-03.R02, PS-132-01.R03 | RB-02 template inventory against the generated inventory; template without push subscriptions; template without contact route | match; SECURITY_RUNBOOK_INVENTORY_MISMATCH; SECURITY_RUNBOOK_INCOMPLETE |
| TEST-PS-132-09.T17 | integration | PS-132-07.R02 | documentation retention job with drill records 2 years and 1 day old and 1 year old | the older is removed; the younger kept |

## Acceptance criteria

- All automated tests pass in CI and a drill record dated within 6 months exists for the release.
- Read-only mode takes effect within 5 seconds and federation kill within 60 seconds in the staging test, and the kill switch leaves mailboxes and consent working.
- Runbooks contain no dangling references, no claim of audit or certification, and an RB-02 inventory that matches the module specs.

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, F15.S02.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
