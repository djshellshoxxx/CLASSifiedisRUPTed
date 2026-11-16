# PS-052-09 — Contract and acceptance tests: Pseudonymous accounts

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M01 Pseudonymous accounts](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/pseudonyms` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-052-09.R01** Every requirement is covered by at least one automated test with injected clock, ID generator and fixed key pairs.
- **PS-052-09.R02** Pseudonym tests run the UTS
- **PS-052-09.R03** Statement tests verify signatures with RFC 8032 vectors and domain-separation negative cases.

## Specification

See the module test table below (all processes).

**Fixtures:** Fixed Ed25519 key pairs A1, A2, B1; pseudonym corpus (valid, mixed script, homoglyph pairs 'paypal' and Cyrillic lookalike, RTL override, zero-width); pinned confusables data 16.0.0; fixed clock 2026-11-04T10:00:00Z; relay with registry enabled.

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-052-09.T01 | unit | PS-052-01.R01, PS-052-01.R02, PS-052-04.R01 | create account with valid pseudonym | Account stored with did:key (prefix z6Mk), no private key in records, events emitted |
| TEST-PS-052-09.T02 | unit | PS-052-02.R01, PS-052-02.R02 | pseudonym corpus - too short, 33 code points, spaces, all digits, mixed Latin and Cyrillic, RTL override, zero-width joiner | IDENTITY_PSEUDONYM_INVALID for each; valid CJK and Latin samples accepted |
| TEST-PS-052-09.T03 | property | PS-052-02.R01, PS-052-02.R02 | UTS #39 confusable pairs and 10 000 random NFKC-equivalent strings | equal skeletons for confusable pairs; normalization is idempotent |
| TEST-PS-052-09.T04 | unit | PS-052-02.R03, PS-052-02.R01 | reserved names and their homoglyph forms | IDENTITY_PSEUDONYM_RESERVED |
| TEST-PS-052-09.T05 | integration | PS-052-01.R03, PS-052-02.R03, PS-052-03.R03 | two DIDs claim confusable handles on one relay; release then reclaim within and after 30 days | second claim IDENTITY_PSEUDONYM_TAKEN or CONFUSABLE; only former DID can reclaim within 30 days; purge after |
| TEST-PS-052-09.T06 | integration | PS-052-02.R03, PS-052-03.R01 | change pseudonym twice within 30 days in vault and on registry | vault asks confirmation; registry returns IDENTITY_PSEUDONYM_COOLDOWN |
| TEST-PS-052-09.T07 | unit | PS-052-02.R02, PS-052-02.R03, PS-052-03.R02 | add device with valid, stale (11 min), wrong-signer link; add 11th device | success then IDENTITY_LINK_INVALID and IDENTITY_DEVICE_LIMIT; revoked key cannot be re-added |
| TEST-PS-052-09.T08 | integration | PS-052-03.R02, PS-052-02.R03 | revoke last device with and without verified recovery kit | IDENTITY_LAST_DEVICE_KEY without kit; allowed with kit |
| TEST-PS-052-09.T09 | contract | PS-052-04.R01, PS-052-04.R02, PS-052-04.R03, PS-052-09.R02 | each command and query run | outputs, statements and events validate against registry schemas; statement signatures verify per RFC 8032 |
| TEST-PS-052-09.T10 | abuse | PS-052-05.R01, PS-052-05.R02, PS-052-05.R03 | locked vault mutates; claim signed by a different DID; operator tries to create a DID on the registry | FORBIDDEN or VALIDATION_FAILED; no registry row created |
| TEST-PS-052-09.T11 | integration | PS-052-06.R01, PS-052-06.R02, PS-052-06.R03 | replay same Idempotency-Key; two tabs and two devices act concurrently; keystore write fails during creation | one result; CONFLICT_REVISION or contested document; nothing persisted on failure |
| TEST-PS-052-09.T12 | abuse | PS-052-07.R01, PS-052-07.R02, PS-052-07.R03 | scan storage, logs and exports of other users for private keys, emails and passwords; 6 claims in an hour from one IP /24 | none found; 6th claim RATE_LIMITED |
| TEST-PS-052-09.T13 | load | PS-052-08.R01, PS-052-08.R02, PS-052-08.R03 | 50 claims per second for 5 minutes on a relay; account creation on emulated Moto G | p95 <= 300 ms on relay and <= 2 s creation; skeleton <= 5 ms |
| TEST-PS-052-09.T14 | a11y | PS-052-01.R01 | create identity and devices screens with axe-core and keyboard only | zero serious or critical issues; validation messages announced |
| TEST-PS-052-09.T15 | unit | PS-052-09.R01, PS-052-09.R03 | traceability run over PS-052 | every requirement maps to a passing test |
| TEST-PS-052-09.T16 | integration | PS-052-10.R01, PS-052-10.R02, PS-052-10.R03 | export, import into a fresh vault, vault erase | Account and DeviceKey public data round-trip; private keys excluded; erase deletes all |

## Acceptance criteria

- All tests T01-T16 pass in CI.
- No private key, passphrase or email is ever present in module storage, events, logs or relay payloads (privacy suite).
- Homoglyph and mixed-script pseudonym samples are rejected or warned according to the rules, and no claim of global pseudonym uniqueness appears in the UI or docs.

## Dependencies

Module depends on: CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
