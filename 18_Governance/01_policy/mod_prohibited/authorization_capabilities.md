# PS-146-05 — Authorization and capabilities: Prohibited items

**Status:** SPECIFIED (Stage 3). **Module:** [F18.S01.M02 Prohibited items](SPEC.md) · **Scope:** MVP · **Code:** `packages/governance/src/policy/prohibited` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-146-05.R01** Vault policy: authoring and releasing require the publisher key; apply is available to the vault owner for trusted publishers; evaluate is callable by the owner and internal callers F01.S01.M02 and F01.S01.M03.
- **PS-146-05.R02** Relay policy (CAP-9): a relay evaluates its own rule pack on index submissions and may refuse or remove content from its index with a signed statement of reasons; this has no effect on other relays or on the author's vault.
- **PS-146-05.R03** There is no global rule authority; each user chooses which publishers to trust.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| governance.prohibited_rule.author | owner | local principal holds the publisher key; rule status draft |
| governance.prohibited_rule.release | owner | local principal is the publisher; proposal verified or emergency review rule; signing key unrevoked |
| governance.prohibited_rule.apply | owner | vault unlocked; pack signature valid and publisher trusted or trusted in the same action |
| governance.prohibited_rule.evaluate | owner | vault unlocked; internal callers F01.S01.M02 and F01.S01.M03 on the owner's behalf |
| governance.prohibited_rule.read | owner | vault unlocked; reads the local mirror |
| governance.prohibited_rule.relay_read | relay-anonymous | relay policy: public read of the latest pack; sensitive keywords returned as hashes; 60 requests per minute per IP prefix |
| governance.prohibited_rule.relay_publish | relay-operator | relay policy: request signed by the operator device key; pack <= 1 MiB |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-146-09.T08 | abuse | PS-146-05.R01, PS-146-05.R02, PS-146-05.R03 | untrusted publisher pack; non-publisher release; relay removal | pending or FORBIDDEN; relay removal affects only that relay |

## Dependencies

Module depends on: F18.S01.M03, F18.S01.M01, F18.S02.M01, F16.S02.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001. Predecessor: [domain_schema.md](domain_schema.md).
