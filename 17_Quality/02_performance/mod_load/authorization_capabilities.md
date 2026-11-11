# PS-139-05 — Authorization and capabilities: Load testing

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S02.M01 Load testing](SPEC.md) · **Scope:** MVP · **Code:** `tests/load` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-139-05.R01** The load driver authenticates its traffic to the test relay with relay access tokens from the challenge–response flow (CTR-CAP-001 CAP-10) using generated device keys, and the traffic never uses a relay operator or admin role; only the setup step (RatePolicy) and the metrics scraper hold a separate operator token of the throwaway test relay, minted per run and revoked at the end.
- **PS-139-05.R02** Rate limits are not disabled; the setup step raises the load tenant's limits through an F12.S03.M03 RatePolicy (moderation.ratepolicy.set on the test relay) and the report records the policy revision and values.
- **PS-139-05.R03** Load never runs against production hosts; the host allow list is enforced in code and by CI network rules.

## Specification

_None._

No runtime capabilities: this module runs only in developer shells and CI jobs with no relay session. Nothing here grants or checks CTR-CAP-001 capabilities, and test code never ships in the relay or PWA bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-139-09.T05 | abuse | PS-139-02.R03, PS-139-05.R03 | point the driver at a non-allow-listed host | QUALITY_LOAD_HOST_FORBIDDEN and exit 3 |
| TEST-PS-139-09.T09 | integration | PS-139-05.R01, PS-139-05.R02 | inspect tokens and limits used by traffic, setup and scraper | traffic uses device-key relay access tokens only; only setup and scraper used the per-run operator token, revoked at the end; RatePolicy revision and raised limits recorded in the report; rate limiting stayed enabled |

## Dependencies

Module depends on: CTR-OBS-001, CTR-TST-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, F17.S01.M01, F15.S02.M01, F15.S02.M03, F12.S03.M03, F11.S01.M02, F08.S01.M01, F04.S01.M02, F07.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
