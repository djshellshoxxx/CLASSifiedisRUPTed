# PS-131-07 — Privacy, retention and abuse: Incident records

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S03.M02 Incident records](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/ops/incident` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-131-07.R01** Incident records contain IDs, counts and data classes only, never user content, tokens or keys, and text is scanned for secret patterns before storage.
- **PS-131-07.R02** Records and their timeline rows are retained under RET-EVIDENCE (2 years after closure), with legal hold override, and are readable only by relay_operators and admins.
- **PS-131-07.R03** Misuse (incident records used to profile users, forged incidents to trigger panic, concealment of breaches, flooding to bury a critical alert) is limited by content rules, hook thresholds, uncapped SEV1 and SEV2, audit logging and the mandatory notification decision.

## Specification

**Data classification**
- Incident and timeline rows: P3 relay operational data.
- Incident notice statement: P0 content addressed to affected users, free of secrets and unverified claims.

**Retention**
- Incidents and timeline rows: RET-EVIDENCE (2 years after closure); legal hold (F10.S01.M02) keeps them until release.
- Timeline redactions keep a hash for integrity.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Breach concealment | notification decision mandatory before closing SEV1 and SEV2, due times tracked from the jurisdiction profile, decisions and reasons stored and exportable to auditors |
| T02 | Secrets or personal data pasted into timeline | pattern scan on every text, operator guidance, admin redaction command replacing text with a hash under a single-redaction trigger |
| T03 | Forged or flooded detection events cause alert fatigue or bury a critical alert | thresholds on rolling windows, de-duplication per category and scope, system-only hook capability, sources are the relay's own verified events, SEV1 and SEV2 never capped, overflow collected in one SEV2 incident |
| T04 | Incident notice used for phishing | notices are relay-signed statements shown with relay name inside the app only; they never contain links requesting credentials; email variants are not used in MVP; successor-relay notices are marked unverified until confirmed out of band |
| T05 | Rewriting incident history | timeline rows append-only with database triggers, severity history retained, operator actions audit-logged (F16.S01.M01), closed incidents immutable |

**Abuse controls**
- Operator commands limited to 200 per hour per key; SEV3 and SEV4 hook detections capped at 20 per hour per relay with overflow into one detection_overflow incident; SEV1 and SEV2 never capped.
- Notice sends limited to 1 per incident per audience per 24 hours unless the operator records a reason.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-131-09.T10 | abuse | PS-131-07.R03, PS-131-01.R04 | 201 operator commands in an hour; UPDATE of a timeline row's text; second redaction of a redacted row; DELETE of a row while the incident exists | RATE_LIMITED; trigger aborts each change |
| TEST-PS-131-09.T11 | integration | PS-131-07.R01, PS-131-04.R04 | secret pasted into annotate; admin redacts an existing entry; relay_operator tries to redact | SECURITY_INCIDENT_SECRET_IN_TEXT; text NULL, redacted_hash set and an F16.S01.M01 audit entry written; FORBIDDEN |
| TEST-PS-131-09.T18 | integration | PS-131-07.R02 | retention sweep 2 years after closure; an incident under legal hold at that time | incident and timeline rows purged; held incident kept until privacy.legal_hold.released |
| TEST-PS-131-09.T19 | contract | PS-131-04.R05, PS-131-07.R01 | event payload classification and subscription scan across modules | both events P3 with no user content; no federation or notification module consumes security.incident.* |

## Dependencies

Module depends on: F16.S01.M01, F16.S01.M02, F16.S02.M02, F16.S02.M03, F16.S03.M01, F18.S01.M01, F08.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
