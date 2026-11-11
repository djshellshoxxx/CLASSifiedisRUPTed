# PS-053-07 — Privacy, retention and abuse: Account recovery

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S01.M03 Account recovery](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/accounts/recovery` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-UX-001](../../../planning/contracts/CTR-UX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-053-07.R01** The 24 words and all derived keys exist only in memory during derivation and in the user's own hands; the vault stores no copy and no relay ever receives them.
- **PS-053-07.R02** The kit file is encrypted and may be stored anywhere the user chooses; the app never uploads it by default and states that the file alone is useless without the words.
- **PS-053-07.R03** The product states plainly that anyone with both the words and the file can control the account, that a newer kit does not revoke an older one, and that words and file should be stored separately.
- **PS-053-07.R04** The module meets the N6 privacy duties - it registers ExportSectionPort (section identity.recovery_kit), DeletionPort and RetentionPurgePort, classifies its fields with F10.S02.M02, pseudonymizes observed notices and disputes kept as RET-EVIDENCE instead of deleting them, checks federation_publish consent before sending statements to a relay, and treats privacy.deletion.completed only as final cleanup.

## Specification

**Data classification**
- RecoveryKit role kit: P4 (encrypted blob and verifier); metadata P3; words never stored.
- Recovery notice and dispute: signed public statements containing the DID, the new device public key, the planned revocations and claimed times, P0; device labels stay local.
- RecoveryKit role observed: P3 local record of a notice for the own DID.

**Retention**
- Role kit records until superseded, used or vault erase (RET-STANDARD); used and superseded records are kept 90 days then deleted.
- Observed notices and disputes RET-EVIDENCE (2 years after last related activity), pseudonymized on account deletion.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Stolen words and file used by an attacker to take over | notice statement, the receivers' own 72 hour wait and the dispute path give existing devices a chance to make the takeover visible as contested; honest limit - an attacker with both can sign as the account, including revocations that bypass the notice, so the advice is to store them separately and to start a new identity if the kit was exposed |
| T02 | Offline guessing of a weak secret | the secret is 256 bits random, so guessing is infeasible; scrypt N=2^17 adds cost for partial leaks |
| T03 | Parameter downgrade in a forged kit file | fixed parameter check V01 before derivation and checksum comparison against the stored metadata |
| T04 | Phishing site asks for the 24 words | the words are entered only in the app's recovery screen; the UI warns that no operator or relay will ever ask for them |
| T05 | Quiet takeover while the user is offline | verifying vaults apply recovery revocations only 72 hours after their own first sight of the notice and mark revocations without a notice as contested (F07.S02.M01); this binds honest clients and verifiers, not an attacker's own client |
| T06 | Relay or backup location reads the kit | file is encrypted with a key from a 256-bit secret; backups hold ciphertext only |
| T07 | Stolen device blocks recovery by disputing it | a dispute freezes the recovery as contested and extends the window to 7 days but cannot cancel it, revoke the new key or reset the kit; one dispute per key per 24 h |
| T08 | Leaked old kit after the user created a new one | every kit wraps the same root key, so superseding does not revoke the old kit; the UI says so and suggests a new identity; a dedicated recovery key is Future |
| T09 | Concurrent recoveries from two vaults | no lock can prevent them; receivers see two notices for one DID and freeze the identity as contested until explicit resolution |

**Abuse controls**
- Local backoff after 5 failed attempts: 60 s doubling to 900 s; at most 3 begin attempts per hour.
- Notice statements are limited to one per DID per 24 hours and disputes to one per signing key per 24 hours by receiving vaults; extra ones are quarantined.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-053-09.T11 | abuse | PS-053-04.R02, PS-053-07.R01, PS-053-07.R02, PS-053-09.R03 | inspect storage, events, logs, exports and network traces during create and begin | words and derived keys appear nowhere; no kit upload without the user's choice; relays receive only signed public or encrypted items |
| TEST-PS-053-09.T23 | unit | PS-053-01.R03, PS-053-07.R03 | create kit 2 after kit 1, then decrypt kit 1 | kit 1 superseded locally but still decrypts the root seed; the UI copy states that superseding does not revoke the old kit |
| TEST-PS-053-09.T24 | integration | PS-053-07.R04 | F10 export section, deletion plan and retention sweep with stub registries; notice to a relay without federation_publish consent | section identity.recovery_kit exported; observed notices and disputes pseudonymized, not deleted; notice delivered only to own mailboxes or as a file |
| TEST-PS-053-09.T25 | e2e | PS-053-09.R05, PS-053-07.R03 | UI copy check of create kit, recover and banner screens in every locale bundle | texts about kit possession, separate storage, superseded kits, receivers' 72 h wait and contested recoveries are present |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-IOX-001, CTR-UX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
