# PS-090-07 — Privacy, retention and abuse: Account and relay migration

**Status:** SPECIFIED (Stage 3). **Module:** [F11.S03.M03 Account and relay migration](SPEC.md) · **Scope:** MVP · **Code:** `packages/federation/src/interop/migration` · **Contracts:** [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-090-07.R01** A move statement reveals the old and new relay of a pseudonymous did:key, which is public by design and stated in the wizard.
- **PS-090-07.R02** A stolen device key must not silently move an account, so a 24 h veto window and a 30-day cool-down limit the damage, and the UI says when only one device key exists and no veto is possible.
- **PS-090-07.R03** The move never transfers private data between relays; the vault re-establishes mailboxes and encrypted material itself.

## Specification

**Data classification**
- MigrationRecord and move statements: P0 (did, relay ids, times).
- Copy progress counters: P0.

**Retention**
- RET-EVIDENCE for MigrationRecord (2 years after closing); redirect data on the old relay 180 days after effectiveAt.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Stolen device key moves the account to an attacker relay | 24 h veto from another registered device key, 30-day cool-down, immediate notice on all devices, move requires a key registered ≥ 24 h |
| T02 | Forged move statement for a victim | signature by a key in the victim's portable document is mandatory; observers verify independently |
| T03 | Redirect abuse to send readers to a malicious relay | redirect only after a verified effective statement; relays are allowlisted or user-selected; readers see the target relay name |
| T04 | Replay of an old move statement to move an account back | move cid dedup, 30-day cool-down, seq chain position checked, tombstones kept 180 days |
| T05 | Metadata leak of old relay to new relay or peers | the statement carries only did and relay ids; no records or contact data are included |
| T06 | Relay move used to hijack peering | relay move honored only with the pinned relay key and, if the key changes, requires manual re-peering |

**Abuse controls**
- Move statements per did are limited to 3 per 90 days even when cancelled.
- Redirect lookups are rate limited to 60 per minute per IP prefix (/24 or /48).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-090-09.T03 | abuse | PS-090-02.R01, PS-090-07.R02 | move signed by revoked key, unlisted key and key registered 1 h earlier | FEDERATION_MOVE_SIGNER_INVALID |
| TEST-PS-090-09.T11 | abuse | PS-090-07.R01, PS-090-07.R02, PS-090-07.R03 | inspect move statement and UI with a single device key | no private data in statement; UI states that no veto is possible |
| TEST-PS-090-09.T12 | abuse | PS-090-07.R02, PS-090-02.R02 | second move after 10 days; 4th move statement in 90 days | FEDERATION_MOVE_COOLDOWN; rate limit |
| TEST-PS-090-09.T13 | abuse | PS-090-07.R01, PS-090-03.R01 | replay of old move statement after a newer move | rejected by cid dedup and chain position; no move back |
| TEST-PS-090-09.T14 | integration | PS-090-04.R03, PS-090-07.R03 | relay move signed by pinned key, and by a different key | base URL updated on peers for the first; second FEDERATION_KEY_MISMATCH and peer suspended |

## Dependencies

Module depends on: F11.S01.M02, F11.S01.M03, F11.S02.M01, F11.S03.M01, F07.S02.M01, F10.S01.M04, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-OBS-001, CTR-IOX-001, CTR-PRV-001. Predecessor: [domain_schema.md](domain_schema.md).
