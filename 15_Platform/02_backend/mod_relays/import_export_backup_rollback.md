# PS-118-10 — Import, export, backup and rollback: Relay service

**Status:** SPECIFIED (Stage 3). **Module:** [F15.S02.M01 Relay service](SPEC.md) · **Scope:** MVP · **Code:** `apps/relay/src/relays` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-118-10.R01** RelayIdentity public records are included in the relay's operational export; the private seed and revocation certificates are excluded and backed up only by the operator in a separate secret store.
- **PS-118-10.R02** A restored relay must present the same relayId and active key, otherwise members' vaults treat it as a different relay and show a fingerprint warning; a restore with --new-identity always yields a new relayId.
- **PS-118-10.R03** Application rollback redeploys the previous release (CTR-IOX-001 IOX-4); schema changes are expand/contract so N-1 starts.

## Specification

- **export:** Relay operational export (not a user export): table platform_relay_identity as JSON Lines with schema classrup.platform.relay_identity/v1, including rotation and revocation statements; the key file and revocation certificates are never exported.
- **import:** Import of a RelayIdentity row requires the matching key file; otherwise the import is refused with PLATFORM_RELAY_IDENTITY_MISSING.
- **backup:** Database covered by F15.S03.M02 (CTR-IOX-001 IOX-3, IOX-7). The key file and revocation certificates are backed up by the operator separately and never inside the same artifact as the database backup.
- **migration rollback:** Identity rows are additive (new columns key_id, seq, prev_key_id, revoked_at are expand-only); rollback to N-1 is safe because new optional fields are ignored. The RelayProcess has no persistent migration of its own. Key rotation is not rolled back; to undo, rotate again; a revocation is final.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-118-09.T17 | integration | PS-118-10.R01, PS-118-10.R02, PS-118-10.R03 | export relay-hosted data section, restore from backup to a new directory with the key file, roll back one release | identity and archive intact, same relayId, receipts still verify, N-1 binary starts |

## Dependencies

Module depends on: F15.S02.M02, F15.S02.M03, F15.S03.M01, F16.S01.M01, CTR-ID-001, CTR-EVT-001, CTR-IDM-001, CTR-ERR-001, CTR-CAP-001, CTR-FED-001, CTR-OBS-001, CTR-PRV-001, CTR-IOX-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
