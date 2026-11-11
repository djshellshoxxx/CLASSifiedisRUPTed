# PS-026-06 — Failure recovery and idempotency: Mixed-value compensation

**Status:** SPECIFIED (Stage 3). **Module:** [F02.S04.M01 Mixed-value compensation](SPEC.md) · **Scope:** MVP · **Code:** `packages/mutiny/src/value_balancing/mixed` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-026-06.R01** All commands are idempotent per CTR-IDM-001 and mutating commands carry expectedRevision.
- **PS-026-06.R02** The claim and the leg update are one IndexedDB transaction with the outbox entry, so a crash leaves either no claim or a complete one.
- **PS-026-06.R03** Payment evidence is never auto-confirmed, and a missing verifier or unreachable F09 service leaves legs due or claimed.

## Specification

- **idempotency:** Idempotency-Key replay 24 h; claim is idempotent by (compensationLegId, method) so a retry never creates a second PaymentClaim.
- **concurrency:** expectedRevision on leg mutations; Web Locks mutex per subjectId; the planner is a pure function so concurrent plan requests agree.
- **retries:** Claim statements go through the sync outbox with IDM-4 backoff (base 500 ms, cap 30 s, max 6 attempts per destination); acknowledgements are never retried by this module because they are not produced here.
- **offline:** propose and claim work offline and show pending; the payee sees the claim after delivery; acknowledgement arrives later and settlement is local to each vault.
- **partial failure:** If the Deal cannot be opened, the leg stays due with a retry flag and the cycle can still execute item legs; completion waits for settlement, and the UI states the missing step.

Baseline per [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-026-09.T10 | integration | PS-026-06.R01, PS-026-06.R02, PS-026-06.R03 | replay claim; crash mid-transaction; F09 unavailable | one PaymentClaim; no partial state; leg stays due |

## Dependencies

Module depends on: F02.S04.M02, F02.S04.M03, F02.S02.M03, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M03, F16.S02.M03, F15.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
