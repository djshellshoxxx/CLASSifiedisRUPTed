# PS-127-09 — Contract and acceptance tests: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-127-09.R02** Redaction is covered by property tests that inject random secrets into every logging path.
- **PS-127-09.R03** The CI scanner has a corpus of positive and negative samples with expected findings.

## Specification

See the module test table below (all processes).

**Fixtures:** Temp directory with secret files of modes 0400, 0600, 0644 and a symlink; environment set; corpus of 60 positive and 60 negative scanner samples; fixed clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T01 | unit | PS-127-01.R01, PS-127-02.R01, PS-127-02.R03 | manifest with all secrets present once | all loaded; names match pattern; minimum sizes enforced |
| TEST-PS-127-09.T02 | unit | PS-127-02.R01, PS-127-02.R02 | missing, ambiguous, permissive, symlinked, short secrets | documented SECURITY_SECRET_* code each; relay does not start |
| TEST-PS-127-09.T03 | property | PS-127-01.R02, PS-127-07.R01, PS-127-07.R03 | random secrets interpolated into logs, errors, JSON and inspect output | output never contains the secret or its base64url or hex forms |
| TEST-PS-127-09.T04 | unit | PS-127-03.R02, PS-127-04.R01, PS-127-04.R02 | equalConstantTime across equal, different and length-mismatched inputs; timing harness over 100 000 runs | correct results; no statistically significant timing difference between early and late mismatch |
| TEST-PS-127-09.T05 | unit | PS-127-01.R03, PS-127-02.R03 | hashToken for 43-character token and malformed tokens | SHA-256 of decoded bytes for valid; UNAUTHENTICATED for malformed |
| TEST-PS-127-09.T06 | integration | PS-127-03.R01, PS-127-03.R02, PS-127-03.R03, PS-127-06.R01, PS-127-06.R02 | SIGHUP reload with overlap 120 s; failed reload; key rotation interrupted and resumed | atomic swap; old value valid within overlap only; failed reload keeps previous; rotation resumes without double work |
| TEST-PS-127-09.T07 | integration | PS-127-04.R03, PS-127-02.R02, PS-127-09.R02 | scanner on corpus and on a pull request adding a key | exit 1 with rule, path, line and no value on positives; exit 0 on negatives; allow-list requires reviewed file |
| TEST-PS-127-09.T08 | abuse | PS-127-05.R01, PS-127-05.R02, PS-127-05.R03, PS-127-07.R02 | attempt to read secrets via any command or query; scanner run with write token | no route exposes secrets; scanner cannot publish |
| TEST-PS-127-09.T09 | chaos | PS-127-06.R03, PS-127-08.R01 | process killed mid-rotation; startup with one secret missing | no half-open listener; progress recorded; one log line per secret without values |
| TEST-PS-127-09.T10 | load | PS-127-08.R02, PS-127-08.R03 | 100 000 hashToken calls and 100 000 log lines; scan of 10 000-commit repository | latency budgets met; full-history scan ≤ 10 minutes |
| TEST-PS-127-09.T11 | unit | PS-127-09.R01, PS-127-09.R03 | traceability tool run | every PS-127 requirement maps to a passing test |
| TEST-PS-127-09.T12 | integration | PS-127-10.R01, PS-127-10.R02, PS-127-10.R03 | export operator configuration, import to fresh relay, restore backup | exports contain secret names and sources but no values; restore requires secrets re-provided |

## Acceptance criteria

- All tests T01–T12 pass in CI.
- No secret value appears in any log, error, metric, export or backup artifact (property and integration tests).
- The CI scan blocks a pull request that adds a secret-like value and passes the corpus of negative samples.

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
