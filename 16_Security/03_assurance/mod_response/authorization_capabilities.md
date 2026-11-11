# PS-132-05 — Authorization and capabilities: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-05.R01** Only relay_operators and admins of the relay (relay-scope F16.S01.M01 roles) apply the read-only and federation switches through signed requests, the host-only --local path is limited to a relay whose database is unavailable and records the OS user, and every change is written to the audit log with the reason.
- **PS-132-05.R02** Documentation edits require two maintainer approvals like the threat register.
- **PS-132-05.R03** Users cannot trigger containment of a relay; they can only report issues through incident channels and revoke their own keys.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| security.containment.set | relay_operator, admin | relay-scope role on this relay; request signed by an active device key; reason required; at most 10 changes per hour per key; host --local only while the database is unavailable |
| security.containment.read | relay_operator, admin | relay-scope role on this relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T02 | unit | PS-132-02.R02, PS-132-05.R01 | security.containment.set with empty reason, a 5-character reason, member U's key and tenant operator T1's key | VALIDATION_FAILED, VALIDATION_FAILED, FORBIDDEN, FORBIDDEN |
| TEST-PS-132-09.T08 | abuse | PS-132-05.R01, PS-132-05.R02, PS-132-05.R03, PS-132-07.R03 | member invokes containment; relay_operator toggles 11 times in an hour; single admin grants admin to self; documentation change approved only by its author | FORBIDDEN; 11th RATE_LIMITED; FORBIDDEN; merge blocked |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
