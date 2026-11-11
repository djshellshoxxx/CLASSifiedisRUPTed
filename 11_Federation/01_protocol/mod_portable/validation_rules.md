# PS-083-02 — Validation rules: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-02.R01** Outbound mapping is default-deny, so a new local field is never exported until it is added to an allowlist and reviewed.
- **PS-083-02.R02** Inbound payload validation uses the same allowlist and location rules and rejects unknown fields and any location finer than L2 instead of ignoring or trimming them.
- **PS-083-02.R03** Every rejection returns a stable code that the calling module surfaces without echoing field values.
- **PS-083-02.R04** Location precision is enforced on both paths through F06.S02.M01 assertPublicCell; outbound cells are snapped to L2 before the check (PRV-1) and inbound payloads with a cell longer than 5 characters or with coordinate members are rejected.
- **PS-083-02.R05** Outbound portable drafts carry no timestamp finer than the UTC hour, checked with F10.S02.M03 assertCoarseTime over the draft's declared timestamp members and createdAt after publicTime has floored them.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | envelope type is registered in the statement-type registry; receivers quarantine unregistered types | FEDERATION_SIGNER_ROLE_INVALID |
| V02 | audience public portable types only: source record has federation opt-in true for this record at draft time and again when F11.S01.M02 signs; participant and control statements need no federation opt-in | FEDERATION_NOT_OPTED_IN |
| V03 | every outbound field is on the allowlist for the type and classified P0 | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| V04 | outbound: the location cell is snapped to its containing L2 cell (length ≤ 5) and passes F06.S02.M01 assertPublicCell; a latitude or longitude member anywhere in payload or ext refuses the export | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| V05 | media references are content hashes of metadata-stripped images; no image reports GPS tags | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| V06 | inbound payload has no members outside the allowlist, members have the declared types and strings are ≤ 10000 code points | FEDERATION_PAYLOAD_INVALID |
| V07 | inbound payload does not exceed 65536 bytes | PAYLOAD_TOO_LARGE |
| V08 | audience public portable types only: the type is one of the five portable allowlist types (listing, profile, service offering, rental offering, rental busy blocks) and its version major is supported | UNSUPPORTED_SCHEMA_VERSION |
| V09 | inbound location: the type's location cell member (listing regionCell, offering serviceAreaCell, rental offering pickupAreaCell, profile region.geohash) has length ≤ 5 and passes F06.S02.M01 assertPublicCell, and no latitude or longitude member is present | FEDERATION_PAYLOAD_INVALID |
| V10 | role resolution keeps key classes apart: relay roles resolve only through relay-key resolvers (keys pinned in F11.S03.M01, or the self-certifying key history of F15.S02.M01 for relay_identity roles, in both cases equal to the relay a named-relay role names) and user roles only through the injected portable-document resolver (F07.S02.M01); a key of the other class never matches | FEDERATION_SIGNER_ROLE_INVALID |
| V11 | control types validate against their per-type payload schema in the registry; participant statements carry a ciphertext payload {alg, ciphertext, recipientsKeyIds} of at most 12288 bytes, checked for shape and size only | FEDERATION_PAYLOAD_INVALID |
| V12 | outbound portable drafts: every declared timestamp member and createdAt equals its F10.S02.M03 publicTime value (busy-block ends raised to the next full hour) and the draft passes assertCoarseTime for those members; a draft that still fails is refused and nothing is published | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| V13 | delegated and relay operator roles: the author is listed with the row's role in the publisher's latest verified authority list returned by the delegations resolver (policy_decision: anchored no later than decidedAt and first listed at least 14 d before the proposal relay receipt) and never equals payload.publisherId, or is in operatorKeys of the named relay's latest verified tenant_config returned by the operatorKeys resolver (transparency_report: never the author of the embedded draft); a missing resolver, list or tenant_config resolves no role | FEDERATION_SIGNER_ROLE_INVALID |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T01 | unit | PS-083-01.R01, PS-083-01.R02, PS-083-02.R01, PS-083-09.R02 | build drafts for the three record types | payload members equal the allowlist subset; classification annotations present; drafts carry no seq or prev |
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01 | random records with random extra fields and outbound geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 and equal to the prefix of the source cell (snapped); assertPublicCell called once per draft |
| TEST-PS-083-09.T03 | unit | PS-083-02.R04, PS-083-07.R02 | outbound record with geohash 7 only; with exact lat/lon; with homeAddress and email | geohash 7 is snapped to its 5-character L2 cell with level L2 (export succeeds); lat/lon, homeAddress and email each refuse the export with FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T04 | unit | PS-083-02.R03, PS-083-02.R01 | record with opt-in false | FEDERATION_NOT_OPTED_IN; error params contain no field values |
| TEST-PS-083-09.T05 | unit | PS-083-02.R02, PS-083-02.R03 | inbound payload with extra member, 65537 bytes, unknown type version listing/v2 | FEDERATION_PAYLOAD_INVALID, PAYLOAD_TOO_LARGE (and not PAYLOAD_INVALID), UNSUPPORTED_SCHEMA_VERSION |
| TEST-PS-083-09.T06 | unit | PS-083-01.R02, PS-083-02.R01 | image referenced with GPS tag present | FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T12 | abuse | PS-083-02.R02, PS-083-07.R03 | inbound payload with script tag and long link text | stored as plain text and rendered escaped |
| TEST-PS-083-09.T20 | property | PS-083-02.R02, PS-083-02.R04 | inbound payloads with geohash lengths 6-12 and with latitude or longitude members | every one rejected with FEDERATION_PAYLOAD_INVALID; assertPublicCell invoked on the inbound path |
| TEST-PS-083-09.T22 | unit | PS-083-01.R06, PS-083-02.R03 | tombstone, ack, peer_offer and move payloads, and a participants ciphertext payload of 12288 and 12289 bytes | per-type schemas checked; portable allowlist (V08) and opt-in (V02) never applied to them; 12289 bytes rejected with FEDERATION_PAYLOAD_INVALID |
| TEST-PS-083-09.T23 | unit | PS-083-01.R08, PS-083-02.R05 | listing published at 10:47:12.345 with expiresAt 2026-12-04T10:47:12.345Z; busy block 10:20-11:40; two listing revisions inside one hour; a draft with an undeclared fine timestamp member | createdAt and publishedAt 10:00:00.000Z, expiresAt 2026-12-04T10:00:00.000Z; busy block 10:00-12:00; assertCoarseTime passes; revisions ordered by listingRevision and seq; the undeclared member refused with FEDERATION_EXPORT_FORBIDDEN_FIELD |
| TEST-PS-083-09.T26 | unit | PS-083-01.R02, PS-083-02.R01 | build drafts for a listing with every kind subset and variants, a service offering with credential evidence, a rental offering and a busy-blocks summary | payload keys equal the closed key sets of the note; offering keeps providerTimeZone, seq, prev and publishedAt and drops evidenceAttachmentId; maxBudget only when budgetVisible; busy blocks carry intervals and unit counts only |
| TEST-PS-083-09.T29 | unit | PS-083-01.R12, PS-083-01.R04, PS-083-02.R03, PS-083-04.R04 | roleFor for F18 rows with delegations and operatorKeys resolver stubs: policy_decision by a decider first listed 15 d and 10 d before the proposal receipt, by the publisher's own key, and with no delegations resolver registered; policy_cosign by a listed cosigner and by an unlisted key; transparency_report by a second operator key, by the embedded draft's compiler and by a key outside operatorKeys; rule_pack by its publisher | the 15 d decider, the listed cosigner, the second operator and the publisher resolve; every other case yields a rule that makes the receiving path quarantine with FEDERATION_SIGNER_ROLE_INVALID |

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, F10.S02.M03, F16.S01.M01, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
