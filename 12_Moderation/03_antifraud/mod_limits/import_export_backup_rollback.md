# PS-098-10 — Import, export, backup and rollback: Account limits

**Status:** SPECIFIED (Stage 3). **Module:** [F12.S03.M04 Account limits](SPEC.md) · **Scope:** MVP · **Code:** `packages/moderation/src/antifraud/limits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-098-10.R01** A member's export includes the limits the relay reports for them as read-only context, without moderator override identity.
- **PS-098-10.R02** Relay import of limits is only from its own backups; imports from other relays are ignored because standing is relay-local.
- **PS-098-10.R03** Tier tables are configuration versioned with the relay policy and validated against bounds on import.

## Specification

- **export:** Section moderation.limits in classrup-export/v1 (vault, ExportSectionPort): last known limits per relay with fetched time; relay operator export lists AccountLimit rows without override reasons about others.
- **import:** Vault import stores limits as historical context only; relay restore recomputes tier, multiplier and restrictions from first-seen, counted completions, the latest risk event and active actions.
- **backup:** Covered by relay SQLite backup (CTR-IOX-001 IOX-3).
- **migration rollback:** Expand step maps listings_per_day to index_writes_per_day and new_conversations_per_day to new_mailbox_recipients_per_day, and drops open_offers and open_cycle_proposals rows (now F12.S03.M03 local guards); rollback is safe because older readers ignore new optional fields and unknown limit keys are not enforced but logged.

Baseline per [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-098-09.T14 | integration | PS-098-10.R01, PS-098-10.R02, PS-098-10.R03 | export own limits, relay backup and restore; v1 row with limitKey listings_per_day | limits recomputed after restore; firstSeen set to restore time when absent; listings_per_day read as index_writes_per_day |

## Dependencies

Module depends on: F12.S03.M03, F07.S02.M01, F16.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
