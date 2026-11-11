# PS-129-08 — Observability and performance: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-08.R01** Relay registry operations and list polls are measured per CTR-OBS-001 without key material labels; the vault keeps local diagnostics only.
- **PS-129-08.R02** get_status meets p95 ≤ 5 ms in a vault and ≤ 10 ms on a relay at 1 000 queries per second.
- **PS-129-08.R03** Freshness age distribution is observable to detect stale revocation sources.

## Specification

**Metrics**
- classrup_security_key_registry_keys{status} (gauge, relay)
- classrup_security_key_revocations_total{reason}
- classrup_security_revocation_poll_age_ms{source_class=relay|peer} (gauge)
- classrup_security_key_status_queries_total{freshness=fresh|stale|unknown}

**Logs**
- relay info key.revoked {keyRecordId, reason, correlationId} — no public key bytes beyond ID.

**Budgets**
- get_status p95 ≤ 5 ms (vault) and ≤ 10 ms (relay); register and revoke p95 ≤ 300 ms.
- Revocation list of 100 000 entries is served in ≤ 2 s using pagination of 500.

Conventions per [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T13 | load | PS-129-08.R01, PS-129-08.R02, PS-129-08.R03 | 1 000 status queries per second for 5 minutes; list of 100 000 revocations | p95 targets met; list served ≤ 2 s |

## Dependencies

Module depends on: F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
