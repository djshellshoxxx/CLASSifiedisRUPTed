# PS-078-07 — Privacy, retention and abuse: Data export

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M03 Data export](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/export` · **Contracts:** [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-078-07.R01** The bundle contains P3 data and is encrypted at rest with a per-job key; the key is deleted at expiry, and the UI warns that the downloaded file is plain JSON Lines that the user must protect.
- **PS-078-07.R02** The export excludes other users' P2 and higher content and all P4 secrets; device private keys are never exported, and recovery material is exported only as the user's own recovery hints (P3) and never as keys.
- **PS-078-07.R03** Export abuse by someone with brief access to an unlocked device is limited by the fresh-unlock requirement, rate limit and an on-screen notification of every export.

## Specification

**Data classification**
- ExportJob: P3 metadata. Bundle: P0 to P3 user data, encrypted at rest for up to 7 days.
- The manifest signature proves integrity and origin device, not truth of content.

**Retention**
- Bundle 7 days after ready; ExportJob record RET-SHORT (30 days) after expiry; no copy leaves the device.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Device thief exports everything | fresh unlock within 5 minutes required, 3 exports per 24 h, persistent in-app export notice, bundle encrypted at rest and deleted in 7 days |
| T02 | Bundle tampered after export | manifest per-section SHA-256 and Ed25519 signature; import verifies (IOX-2); parts of a set are linked by setId and the part-1 manifest hash |
| T03 | Export leaks other users' private content | redactForExport on every record (F10.S02.M02) and validation V06; sections declare classification per field and CI rejects unclassified fields |
| T04 | Private keys or unclassified secrets exfiltrated through export | P4 and unclassified paths dropped by redactForExport; test scans bundles for key material patterns |

**Abuse controls**
- 3 requests per 24 hours per vault, one active job, and one open_download per minute.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-078-09.T12 | abuse | PS-078-07.R01, PS-078-07.R03 | 4th export in 24 h; bundle scanned for another user's P2 content and private key patterns | 4th RATE_LIMITED; scan finds none |
| TEST-PS-078-09.T13 | integration | PS-078-07.R02, PS-078-02.R02 | bundle scanned for P4 fields, unclassified fields and other users' private content | none present; user's own shared copies present |
| TEST-PS-078-09.T20 | e2e | PS-078-07.R03 | start an export and navigate across screens; reload the PWA | the in-app export notice is shown on every screen until dismissed and is announced politely; it survives reload |

## Dependencies

Module depends on: F07.S01.M01, F10.S02.M02, F10.S01.M02, CTR-IOX-001, CTR-PRV-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
