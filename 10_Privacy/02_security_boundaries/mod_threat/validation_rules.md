# PS-082-02 — Validation rules: Privacy threat model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M01 Privacy threat model](SPEC.md) · **Scope:** MVP · **Code:** `docs/privacy/threat_model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-082-02.R01** Every active threat entry must have at least one adversary, one control, one test and a non-empty residual-risk statement.
- **PS-082-02.R02** Control and test references must resolve to existing requirement IDs and test IDs.
- **PS-082-02.R03** The catalog must cover the mandatory topics list, and a topic without an active or retired entry fails the check.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | each active threat has adversaries, assets, attack description, residual risk, at least 1 control and at least 1 test | VALIDATION_FAILED |
| V02 | every control requirement ID exists in a module spec | VALIDATION_FAILED |
| V03 | every PRIVT test ID exists in a module spec test list or the privacy suite index | VALIDATION_FAILED |
| V04 | mandatory topics geolocation, metadata, sybil, social-graph, cycle-graph, relay-compromise, federated-peer, device, traffic-analysis, counterparty, auction-host, update-channel each have an entry | VALIDATION_FAILED |
| V05 | review date is within 90 days for the current release candidate | PRECONDITION_FAILED |
| V06 | residual risk text avoids the words anonymous and untraceable | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-082-09.T01 | unit | PS-082-01.R01, PS-082-01.R02, PS-082-02.R01 | run the check on the valid fixture and on one missing a test | valid passes with exit 0; invalid exits 1 naming the entry and rule |
| TEST-PS-082-09.T02 | unit | PS-082-01.R03, PS-082-02.R02 | catalog with a dangling PS requirement ID and unknown PRIVT ID | both reported with entry ID |
| TEST-PS-082-09.T03 | unit | PS-082-02.R03, PS-082-04.R01 | fixture with geolocation entry removed | check fails on missing mandatory topic |
| TEST-PS-082-09.T05 | unit | PS-082-03.R03, PS-082-02.R03 | residual risk accepted without reviewer or date | check fails |

## Dependencies

Module depends on: F10.S02.M02, F10.S02.M03, F10.S01.M01, CTR-PRV-001, CTR-FED-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
