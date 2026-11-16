# PS-048-07 — Privacy, retention and abuse: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-07.R01** Raw GPS points exist only in memory for under 1 second to be snapped or, for an L4 share, until the share statement is built; they are never logged and never put in any event, export of another user, or relay-readable payload.
- **PS-048-07.R02** A share reaches the counterparty only as an end-to-end encrypted envelope (PRV-5); a relay sees ciphertext, size and recipient mailbox id only.
- **PS-048-07.R03** The UI states that the recipient's device can keep a copy and that the share protects against accidental long-lived exposure, not against a malicious recipient.

## Specification

**Data classification**
- LocationSetting: P3 on device; only the public-level cell is ever placed in a profile or listing projection, at most L2.
- LocationShare: P3 on device while active; position bytes overwritten at end; statements travel encrypted, claimed times are the sender's claims.

**Retention**
- LocationSetting until changed or vault erase (RET-STANDARD); LocationShare records 24 h after ending (RET-EPHEMERAL); share position data is deleted at the moment the share ends.
- Outbox copies of share statements are deleted at effectiveExpiresAt or on transport_acknowledged plus 24 h, whichever is earlier.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Precise share used to stalk | single counterparty, TTL at most 24 h, context binding, block ends shares both ways, no continuous live tracking in MVP, warning text before sharing |
| T02 | Recipient keeps coordinates after expiry | protocol cannot force deletion; honest UI warning, short default of 2 h, L3 cell option, signed revoke honoured by compliant clients |
| T03 | Relay reads precise position | end-to-end encryption to the recipient device key (XChaCha20-Poly1305), relay sees ciphertext only |
| T04 | Forged or replayed share statement | Ed25519 signature over JCS bytes, recipient addressing, statementCid dedupe, effective expiry anchored at local receipt time |
| T05 | Home region probing - a user repeatedly moves the home cell to map others | 3 changes per 24 h local guard, home is never shown to others below the chosen public level |

**Abuse controls**
- Grant rate limited to 10 per hour per vault and 5 active shares; incoming shares limited to 20 per day per sender DID, excess quarantined.
- Incoming shares from DIDs outside the user's contacts or active conversations are shown as requests and never auto-displayed.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T08 | abuse | PS-048-05.R02, PS-048-07.R01, PS-048-07.R02 | inspect relay-visible bytes, logs, events, and export of another user | only ciphertext visible to relay; no coordinates in logs or events; no shares in others' exports |
| TEST-PS-048-09.T10 | abuse | PS-048-07.R03 | 11 grants in one hour and 21 incoming shares from one DID | RATE_LIMITED on the 11th grant; excess incoming quarantined |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
