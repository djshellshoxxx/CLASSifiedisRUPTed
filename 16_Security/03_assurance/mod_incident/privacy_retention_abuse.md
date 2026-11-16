# PS-131-07 — Privacy, retention and abuse: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-07.R01** Incident records contain IDs, counts and data classes only, never user content, tokens or keys, and text is scanned for secret patterns before storage.
- **PS-131-07.R02** Records are retained under RET-EVIDENCE (2 years), with legal hold override, and are readable only by operators and admins.
- **PS-131-07.R03** Misuse (incident records used to profile users, forged incidents to trigger panic, concealment of breaches) is limited by content rules, hook thresholds, audit logging and the mandatory notification decision.

## Specification

**Data classification**
- Incident: P3 relay operational data.
- Incident notice statement: P0 content addressed to affected users, free of secrets and unverified claims.

**Retention**
- Incidents: RET-EVIDENCE (2 years after closure).
- Timeline redactions keep a hash for integrity.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Breach concealment | notification decision mandatory before closing SEV1 and SEV2, due times tracked, decisions and reasons stored and exportable to auditors |
| T02 | Secrets or personal data pasted into timeline | pattern scan on every text, operator guidance, redaction command replacing text with a hash |
| T03 | Forged or flooded detection events cause alert fatigue | thresholds on rolling windows, de-duplication per category and scope, system-only hook capability, sources are the relay's own verified events |
| T04 | Incident notice used for phishing | notices are relay-signed statements shown with relay name inside the app only; they never contain links requesting credentials; email variants are not used in MVP |
| T05 | Rewriting incident history | timeline append-only, severity history retained, operator actions audit-logged (F16.S01.M01), closed incidents immutable |

**Abuse controls**
- Operator commands limited to 200 per hour per key; hook-opened incidents limited to 20 per hour per relay.
- Notice sends limited to 1 per incident per audience per 24 hours unless the operator records a reason.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T08 | integration | PS-131-03.R01, PS-131-07.R01 | close SEV1 without postmortem or notification decision; with both | SECURITY_INCIDENT_CLOSE_BLOCKED then success |
| TEST-PS-131-09.T10 | abuse | PS-131-07.R02, PS-131-07.R03 | 201 operator commands in an hour; 21 hook incidents; edit of a timeline entry | RATE_LIMITED; capped; append-only trigger aborts edit |
| TEST-PS-131-09.T11 | integration | PS-131-07.R01 | secret pasted into annotate | SECURITY_INCIDENT_SECRET_IN_TEXT; redaction command replaces existing text with hash and audit entry |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M02, F16.S03.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
