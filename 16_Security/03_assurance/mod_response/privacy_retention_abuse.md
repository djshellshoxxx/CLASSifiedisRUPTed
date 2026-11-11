# PS-132-07 — Privacy, retention and abuse: Incident response

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M03 Incident response](SPEC.md) · **Scope:** MVP · **Code:** `docs/security/response` · **Contracts:** [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-132-07.R01** Runbooks and templates are public documents containing no secrets, keys, personal data or exploit details of open issues.
- **PS-132-07.R02** Notice statements and incident timelines follow F16.S03.M02 retention; drill records are kept 2 years.
- **PS-132-07.R03** Containment switches are protected from misuse (denial of service by a rogue admin) through the relay-scope role check on signed requests, two-person admin grants, rate limits, audit entries and visible status to users.

## Specification

**Data classification**
- Runbooks, templates and the generated relay inventory: P0 public documents.
- Drill records: P1 internal, no personal data.
- Containment log of host changes: P1 relay-local, OS user and reason only.

**Retention**
- Runbooks: indefinite in repository history.
- Drill records: 2 years, then removed by the documentation retention job.
- Containment log of host changes: until its entries are appended to the audit log, then RET-AUDIT there.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Rogue or compromised admin toggles read-only to disrupt the relay | switches need a relay-scope role checked on a signed request, admin grants need a signed second approval (F16.S01.M01), changes are rate limited, every toggle is audited and visible to users in the app, other admins can lift it |
| T02 | Incident notice abused for phishing | notices are relay-signed statements shown inside the app with relay name, contain no credential requests and no external links in MVP; a successor relay's notice is unverified until confirmed out of band |
| T03 | Over-reassuring or false statements in notices | templates require evidence references for any statement that data was not accessed, forbid guarantees, and must list every data class the relay held (V08) |
| T04 | Containment fails silently | propagation checks are part of each switch procedure and the status screen shows verified-since time |
| T05 | Runbooks drift from the system | linter checks references and the inventory in CI and drills every 6 months test the real procedures |
| T06 | Federation kill switch breaks unrelated services on the relay | it gates only relay-to-relay traffic, is not a feature flag and turns no module off; mailbox and consent tests run while it is on |

**Abuse controls**
- Switch changes limited to 10 per hour per key with reason required (bus rate limit, F12.S03.M03).
- Read-only exemptions list is fixed in code by command ID and reviewed in the threat model.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-132-09.T08 | abuse | PS-132-05.R01, PS-132-05.R02, PS-132-05.R03, PS-132-07.R03 | member invokes containment; relay_operator toggles 11 times in an hour; single admin grants admin to self; documentation change approved only by its author | FORBIDDEN; 11th RATE_LIMITED; FORBIDDEN; merge blocked |
| TEST-PS-132-09.T09 | abuse | PS-132-07.R01, PS-132-01.R03 | notice text claiming no data was accessed without an evidence reference; document with 'externally audited'; runbook containing a token-like string | rejected by template validation; SECURITY_RUNBOOK_FORBIDDEN_CLAIM; F16.S01.M02 secret scan fails |
| TEST-PS-132-09.T15 | integration | PS-132-04.R01, PS-132-04.R04, PS-132-07.R03 | CLI containment read-only on signed with R1's device key; get_status | sentinel written; audit entry with reason and actor; rate limit counted; status shows since-time, actor and propagation result |
| TEST-PS-132-09.T17 | integration | PS-132-07.R02 | documentation retention job with drill records 2 years and 1 day old and 1 year old | the older is removed; the younger kept |

## Dependencies

Module depends on: F16.S03.M02, F16.S03.M01, F16.S02.M02, F16.S01.M01, F11.S03.M01, F15.S02.M01, CTR-CAP-001, CTR-FLG-001, CTR-ERR-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
