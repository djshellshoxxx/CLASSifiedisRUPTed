# PS-099-02 — Validation rules: Rate limiting

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M03 Rate limiting](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/rate` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-099-02.R01** Policy input is validated against bounded ranges so an operator cannot set unlimited rates.
- **PS-099-02.R02** The port validates its inputs and never throws; invalid input is treated as a denied request.
- **PS-099-02.R03** Every violation maps to one stable error code.
- **PS-099-02.R04** Registered classes and the request.default policy are validated against the same bounds as operator policies, a class has exactly one owner, and an owner's locked fail mode cannot be changed by an operator.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | limit 1..100000, periodMs 1000..2592000000, burst 1..1000 and at most limit for gcra, prefixMultiplier 1..20 | VALIDATION_FAILED |
| V02 | capabilityClass is a built-in class, a class registered through RatePolicyRegistry.register, or registered in the capability registry | VALIDATION_FAILED |
| V03 | classes relay.access, report.receive, report.receive.reduced, key.register and every class registered with failModeLocked (read.proximity.center_new) keep failMode closed | MODERATION_RATE_POLICY_FAIL_MODE_LOCKED |
| V04 | expectedRevision matches the stored policy revision | CONFLICT_REVISION |
| V05 | bucket reset targets a key hash that exists and is requested by an operator | NOT_FOUND |
| V06 | scope ip_prefix only with periodMs ≤ 86400000, window_counter only with periodMs ≥ 60000, and kind stock only with scope local | VALIDATION_FAILED |
| V07 | longWindow, when set, has limit 1..100000 and limit ≥ the class limit, periodMs greater than the class periodMs and at most 2592000000, and at most 86400000 when ip_prefix is in scopes | VALIDATION_FAILED |
| V08 | request.default keeps algorithm gcra, periodMs 60000 and limit 10..1200 per actor key | VALIDATION_FAILED |
| V09 | RatePolicyRegistry.register comes from the relay composition for the named ownerModule, the class is not built-in or registered by another module, and its defaults pass V01, V06 and V07 | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-099-09.T03 | unit | PS-099-02.R01, PS-099-02.R02, PS-099-02.R03 | policy with limit 0, burst 2000, periodMs of 31 days, ip_prefix scope on a 7-day window, fail open on relay.access; port called with malformed input | VALIDATION_FAILED four times, MODERATION_RATE_POLICY_FAIL_MODE_LOCKED; the port denies without throwing |
| TEST-PS-099-09.T19 | contract | PS-099-04.R07, PS-099-01.R05, PS-099-02.R04 | F06.S02.M03 contract fixture registers the four proximity classes with its v1 numbers (20 per minute and 200 per hour, 60 per minute and 600 per hour, a center_seen probe of 1 per 24 h, 2 new centers per hour and 5 per 24 h with failModeLocked); a second module registers read.proximity.center_new again; an operator sets failMode open on it | tenant rows seeded with ownerModule F06.S02.M03 and longWindow; VALIDATION_FAILED for the duplicate owner; MODERATION_RATE_POLICY_FAIL_MODE_LOCKED |
| TEST-PS-099-09.T22 | integration | PS-099-04.R08, PS-099-01.R05, PS-099-02.R04 | request.default at 120 per minute; one request consuming three classes; anonymous caller; set request.default to 5 and to 1500; tenant migration with requestRatePerMinutePerKey 300 | the request charges request.default once; the 121st request in a minute is RATE_LIMITED whatever its class; anonymous charged by prefix; VALIDATION_FAILED twice; expand step writes limit 300 periodMs 60000 |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
