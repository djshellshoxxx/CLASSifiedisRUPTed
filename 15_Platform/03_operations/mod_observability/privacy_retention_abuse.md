# PS-121-07 — Privacy, retention and abuse: Observability

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S03.M01 Observability](SPEC.md) · **Scope:** MVP · **Code:** `packages/kernel/src/observability` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-121-07.R01** Redaction drops keys token, secret, password, privateKey, recoveryCode, email, address, lat, lon, note, body and ciphertext case-insensitively, plus authorization, cookie, passphrase and names ending in token, secret, password, email, address, note or body, at any depth.
- **PS-121-07.R02** IP addresses are truncated to /24 for IPv4 and /48 for IPv6 in logs, under IP keys and as bare values, including IPv4-mapped and compressed IPv6 forms.
- **PS-121-07.R03** The PWA sends no telemetry; vault log lines stay in a bounded ring buffer until the user exports them as JSON Lines.

## Specification

**Data classification**
- Log lines: IDs, codes, durations and redacted fields only (no P2–P4 values, OBS-1).
- Metrics: aggregate counts with allowlisted labels; no user identifiers.
- Readiness: booleans and lag in ms.

**Retention**
- Relay logs: RET-AUDIT (1 year) in the operator's pipeline.
- Vault diagnostics: in memory only, cleared on reload or by the user; exported files are the user's.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Secrets or contact data written to logs by careless fields | key deny list with suffix matching applied to every line before the sink |
| T02 | IP-based tracking of users through relay logs | /24 and /48 truncation for IP keys and bare IP values |
| T03 | Metric label cardinality used to fingerprint users or exhaust memory | label allowlist without user IDs; 1 000 series cap per metric with a dropped counter |
| T04 | Public scraping of operational data | /metrics requires platform.metrics.read; health endpoints expose booleans only |

**Abuse controls**
- Strings longer than 2 048 characters are truncated in logs to bound line size.
- Recursion depth is limited to 8 and circular references are replaced so hostile objects cannot stall logging.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-121-09.T01 | unit | PS-121-07.R01, PS-121-09.R01 | object with every deny-listed key, suffix variants, nested arrays, an error, a cycle and a bigint | only safe keys remain; error keeps name, message and code; cycle marked |
| TEST-PS-121-09.T02 | unit | PS-121-07.R02, PS-121-09.R01 | IPv4, full and compressed IPv6, IPv4-mapped, zone IDs, invalid strings, forwarded lists | /24 and /48 networks; invalid IP under an IP key redacted; non-IPs untouched |
| TEST-PS-121-09.T11 | unit | PS-121-04.R03, PS-121-07.R03, PS-121-10.R01 | ring buffer of 3 receives 5 lines with an email field, export and clear | last 3 lines kept; JSON Lines export without the email; empty after clear |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001, CTR-ERR-001, CTR-TST-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
