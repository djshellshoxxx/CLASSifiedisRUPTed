# PS-143-05 — Authorization and capabilities: Release gates

**Status:** SPECIFIED (Stage 3). **Module:** [F17.S03.M02 Release gates](SPEC.md) · **Scope:** MVP · **Code:** `tools/gates` · **Contracts:** [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-143-05.R01** Gates are read-only against the repository and run with contents: read; no token or secret is needed. Attaching reports/gates.md is done after GO by the separate release-publish job, the only job allowed contents: write by the F17.S03.M01 per-job allowlist.
- **PS-143-05.R02** Waivers, quarantine entries and manual checklists require a code-owner approved commit; the gate prints the approver from git metadata and fails an unapproved commit with QUALITY_GATE_WAIVER_UNAPPROVED.
- **PS-143-05.R03** Audit calls use the public registry endpoint only and send no repository content.

## Specification

_None._

No runtime capabilities of its own: this module runs only in developer shells and CI jobs. Under ADR-0016 (CTR-CAP-001 CAP-8) the tests exercise two layers: vault policy (local principal mutates only its records; incoming signed statements accepted only from a key authorized for the role, else quarantined) and relay policy (relay-signed requests or relay access tokens). Tests never ship in the PWA or relay bundles.

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-143-09.T06 | unit | PS-143-03.R03, PS-143-05.R02 | waiver 15 days long, expired, valid | long and expired fail QUALITY_GATE_WAIVER_EXPIRED; valid passes and is reported as waived |
| TEST-PS-143-09.T08 | abuse | PS-143-05.R01, PS-143-05.R03 | attempt to disable a gate by env var and inspect network calls | gate still runs; only registry audit endpoint is called |
| TEST-PS-143-09.T18 | abuse | PS-143-05.R02, PS-143-02.R05 | a waiver commit and a checklist commit without code-owner approval, then the same with approval | unapproved commits fail with QUALITY_GATE_WAIVER_UNAPPROVED naming the committer; approved ones pass and the report prints the approver from git metadata |

## Dependencies

Module depends on: CTR-TST-001, CTR-OBS-001, CTR-SCH-001, F17.S01.M01, F17.S01.M04, F17.S02.M01, F17.S03.M03. Predecessor: [domain_schema.md](domain_schema.md).
