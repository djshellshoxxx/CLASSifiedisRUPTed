# PS-141-07 — Privacy, retention and abuse: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-07.R01** Fork pull requests run with read-only tokens and no secrets; logs are scanned for token patterns by the secrets step before upload.
- **PS-141-07.R02** Artifacts contain test reports and the static build only, with no user data (the PWA sends no telemetry per OBS-7).
- **PS-141-07.R03** Retention: PWA artifact 7 days, fast reports 14 days, nightly reports 30 days.

## Specification

**Data classification**
- Source code, lockfile hashes, test reports.
- No user data and no secrets in artifacts.

**Retention**
- pwa-dist 7 days; fast reports 14 days; nightly reports 30 days; check run history per GitHub defaults.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Malicious pull request exfiltrates secrets | no secrets on pull requests, contents: read, no pull_request_target, first-party actions only pinned to a SHA or exact tag |
| T02 | Supply-chain action compromise | only actions/* allowed; lint enforces; pnpm install uses --frozen-lockfile and lockfile hash cache key |
| T03 | Cache poisoning across branches | cache keys contain the lockfile hash and runner OS; caches from forks are not restored into protected branches |

**Abuse controls**
- Resource abuse by pull request spam is bounded by concurrency cancel-in-progress and a 15 min timeout.
- Workflow edits require code-owner review of .github/.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T09 | abuse | PS-141-07.R01, PS-141-07.R02, PS-141-07.R03 | review fork run logs and artifact contents; check retention config | tokens masked; no user data; retention 7, 14, 30 days |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S03.M02, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
