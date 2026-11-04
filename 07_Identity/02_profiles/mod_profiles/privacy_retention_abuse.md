# PS-056-07 — Privacy, retention and abuse: Profiles

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S02.M02 Profiles](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/profiles/profiles` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-056-07.R01** The block list is P3 and never leaves the vault, never appears in statements, logs, relay requests or events below P3, and the blocked person receives no notification.
- **PS-056-07.R02** Public profile fields are exactly what the user marked public; a published profile and copies other vaults fetched cannot be recalled, only superseded or tombstoned, and the UI says so before first publication.
- **PS-056-07.R03** Region never exceeds L2 and is off by default.

## Specification

**Data classification**
- Profile public fields: P0 once published; contacts fields: P2 end-to-end encrypted to participants; private fields stay P3 in the vault.
- BlockEntry: P3, device only; note is a private free text.

**Retention**
- Own profile and blocks until the user deletes them or vault erase (RET-STANDARD); removed blocks purged after 30 days; received profiles evicted after 180 days unviewed.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Blocked person learns of the block | statements from the blocked DID are dropped silently, no error identifies the block, the outbox of the sender shows at most transport_acknowledged and never peer_accepted; honest limit - repeated failure of acknowledgement can hint at it |
| T02 | Bio or avatar used for phishing or doxxing | plain text only, links not auto-linked, avatar re-encoded without metadata, report goes to the relay's hosting policy and local hide is available |
| T03 | Fake profile impersonating a known contact | profile signature binds content to the DID, DID fingerprint always shown next to the pseudonym, confusable warning from F07.S01.M01 |
| T04 | Region leak through visibility mistakes | region defaults to private, preview of 'what a stranger sees', statement composer drops private fields, contract test for L2 maximum |
| T05 | Mass profile spam from throwaway DIDs | vault intake limit of 50 profiles per hour per transport source, unknown DIDs shown as strangers, relay quotas apply |

**Abuse controls**
- Intake limits - 50 received profiles per hour per source, 32 KiB per statement, quarantine beyond.
- Block cap 1 000; block and unblock actions limited to 60 per hour to avoid accidental loops.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-056-09.T10 | abuse | PS-056-07.R01, PS-056-07.R02, PS-056-07.R03 | inspect statements, relay requests, logs and events for blocks and private fields; 51 profiles per hour from one source | none present; excess quarantined |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-OBS-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
