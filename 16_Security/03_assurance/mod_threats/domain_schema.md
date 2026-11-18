# PS-133-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 16_Security/03_assurance/mod_threats. **Parent:** [module SPEC](SPEC.md). **Canonical contracts:** CTR-ID-001, CTR-PRV-001, CTR-CAP-001.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-133-01.R01 | Every Threat has framework (STRIDE or LINDDUN), one category, rating 1..25, owner_role, review_due <= 180 days after last review | MVP |
| PS-133-01.R02 | ControlLink targets are full module paths or CTR IDs; 0 dangling targets on publish | MVP |
| PS-133-01.R03 | ResidualAcceptance records two distinct roles and expiry <= 180 days | MVP |
| PS-133-01.R04 | Threat description excludes exploit steps; detail held in restricted attachment (not in this schema) | MVP |

## Data / schema
```
Threat {
  threat_id: string        // THR-<AREA>-<nnn>, unique, immutable
  title: string            // <= 120 chars
  description: text        // <= 1500 chars, no URLs, no exploit steps
  framework: enum(STRIDE|LINDDUN)
  category: enum           // STRIDE: Spoofing|Tampering|Repudiation|InfoDisclosure|DoS|Elevation; LINDDUN: Linking|Identifying|NonRepudiation|Detecting|DataDisclosure|Unawareness|NonCompliance
  area_path: string        // full module path of affected module
  actor: enum(external_attacker|malicious_participant|malicious_peer|insider|curious_operator|network_observer)
  likelihood: smallint 1..5
  impact: smallint 1..5
  rating: smallint         // = likelihood * impact
  status: enum(identified|assessed|mitigated|accepted|retired)
  owner_role: string
  sensitivity: enum(restricted|internal)  // default restricted
  last_reviewed_at, review_due: timestamptz UTC
  revision: int
}
ControlLink { threat_id, control_ref, kind: enum(preventive|detective|corrective), verified_by: TEST-ID|null }
ResidualAcceptance { threat_id, rationale <= 500 chars, accepted_by_role, approved_by_role, expires_at, created_at }
ThreatModelVersion { model_id, version semver, published_at, status: enum(draft|published|superseded), content_hash }
```
Seed IDs (examples, not exhaustive): THR-GEO-001, THR-META-001, THR-SYBIL-001, THR-GRAPH-001, THR-PAY-001, THR-HANDOVER-001, THR-MOD-001, THR-FED-001.

## Commands / queries / events
Signatures in PS-133-04. Schema version `v1` (CTR-SCH-001).

## States & transitions
Lifecycle field is `status`; see PS-133-03.

## Validation & errors
Rules in PS-133-02. Schema violations return `THREATS.SCHEMA_INVALID`.

## Authorization
`sensitivity` and `rating` visible only to roles in PS-133-05.

## Failure, idempotency, concurrency, offline
Not applicable to offline use: register is an online back-office system. Concurrency via `revision`.

## Privacy, retention, abuse
Threat records describe classes of users and attack paths, never named individuals. Data class restricted (CTR-PRV-001). Retention in PS-133-07.

## Observability & budgets
Row counts by status and framework. Read p95 <= 300 ms (ASSUMPTION).

## Tests
- TEST-PS-133-01-01 (unit): rating equals likelihood times impact for all 25 combinations.
- TEST-PS-133-01-02 (unit): framework and category mismatch rejected.
- TEST-PS-133-01-03 (integration): publish with one dangling control_ref fails.

## Acceptance criteria
1. Seed IDs above each have a row with all required fields.
2. No Threat field stores URLs or exploit steps (checked by PS-133-02 rules).
3. Schema changes versioned per CTR-SCH-001.

## Assumptions & open decisions
- ASSUMPTION: 180-day review cadence is reasonable for an early product; to revisit after first model review.
- D05 PROVISIONAL (D05 default, unapproved): geolocation threats described at region granularity only.
- D07 PROVISIONAL (D07 default, unapproved): retention periods in PS-133-07.
