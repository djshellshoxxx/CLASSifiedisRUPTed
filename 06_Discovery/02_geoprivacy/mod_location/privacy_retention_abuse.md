# PS-048-07 — Privacy, retention and abuse: User location settings

**Status:** SPECIFIED (Stage 3). **Module:** [F06.S02.M02 User location settings](SPEC.md) · **Scope:** MVP · **Code:** `packages/discovery/src/geoprivacy/location` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-048-07.R01** Raw GPS points are never persisted, logged, or put in any event, export of another user or relay-readable payload; references to them are dropped right after snapping or after the share statement is built, and no timing of erasure from memory is claimed.
- **PS-048-07.R02** A share reaches the counterparty only as an end-to-end encrypted envelope (PRV-5); a relay sees ciphertext, size and recipient mailbox id only, and deletes it at the envelope's expiresAt (at most 24 h).
- **PS-048-07.R03** The UI states that the recipient's device can keep a copy and that the share protects against accidental long-lived exposure, not against a malicious recipient.
- **PS-048-07.R04** LocationSetting and LocationShare are registered with F10 - ExportSectionPort (LocationSetting only), DeletionPort (LocationSetting and markers deleted when the plan executes), RetentionPurgePort (ended records after 24 h, markers after 8 days) - and every field is classified with F10.S02.M02; a deletion request only ends active shares.

## Specification

**Data classification**
- LocationSetting: P3 on device; only the public-level cell is ever placed in a profile or listing projection, at most L2.
- LocationShare: P3 on device while active; cell6 and position stored only as ciphertext under a per-share key that is deleted at the end; statements travel encrypted, claimed times are the sender's claims.
- Replay markers: shareId, statementCid and sharerDid only, P3, 8 days.

**Retention**
- LocationSetting until changed or the DeletionPort plan executes (RET-STANDARD); LocationShare records 24 h after ending (RET-EPHEMERAL); the per-share key is deleted at the moment the share ends.
- Replay markers 8 days, a documented exception to RET-EPHEMERAL because they must outlive any relay mailbox copy; outbox copies of share statements are deleted at effectiveExpiresAt or on transport_acknowledged plus 24 h, whichever is earlier; relay mailbox copies expire at claimedExpiresAt.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Precise share used to stalk | single counterparty, TTL at most 24 h, context binding, block ends shares both ways, no continuous live tracking in MVP, location_precise consent, warning text before sharing |
| T02 | Recipient keeps coordinates after expiry | protocol cannot force deletion; honest UI warning, short default of 2 h, L3 cell option, signed revoke honoured by compliant clients |
| T03 | Relay reads precise position | end-to-end encryption to the recipient device key (XChaCha20-Poly1305), relay sees ciphertext only and deletes it at claimedExpiresAt |
| T04 | Forged or replayed share or revoke statement | F11.S01.M02 acceptance with signer role sharer, Ed25519 over JCS bytes, recipient addressing, bounded claimed times (V09, V10), statementCid dedupe and 8-day ended and pending-revoke markers |
| T05 | Position probing by moving search centers | not controlled here - the relay proximity budget of F06.S02.M03 limits center changes; the home-change confirmation in this module is a UX guard only and makes no security claim |
| T06 | Stored position recovered from the device after the share ended | crypto-shredding - the per-share key is deleted when the share ends, so stored ciphertext cannot be decrypted |

**Abuse controls**
- Grant rate limited to 10 per hour per vault through RateLimitPort (vault scope, F12.S03.M03) and 5 active shares; incoming shares limited to 20 per day per sender DID, excess quarantined.
- Incoming shares from DIDs outside the user's contacts or active conversations are shown as requests and never auto-displayed.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-048-09.T08 | abuse | PS-048-05.R02, PS-048-07.R01, PS-048-07.R02 | inspect relay-visible bytes, logs, events, and export of another user | only ciphertext visible to relay; no coordinates in logs or events; no shares in others' exports |
| TEST-PS-048-09.T12 | a11y | PS-048-07.R03 | location settings and share sheet with axe-core and keyboard-only map alternative | zero serious or critical violations, list alternative works, warning about copies on the other device is visible text and announced |
| TEST-PS-048-09.T18 | integration | PS-048-07.R04 | deletion requested, then cancelled; a second request executed; export run | shares end with reason erased and LocationSetting is kept after the cancelled request; the setting is deleted only when the DeletionPort plan executes; export has section discovery.location_setting; every field classified |
| TEST-PS-048-09.T21 | unit | PS-048-01.R03, PS-048-07.R01 | end a share, then try to decrypt the stored ciphertext; scan IndexedDB, logs and events after a GPS-once | per-share key absent from the keystore and decryption fails; no raw point stored or logged |

## Dependencies

Module depends on: F06.S02.M01, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F11.S01.M03, F11.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, F12.S03.M03, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001, CTR-IOX-001, CTR-UX-001. Predecessor: [domain_schema.md](domain_schema.md).
