# PS-101-05 — Authorization and capabilities: Fraud signals

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M02 Fraud signals](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/signals` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-101-05.R01** Vault policy: only the local principal can read and add signals in its vault, and signals derive only from events produced by verified local state or verified signed statements.
- **PS-101-05.R02** Relay policy: moderators read signals on that relay for open cases, operators read summaries, and subjects can read category counts about themselves on that relay.
- **PS-101-05.R03** Signals about a subject are never returned to other members or federated.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| moderation.signal.record_manual | local principal, moderator | vault unlocked, or relay moderator with open case; subject differs from actor |
| moderation.signal.read_as_reviewer | local principal, moderator | vault unlocked, or relay moderator with open case on the subject |
| moderation.signal.read_summary | local principal, moderator, operator | vault unlocked, or relay role; used by F12.S03.M01 in-process |
| moderation.signal.read_categories | local principal, member | vault unlocked, or subject reading own categories on a relay |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-101-09.T06 | abuse | PS-101-05.R01, PS-101-05.R02, PS-101-05.R03 | other member queries signals; relay moderator without case; subject reads own categories | NOT_FOUND, FORBIDDEN, categories only |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
