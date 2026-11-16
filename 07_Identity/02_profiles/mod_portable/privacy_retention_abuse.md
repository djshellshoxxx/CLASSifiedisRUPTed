# PS-055-07 — Privacy, retention and abuse: Portable identity

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M01 Portable identity](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/portable` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-055-07.R01** The document is a deliberate public P0 statement containing only public keys, the pseudonym and relay URLs, and it never contains P3 data, private keys or recovery material.
- **PS-055-07.R02** The product states before first publication that a published document and copies other vaults fetched cannot be recalled, only superseded or tombstoned.
- **PS-055-07.R03** Relays honor signed tombstones within 24 hours (FED-4, PRV-6) and may not rewrite documents.

## Specification

**Data classification**
- PortableIdentityDoc: P0 public; provenance fields are local metadata (P3 on device).

**Retention**
- Own and received documents until vault erase or contact removal (RET-STANDARD); superseded versions kept for 2 years (RET-EVIDENCE) to verify old statements; relay keeps the latest 20 versions per DID.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged document for someone else's DID | signature must verify against the key encoded in the DID; a forger would need the private key |
| T02 | Fork attack - attacker with a stolen device key publishes a conflicting document | device keys cannot sign documents (only the account key can), forks are detected and shown as contested, and the owner reissues with a higher seq |
| T03 | Replay of an old document to resurrect a revoked device | seq and prev chain; verifiers prefer the highest valid seq seen and warn on rollback |
| T04 | Document used to deanonymize the owner | the document contains only what the owner chose; the UI explains that a DID is a stable pseudonymous identifier that links all of the owner's public activity, not anonymity |
| T05 | Relay flood with many fake DIDs | 10 publications per hour per DID, 100 per hour per IP /24, 8 KiB size limit, relay hosting policy |
| T06 | Backdated issuedAt to claim earlier revocation | issuedAt is a claim; verifiers use seq and their own receipt time for trust decisions, the relay-signed receipt time is evidence of that relay's clock only |

**Abuse controls**
- Relay quotas as above; vault intake accepts at most 50 documents per hour from one transport source and quarantines the rest.
- Documents from blocked DIDs are dropped silently; the sender cannot tell.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-055-09.T11 | abuse | PS-055-07.R01, PS-055-07.R02, PS-055-07.R03 | inspect document for P3 fields and private keys; stolen device key tries to sign a document; relay receives 11 documents per hour for one DID | no private data; device-key signature rejected; 11th RATE_LIMITED |

## Dependencies

Module depends on: F07.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
