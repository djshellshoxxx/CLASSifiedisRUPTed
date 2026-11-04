# PS-132-07 — Privacy, retention and abuse: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-07.R01** Runbooks and templates are public documents containing no secrets, keys, personal data or exploit details of open issues.
- **PS-132-07.R02** Notice statements and incident timelines follow F16.S03.M02 retention; drill records are kept 2 years.
- **PS-132-07.R03** Containment switches are protected from misuse (denial of service by a rogue admin) through two-person admin grants, audit entries and visible status to users.

## Specification

**Data classification**
- Runbooks and templates: P0 public documents.
- Drill records: P1 internal, no personal data.

**Retention**
- Runbooks: indefinite in repository history.
- Drill records: 2 years.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Rogue or compromised admin toggles read-only to disrupt the relay | admin grants need two-person approval (F16.S01.M01), every toggle is audited and visible to users in the app, other admins can lift it |
| T02 | Incident notice abused for phishing | notices are relay-signed statements shown inside the app with relay name, contain no credential requests and no external links in MVP |
| T03 | Over-reassuring or false statements in notices | templates require evidence references for any statement that data was not accessed and forbid guarantees |
| T04 | Containment fails silently | propagation checks are part of each switch procedure and the status screen shows verified-since time |
| T05 | Runbooks drift from the system | linter checks references in CI and drills every 6 months test the real procedures |

**Abuse controls**
- Switch changes limited to 10 per hour per admin with reason required.
- Read-only exemptions list is fixed in code and reviewed in the threat model.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T08 | abuse | PS-132-05.R01, PS-132-05.R02, PS-132-05.R03, PS-132-07.R01 | member invokes containment; admin toggles 11 times in an hour; single admin grants admin to self | FORBIDDEN or no route; 11th rate limited; SECURITY_APPROVAL_REQUIRED |
| TEST-PS-132-09.T09 | abuse | PS-132-07.R02, PS-132-07.R03 | notice text claiming no data was accessed without evidence reference; document with 'externally audited' | rejected by template validation; SECURITY_RUNBOOK_FORBIDDEN_CLAIM |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F15.S04.M02, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
