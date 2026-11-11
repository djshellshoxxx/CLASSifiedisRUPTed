# PS-079-07 — Privacy, retention and abuse: Retention and legal hold

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M02 Retention and legal hold](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/retention` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-079-07.R01** Run records contain counts and kinds only, never record contents or identifiers of users.
- **PS-079-07.R02** Holds are the only way to keep relay-held data past policy, require two unlinked operators including an admin, are audited under RET-AUDIT and reviewed every 180 days.
- **PS-079-07.R03** Abuse of holds by a rogue operator is limited by separation of duties, mandatory reference, review reminders and visibility to all relay operators.
- **PS-079-07.R04** A Looser jurisdiction value never changes the retention of records created before it came into use in the scope, whatever effectiveFrom the publisher claims, and a fixed anchor offset never shortens the retention of records that carry a did, device key or free text.

## Specification

**Data classification**
- RetentionPolicy: P3 for vault scope, P0 for relay scope (published policy). LegalHold: P3 operator record; the reference must not contain personal data.
- Run records: counts per kind and class and the run start time.

**Retention**
- Run records RET-AUDIT (1 year); LegalHold RET-AUDIT for 1 year after release; policies retained while effective plus 1 year.
- RET-SIGNAL records of other modules until their expiresAt and at most 365 days after creation, then only their counts-only rollup for 365 days (PRV-8).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Rogue operator places a hold to retain a user's data | an admin plus a second operator or admin required, DIDs refused when linked by same-owner attestations or a rotation chain (N11), reason code, reference, audit trail visible to all operators, 180-day review, user data in vaults unaffected; residual risk - on a relay controlled by one person, holds and purges depend entirely on trusting that operator, and Sybil operator DIDs without any linkage evidence are not detectable |
| T02 | Hold used to resurrect tombstoned content | held content is sealed and withdrawn from public serving; only operators can access it |
| T03 | Sweep deletes records under dispute or hold | purge re-checks hold inside the deleting transaction; disputes are protected by RET-EVIDENCE duration |
| T04 | Policy manipulation to shorten audit retention | AUDIT bounds 180 to 2555 days enforced in code; changes audited |
| T05 | Forward clock jump makes the vault sweep purge early | persisted high-water clock and latest relay-signed receipt time; a jump over 24 h forces a dry run and user confirmation before RET-SHORT, RET-STANDARD or RET-EVIDENCE purges; future anchors are never purged |
| T06 | Fraud signals kept past their purpose or re-identified from their rollup | RET-SIGNAL purges at expiresAt with a hard cap of 365 days after createdAt, the rollup holds counts per day and kind only and is purged after 365 days, and the class cannot be changed by any scope or jurisdiction (V15, V16) |
| T07 | Hold events disclose the held subject beyond the relay | placed and released are relay-local P3 events delivered only to relay-system handlers, never to vaults, federation or notifications |
| T08 | A compromised or malicious profile publisher shortens evidence retention or backdates effectiveFrom to destroy existing records | upgrade_pending writes no row until the owner confirms (F18.S01.M01), looserFrom is the later of effectiveFrom and the local in-use time, records created earlier keep the stricter duration, and values are clamped into the class bounds (V17) |
| T09 | A fixed anchor offset used to purge actor audit trails early | anchorOffsetDays is declared in code, at most the effective class duration, allowed only for kinds without did, device key or free-text fields, and the class duration from createdField stays a cap (V18) |

**Abuse controls**
- Hold requests limited to 10 per operator per day and sweep runs limited to 6 per day per scope, enforced by the command bus (F15.S02.M02) through RateLimitPort (N18).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-079-09.T03 | unit | PS-079-02.R02, PS-079-03.R01, PS-079-07.R03 | A requests and A approves; B approves A's request; C approves A's request; C requests release and C approves it; B approves C's release; D approves A's request | self and linked approvals refused with PRIVACY_HOLD_SELF_APPROVAL; operator-only pair refused with FORBIDDEN; admin-plus-operator pairs succeed |
| TEST-PS-079-09.T12 | abuse | PS-079-07.R02, PS-079-07.R03 | 11 hold requests in a day by one operator; check audit entries | 11th RATE_LIMITED; every step audited with actor |
| TEST-PS-079-09.T13 | integration | PS-079-07.R01 | inspect run records and logs | counts and kinds only; no record contents |
| TEST-PS-079-09.T20 | integration | PS-079-07.R02 | active hold with the clock at activeSince + 180, + 210 and + 240 days; review recorded at + 215 days | reminders at 180 and 210 days; none after the review until the next due date; the held subject stays excluded |
| TEST-PS-079-09.T21 | abuse | PS-079-07.R03, PS-079-02.R02 | E (rotation chain of A) approves A's request; KeyLinkagePort unavailable during an approval | refused with PRIVACY_HOLD_SELF_APPROVAL in both cases (fail closed) |
| TEST-PS-079-09.T26 | integration | PS-079-01.R06, PS-079-02.R06, PS-079-04.R08, PS-079-07.R04 | vault with (KP, eu_de) selected; activated selected, then upgrade_pending and upgraded to version 4 with the backdated effectiveFrom, then deselected; relay activated with scope relay for the hosting profile; resolve returning evidenceDays 180 and auditDays 90; a row naming an unknown ProfileRef and a set with code EU DE | selected writes EVIDENCE 1825 with source jurisdiction, ProfileRef and version 3; upgrade_pending changes no row; upgraded sets 730 with priorDurationDays 1825 and looserFrom at the confirmation time, so a record created before it is kept until 1825 days and one created after is purged after 730; deselected writes the generic defaults with fallback true; the relay STANDARD 60 applies only to records created after its looserFrom; 180 and 90 are clamped to 365 and 180; the unknown ref resolves to generic; EU DE returns VALIDATION_FAILED |
| TEST-PS-079-09.T27 | integration | PS-079-02.R07, PS-079-07.R04 | relay sweep over the TransparencyCounter rows of the F18.S02.M02 stub; vault composition with the same stub; registrations with anchorOffsetDays 400, without createdField and with a did field | rows published 91 days ago and the unpublished 366-day rows are purged, the 89-day and 364-day rows are kept; the vault sweep and the vault conformance check ignore the relay-only kind; the three bad registrations fail with VALIDATION_FAILED |

## Dependencies

Module depends on: F18.S01.M01, F16.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
