# PS-081-02 — Validation rules: Data classification model

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S02.M02 Data classification model](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/security_boundaries/model` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-081-02.R01** Classification maps are validated against the schema's fields so every path is covered and no path refers to a missing field.
- **PS-081-02.R02** Redaction refuses outputs that would carry a class above what the sink allows.
- **PS-081-02.R03** Location handling validates the geohash cell precision and never accepts coordinates for public sinks.
- **PS-081-02.R04** P4 fields are denied to every sink including event, export and ui_owner, and L4 locations are denied to the event sink (EVT-5).
- **PS-081-02.R05** Single-recipient disclosures and the PRV-9 moderation disclosure are validated from the declared envelope context, so a missing or mismatched recipient role, more than one recipient, an unencrypted envelope, or a disclosure that is not the approved redact/1 output in state export_prepared is refused.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | every schema field path has an entry in the ClassificationMap | PRIVACY_CLASSIFICATION_MISSING |
| V02 | the class of an event payload is at least the maximum class of its fields | PRIVACY_CLASSIFICATION_MISSING |
| V03 | a P3 field is never emitted to log, federation, notification, projection, search, participant_envelope (except a field with a single-recipient disclosure under V07), ui_public or ui_participant sinks, and a P4 or unclassified field is never emitted to any sink, including event, export and ui_owner | PRIVACY_SINK_FORBIDDEN |
| V04 | locations in public, search, federation or notification payloads have level at most L2, and the event sink never receives L4 | PRIVACY_LOCATION_TOO_PRECISE |
| V05 | P1 and P2 fields reach participant_envelope only when ctx.encrypted is true, ctx.recipients is non-empty and ctx.recipientRole is participant (or the PRV-9 disclosure under V08), and otherwise only ui_participant, ui_owner, event, export and log as IDs | PRIVACY_SINK_FORBIDDEN |
| V06 | a ClassificationMap contains no path that is absent from the schema | VALIDATION_FAILED |
| V07 | a field annotated disclose {as: P2, recipientRole} reaches participant_envelope only when ctx.encrypted is true, ctx.recipients has exactly one entry and ctx.recipientRole equals the annotated recipientRole; for every other sink, recipient set or role the field's own class applies; disclose is allowed only on P2 or P3 fields and only with as P2 and maxRecipients 1 | PRIVACY_SINK_FORBIDDEN |
| V08 | a P2 record reaches participant_envelope with ctx.recipientRole relay_moderation only when ctx.disclosure has kind moderation_report, targetType message, offer or cycle_proposal, rulesVersion redact/1, state export_prepared and a non-empty previewDigest (bound to the approved preview by F12.S01.M02), ctx.recipients has exactly one entry, and the record still contains nothing that redact/1 removes (email address, phone number, geohash longer than 5 characters, L3 or L4 location share, attachment) (CTR-PRV-001 PRV-9) | PRIVACY_SINK_FORBIDDEN |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-081-09.T01 | unit | PS-081-01.R01, PS-081-01.R02, PS-081-02.R01 | load a classification map for a schema and check every field | all paths classified; a missing path raises PRIVACY_CLASSIFICATION_MISSING |
| TEST-PS-081-09.T02 | unit | PS-081-01.R03, PS-081-02.R02 | unannotated field in a record redacted for each of the 11 sinks | treated as P4 and dropped from every sink, including export and ui_owner |
| TEST-PS-081-09.T03 | unit | PS-081-01.R04, PS-081-02.R02, PS-081-03.R02 | full class by sink matrix (5 classes by 11 sinks) and the location cap per sink | every result equals the matrix in the domain_schema note; P4 denied everywhere; P3 only to event, export and ui_owner |
| TEST-PS-081-09.T04 | unit | PS-081-02.R03 | locations L0 to L4 for public sinks | L3 and L4 snapped to L2 cell or refused with PRIVACY_LOCATION_TOO_PRECISE; L0 to L2 pass |
| TEST-PS-081-09.T06 | property | PS-081-02.R01, PS-081-06.R03 | random nested structures with unknown paths | unknown paths default to P4 and never appear in any sink output |
| TEST-PS-081-09.T08 | unit | PS-081-04.R03, PS-081-02.R02 | assertSinkSafe on a module test with an unsafe value | assertion fails with path list and no values in the message |
| TEST-PS-081-09.T17 | unit | PS-081-02.R04, PS-081-02.R02 | redactForEnvelope with a P2 field and encrypted false, encrypted true with no recipients, encrypted true with recipients; a P3 field; redactForEvent with a P4 field and an L4 location; redactForSearch with an L3 location and a P1 field | refused, refused, allowed; P3 refused; P4 and L4 refused for events; search snaps to L2 and drops the P1 field |
| TEST-PS-081-09.T18 | unit | PS-081-01.R05, PS-081-02.R05 | reservePrice, reserveSalt, maxAmount, bidderId and clientNonce through redactForEnvelope with one host key and recipientRole auction_host, with two recipients, with role participant, unencrypted, and through redactForEvent, redactForLog, redactForProjection, redactForExport for another user and ui_participant; a map that puts disclose on a P4 field or with maxRecipients 2 | only the single encrypted auction_host envelope carries the fields as P2; every other call drops or refuses them with PRIVACY_SINK_FORBIDDEN; the owner's own export keeps them; the bad maps fail the lint |
| TEST-PS-081-09.T19 | unit | PS-081-01.R06, PS-081-02.R05 | redact/1 output of a P2 message, offer and cycle proposal through redactForEnvelope to one relay_moderation key with state export_prepared; the same with state previewed, without previewDigest, with two recipients, with recipientRole relay_operator, and the unredacted message | the three approved disclosures pass; every other call is refused with PRIVACY_SINK_FORBIDDEN, so no other P2 content reaches a non-participant |

## Dependencies

Module depends on: CTR-PRV-001, CTR-EVT-001, CTR-FED-001, CTR-ERR-001, CTR-IOX-001, CTR-OBS-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
