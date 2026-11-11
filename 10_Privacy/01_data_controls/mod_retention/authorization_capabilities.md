# PS-079-05 — Authorization and capabilities: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-05.R01** Under vault policy (CAP-8) only the unlocked principal changes policy or runs sweeps for its own vault; legal hold commands do not exist there.
- **PS-079-05.R02** Under relay policy (CAP-9) only operators and admins of that relay request, approve, reject and release holds, with two different, unlinked people for each pair of steps and at least one admin in each pair (CTR-PRV-001, CAP-4).
- **PS-079-05.R03** Hold records are visible to relay operators and admins only; hold status is never exposed to users beyond a generic retained-under-legal-obligation notice without case details.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| privacy.retention_policy.set | local-principal, operator, admin | vault owner for vault scope within user bounds; relay operator or admin for relay scope |
| privacy.retention_policy.read | local-principal, anonymous | vault owner for vault scope; relay policy is public read-only |
| privacy.retention.run | local-principal, operator, admin | vault owner for vault scope; relay operator or admin for relay scope; at most 6 runs per day |
| privacy.legal_hold.request | operator, admin | relay role; reason code and reference supplied; at most 10 per operator per day |
| privacy.legal_hold.approve | operator, admin | relay role; actor differs from and is not linked to the requester; at least one of requester and actor is admin |
| privacy.legal_hold.release_request | operator, admin | relay role; hold active |
| privacy.legal_hold.release_approve | operator, admin | relay role; actor differs from and is not linked to the release requester; at least one of the pair is admin |
| privacy.legal_hold.check | relay-system, operator, admin | in-process call by the relay-system actor from purge and tombstone handlers and from privacy.deletion.relay_apply (F10.S01.M04); operators and admins from the console |
| privacy.legal_hold.read | operator, admin | relay role |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T09 | abuse | PS-079-05.R01, PS-079-05.R02, PS-079-05.R03 | member calls relay hold commands; vault called with hold command; user asks for hold status; relay-system calls check | FORBIDDEN or not exposed; generic notice only; relay-system check allowed |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
