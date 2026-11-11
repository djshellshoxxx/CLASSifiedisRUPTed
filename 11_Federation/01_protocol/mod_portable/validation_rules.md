# PS-083-02 — Validation rules: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-02.R01** Outbound mapping is default-deny, so a new local field is never exported until it is added to an allowlist and reviewed.
- **PS-083-02.R02** Inbound payload validation uses the same allowlist and location rules and rejects unknown fields and any location finer than L2 instead of ignoring or trimming them.
- **PS-083-02.R03** Every rejection returns a stable code that the calling module surfaces without echoing field values.
- **PS-083-02.R04** Location precision is enforced on both paths through F06.S02.M01 assertPublicCell; outbound cells are snapped to L2 before the check (PRV-1) and inbound payloads with a cell longer than 5 characters or with coordinate members are rejected.

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
| V08 | audience public portable types only: the type is one of the three portable allowlist types and its version major is supported | UNSUPPORTED_SCHEMA_VERSION |
| V09 | inbound location: region.geohash length ≤ 5 and passes F06.S02.M01 assertPublicCell, and no latitude or longitude member is present | FEDERATION_PAYLOAD_INVALID |
| V10 | role resolution keeps key classes apart: relay roles resolve only through the injected pinned-key resolver (F11.S03.M01) and user roles only through the injected portable-document resolver (F07.S02.M01); a key of the other class never matches | FEDERATION_SIGNER_ROLE_INVALID |
| V11 | control types validate against their per-type payload schema in the registry; participant statements carry a ciphertext payload {alg, ciphertext, recipientsKeyIds} of at most 12288 bytes, checked for shape and size only | FEDERATION_PAYLOAD_INVALID |

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

## Dependencies

Module depends on: F06.S02.M01, F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001, CTR-ID-001. Predecessor: [domain_schema.md](domain_schema.md).
