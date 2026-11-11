# PS-135-07 — Privacy, retention and abuse: Integration testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S01.M03 Integration testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/integration` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-135-07.R01** Integration data is synthetic and actors are generated pseudonyms; public locations are L2 cells, and synthetic L3 cells and L4 points marked P3 (meetup point, home address) are seeded into participant vaults so canary-leak checks prove they never reach public views, search documents, federation envelopes, relay storage or logs.
- **PS-135-07.R02** The suite asserts that private-message payloads and P3 fields never appear in public views, federation exports or event payloads marked P0.
- **PS-135-07.R03** Logs from the relay in tests are captured and scanned: a canary P3 value must never appear.

## Specification

**Data classification**
- Synthetic P0–P3 test data inside in-memory vaults only, including P3-marked L3 and L4 canaries; relays hold only P0 projections, ciphertext and receipts.
- Reports: step names, event types, IDs.

**Retention**
- In-memory databases die with the process; reports kept 14 days as CI artifacts.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Test data accidentally includes real personal data | fixtures are generated; the same lint as F17.S01.M01 runs on the integration folder |
| T02 | Flow leaks a P3 or message payload into a report or log | report writer whitelists fields (step name, event type, IDs); canary P3 value scanned in captured logs |
| T03 | Fake port reused in production by mistake | fake ports live only under tests/integration and the production dependency rule forbids importing from tests/ |

**Abuse controls**
- The harness forbids sleeping on real time (setTimeout over 50 ms) in flow code.
- Disabling a flow requires editing the flow list in code-owned config and fails the QUALITY_IT_FLOW_MISSING rule.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-135-09.T02 | integration | PS-135-01.R02, PS-135-01.R03, PS-135-07.R01 | run flows and inspect reports | no row writes by fixtures in flow files; report holds only step names, types, IDs |
| TEST-PS-135-09.T09 | abuse | PS-135-05.R03, PS-135-07.R02, PS-135-07.R03 | import fake port from production code; capture relay logs during every flow and scan them for the P3 canary | import rejected; canary absent from captured relay logs, exports and P0 payloads |
| TEST-PS-135-09.T29 | abuse | PS-135-07.R01, PS-135-07.R02 | canary leak - P3-marked L4 meetup point and L3 cell seeded in vaults during sale_local and cycle_three | public views, search documents, federation envelopes, relay storage and logs hold only cells of at most 5 characters; the canaries are absent |

## Dependencies

Module depends on: CTR-TST-001, CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-IDM-001, CTR-COM-001, CTR-FED-001, CTR-ID-001, CTR-PRV-001, CTR-CAP-001, CTR-IOX-001, F17.S01.M01, F15.S02.M02, F15.S02.M03, F15.S01.M01, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S02.M03, F09.S01.M01, F09.S01.M03, F16.S02.M02, F07.S02.M01, F10.S01.M03, F06.S02.M01. Predecessor: [domain_schema.md](domain_schema.md).
