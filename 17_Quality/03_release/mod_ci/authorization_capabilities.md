# PS-141-05 — Authorization and capabilities: Continuous integration

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M01 Continuous integration](SPEC.md) · **Scope:** MVP · **Code:** `.github/workflows` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-141-05.R01** Workflows default to permissions contents: read and no secrets on pull requests; the per-job allowlist grants issues: write only to the schedule-triggered nightly-report job and contents: write only to release-publish in release.yml after gates:release returns GO; no job reachable from pull_request holds any write permission, and no workflow opens pull requests (one created with GITHUB_TOKEN would not trigger CI, so nightly findings become issues and artifacts).
- **PS-141-05.R02** No workflow uses long-lived credentials or deploys; the PWA is static and relays are operated by their hosts.
- **PS-141-05.R03** Secret scanning (F16.S01.M02) runs in the fast gate on the diff computed by the changes job against the fetched base commit and fails on a finding.

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-141-09.T07 | abuse | PS-141-05.R01, PS-141-05.R02, PS-141-05.R03 | scan workflows for secrets, deploy steps, credentials and write permissions; plant a secret in a pull request diff | no secrets or deploys; write permissions only on allowlisted jobs; the secrets step scans the diff against the fetched base and the planted secret fails it |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, F17.S01.M01, F17.S01.M02, F17.S01.M03, F17.S01.M04, F17.S02.M01, F17.S02.M02, F17.S02.M03, F17.S03.M02, F17.S03.M03, F16.S01.M02. Predecessor: [domain_schema.md](domain_schema.md).
