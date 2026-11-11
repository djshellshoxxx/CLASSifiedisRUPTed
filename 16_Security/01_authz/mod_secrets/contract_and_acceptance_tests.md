# PS-127-09 — Contract and acceptance tests: Secrets handling

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S01.M02 Secrets handling](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/authz/secrets` · **Contracts:** [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-127-09.R01** Every requirement of this module is covered by at least one automated test.
- **PS-127-09.R02** Redaction is covered by property tests that inject random secrets into every logging path.
- **PS-127-09.R03** The CI scanner has a corpus of positive and negative samples with expected findings.

## Specification

See the module test table below (all processes).

**Fixtures:** Temp directory with secret files of modes 0400, 0600, 0644 and a symlink; a fixture relay key file for checkSecretFile; environment set; 2 000 objects wrapped by data-key v1; corpus of 60 positive and 60 negative scanner samples; fixed clock.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-127-09.T01 | unit | PS-127-01.R01, PS-127-01.R03, PS-127-02.R01 | manifest with all secrets present once | all loaded; names match RELAY_SECRET_ pattern; relay signing key absent from the manifest; nothing written to the database |
| TEST-PS-127-09.T02 | unit | PS-127-02.R01, PS-127-02.R03, PS-127-04.R01, PS-127-05.R01 | missing, ambiguous, permissive, symlinked, short secrets; checkSecretFile on a 0644 relay key file | documented SECURITY_SECRET_* code each; relay does not start |
| TEST-PS-127-09.T03 | property | PS-127-01.R02, PS-127-07.R01, PS-127-07.R03 | random secrets interpolated into logs, errors, JSON and inspect output | output never contains the secret or its base64url or hex forms |
| TEST-PS-127-09.T04 | unit | PS-127-04.R02 | equalConstantTime across equal, different and length-mismatched inputs; timing harness over 100 000 runs | correct results; no statistically significant timing difference between early and late mismatch |
| TEST-PS-127-09.T05 | unit | PS-127-01.R02, PS-127-02.R02 | hashToken for 43-character token and malformed tokens | SHA-256 of decoded bytes for valid; UNAUTHENTICATED for malformed |
| TEST-PS-127-09.T06 | integration | PS-127-03.R02, PS-127-06.R01, PS-127-06.R02 | SIGHUP reload of SMTP_PASSWORD with overlap 120 s; failed reload | atomic swap; old value valid within overlap only; failed reload keeps previous values |
| TEST-PS-127-09.T07 | integration | PS-127-04.R03, PS-127-09.R03 | scanner on corpus and on a pull request adding a key | exit 1 with rule, path, line and no value on positives; exit 0 on negatives; allow-list requires reviewed file |
| TEST-PS-127-09.T08 | abuse | PS-127-05.R01, PS-127-05.R02, PS-127-05.R03 | attempt to read secrets via any command or query; scanner run with write token | no route exposes secrets; scanner cannot publish |
| TEST-PS-127-09.T09 | chaos | PS-127-03.R01, PS-127-06.R03, PS-127-08.R01, PS-127-07.R02 | process killed mid-rotation; startup with one secret missing | no half-open listener; progress recorded; resumed run skips finished objects; one log line per secret without values |
| TEST-PS-127-09.T10 | load | PS-127-08.R02, PS-127-08.R03 | 100 000 hashToken calls and 100 000 log lines; scan of 10 000-commit repository | latency budgets met; full-history scan ≤ 10 minutes |
| TEST-PS-127-09.T11 | unit | PS-127-09.R01, PS-127-09.R02 | traceability tool run; redaction property suite present | every PS-127 requirement maps to a passing test |
| TEST-PS-127-09.T12 | integration | PS-127-10.R01, PS-127-10.R02, PS-127-10.R03 | export operator configuration, import to fresh relay, restore backup | exports contain secret names and sources but no values; restore requires secrets re-provided |
| TEST-PS-127-09.T13 | integration | PS-127-03.R03, PS-127-03.R04, PS-127-04.R04 | rotate data key with 2 000 objects, interrupt at 1 200, SIGHUP after 301 s, remove v1 before verify reports zero, finish and verify | v1 stays loaded beyond 300 s; startup refuses with SECURITY_SECRET_MISSING naming v1 and 800 objects; verify-rewrap exits 1 then 0; v1 removable afterwards |

## Acceptance criteria

- All tests T01–T13 pass in CI.
- No secret value appears in any log, error, metric, export or backup artifact (property and integration tests).
- The CI scan blocks a pull request that adds a secret-like value and passes the corpus of negative samples, and no data-key version still wrapping objects can be removed without the relay refusing to start.

## Dependencies

Module depends on: CTR-OBS-001, CTR-PRV-001, CTR-CAP-001. Predecessor: [domain_schema.md](domain_schema.md).
