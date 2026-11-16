# PS-053-07 — Privacy, retention and abuse: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-07.R01** The 24 words and all derived keys exist only in memory during derivation and in the user's own hands; the vault stores no copy and no relay ever receives them.
- **PS-053-07.R02** The kit file is encrypted and may be stored anywhere the user chooses; the app never uploads it by default and states that the file alone is useless without the words.
- **PS-053-07.R03** The product states plainly that anyone with both the words and the file can control the account, so they should be stored separately.

## Specification

**Data classification**
- RecoveryKit: P4 (encrypted blob and verifier); metadata P3; words never stored.
- Recovery notice: signed public statement containing the DID, the new device public key and the planned revocation time, P0.

**Retention**
- RecoveryKit until superseded, used or vault erase (RET-STANDARD); used and superseded records are kept 90 days then deleted.
- Notices follow the identity document retention (F07.S02.M01).

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Stolen words and file used by an attacker to take over | notice statement and 72 hour window give existing devices a chance to dispute; honest limit - an attacker with both can still act as the account, so advice is to store them separately and rotate by creating a new identity if compromised |
| T02 | Offline guessing of a weak secret | the secret is 256 bits random, so guessing is infeasible; scrypt N=2^17 adds cost for partial leaks |
| T03 | Parameter downgrade in a forged kit file | fixed parameter check V01 before derivation and checksum comparison against the stored metadata |
| T04 | Phishing site asks for the 24 words | the words are entered only in the app's recovery screen; the UI warns that no operator or relay will ever ask for them |
| T05 | Quiet takeover while the user is offline | revocation of other devices cannot happen before 72 hours, notice is delivered through identity documents and mailbox, and a dispute creates a visible contested state (fork detection in F07.S02.M01) |
| T06 | Relay or backup location reads the kit | file is encrypted with a key from 256-bit secret; backups hold ciphertext only |

**Abuse controls**
- Local backoff after 5 failed attempts: 60 s doubling to 900 s; at most 3 begin attempts per hour.
- Notice statements are limited to one per account per 24 hours by receiving vaults; extra ones are quarantined.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T11 | abuse | PS-053-07.R01, PS-053-07.R02, PS-053-07.R03 | inspect storage, events, logs, exports and network traces during create and begin | words and derived keys appear nowhere; no kit upload without the user's choice; 6th failed attempt triggers backoff |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
