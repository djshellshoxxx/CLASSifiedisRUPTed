# PS-127-07 — Privacy, retention and abuse: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-07.R01** Secret values are P4 and are never logged, never serialized, never in metrics labels, never in error messages, and never in crash reports.
- **PS-127-07.R02** Secret metadata (name, source, length, loaded time) is not secret and may be logged.
- **PS-127-07.R03** Leak attempts through logs, errors, process listings, core dumps and repository history are addressed by redaction, file loading, disabled core dumps and scanning.

## Specification

**Data classification**
- Secret values: P4 in process memory only.
- Secret metadata: P1 operational.

**Retention**
- Secrets are not stored by the product; the hosting environment owns their lifecycle.
- CI scan reports: 90 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Secret leaks through logs or exceptions | Secret wrapper redacts on toString, JSON, inspect and error causes; logger applies key deny-list and pattern scanner; tests inject known secrets and assert absence |
| T02 | Timing attack on token comparison | equalConstantTime used for all token and MAC comparisons; direct equality on secrets is a lint error |
| T03 | Secret committed to the repository | pre-merge diff scan, weekly full-history scan, forbidden filename patterns (.env, *.pem, *.key) in CI |
| T04 | Environment variables exposed via process listing or crash dump | file-based loading recommended and default in container manifests; core dumps disabled; /proc access restricted by deployment guide |
| T05 | Stolen token database | only SHA-256 hashes of 256-bit tokens stored; tokens are never recoverable |
| T06 | Weak operator-chosen secrets | manifest minimum lengths enforced at startup (32 bytes for keys) |

**Abuse controls**
- Failed secret loads do not retry in a loop: the relay exits non-zero after one attempt so orchestrators surface the failure.
- Scanner rules are versioned and a rule can only be removed through a reviewed change.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T03 | property | PS-127-01.R02, PS-127-07.R01, PS-127-07.R03 | random secrets interpolated into logs, errors, JSON and inspect output | output never contains the secret or its base64url or hex forms |
| TEST-PS-127-09.T08 | abuse | PS-127-05.R01, PS-127-05.R02, PS-127-05.R03, PS-127-07.R02 | attempt to read secrets via any command or query; scanner run with write token | no route exposes secrets; scanner cannot publish |

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
