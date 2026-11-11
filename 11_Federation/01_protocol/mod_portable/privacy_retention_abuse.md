# PS-083-07 — Privacy, retention and abuse: Portable record packaging

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S01.M01 Portable record packaging](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/protocol/portable` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-TST-001](../../../planning/contracts/CTR-TST-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-083-07.R01** Only owner-opted-in P0 data at maximum precision L2 can leave the relay; every other field is dropped or the export refused.
- **PS-083-07.R02** Exact home address (P3), contact details and anything P1-P4 can never appear in a draft; tests assert this on every release.
- **PS-083-07.R03** Pseudonymity is not anonymity, so the consent preview states that all records of one did:key are linkable and that deletion propagates by tombstone but cannot recall copies.

## Specification

**Data classification**
- Drafts: P0 only, transient, not stored by this module.
- Mirror views: P0 copies of remote content; stored by F11.S01.M02.

**Retention**
- No retention in this module; stored mirrors follow F11.S01.M02 (RET-STANDARD with tombstone 180 days).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | New local field silently leaking into federation | default-deny allowlist; CI test fails if a record type has a field without a classification annotation |
| T02 | Location refinement attack (geohash 7 or coordinates leaked in ext) | V04 truncates to 5 and refuses coordinates; ext must be empty object or registered key |
| T03 | Metadata leakage through images (EXIF GPS, device serial) | V05 only references stripped media hashes; relay rejects GPS tags per PRV-4 |
| T04 | Remote payload with executable or HTML content | inbound strings are plain text; mirror view escapes at render; links shown as text |

**Abuse controls**
- Per-author draft rate cap 60 drafts/hour enforced by the caller through F12.S03.M03 rate limits.
- Inbound payloads over 65536 bytes are rejected before parsing members.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-083-09.T02 | property | PS-083-01.R03, PS-083-02.R01, PS-083-07.R01, PS-083-09.R03 | random records with random extra fields and geohash lengths 1-12 | no draft contains a non-allowlisted member; geohash length ≤ 5 |
| TEST-PS-083-09.T03 | unit | PS-083-02.R01, PS-083-07.R02, PS-083-09.R02 | record with homeAddress, email, exact lat/lon, geohash 7 | export refused or truncated per V03/V04 and codes returned |
| TEST-PS-083-09.T11 | a11y | PS-083-07.R03 | open consent preview with screen reader and keyboard only | every field and the linkability notice are announced, controls ≥ 44 px |
| TEST-PS-083-09.T12 | abuse | PS-083-07.R02, PS-083-07.R03 | inbound payload with script tag and long link text | stored as plain text and rendered escaped |

## Dependencies

Module depends on: F10.S02.M02, CTR-FED-001, CTR-PRV-001, CTR-ERR-001, CTR-SCH-001, CTR-TST-001. Predecessor: [domain_schema.md](domain_schema.md).
