# PS-107-10 — Import, export, backup and rollback: Channel opt-in/opt-out

**Status:** SPECIFIED (Stage 3). **Module:** [F13.S02.M03 Channel opt-in/opt-out](SPEC.md) · **Scope:** MVP · **Code:** `packages/notify/src/preferences/opt` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-107-10.R01** A user's vault export contains their channel consents and signed statements.
- **PS-107-10.R02** Import re-verifies statements and never re-registers a consent at a relay without a fresh user confirmation.
- **PS-107-10.R03** Schema changes follow expand and contract; new channels are additive enum values behind a relay capability flag.

## Specification

- **export:** Section notify.channel_consents in classrup-export/v1; one line per ChannelConsent (schema classrup.notify.channel_consent/v1) without tokens.
- **import:** Statements are re-verified; granted records import as withdrawn pending reconfirmation when older than 30 days; existing IDs are skipped.
- **backup:** The vault export is the primary backup (IOX-6); relay consent rows are covered by relay SQLite backup (IOX-3, IOX-7) and restored consents are checked against expiry.
- **migration rollback:** Additive fields only in v1; rollback is safe because the relay treats unknown channels as unsupported and unknown fields are ignored.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-107-09.T12 | integration | PS-107-10.R01, PS-107-10.R02, PS-107-10.R03 | export, import into fresh vault, restore relay from backup | consents round trip; imported granted consents are re-registered only after user confirmation |

## Dependencies

Module depends on: F10.S01.M01, F07.S01.M01, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-PRV-001, CTR-IDM-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
