# PS-077-07 — Privacy, retention and abuse: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-07.R01** Deletion removes content and shreds keys; evidence classes under RET-EVIDENCE are pseudonymized and kept until their retention ends unless the user chooses to purge their own evidence copies; pseudonymized is not anonymized.
- **PS-077-07.R02** The UI and completion summary state that deletion covers this device and browser profile only, that the recovery kit and other devices can re-create the identity unless destroyed, that copies fetched by other vaults and relays, exported files and user backups cannot be recalled, and that relay legal holds may retain relay-held copies sealed.
- **PS-077-07.R03** Abusive or coerced deletion is limited by the fresh unlock, typed confirmation, 14-day grace with banners, and cancellation.

## Specification

**Data classification**
- DeletionRequest: P3; after completion residue form without did and salt. Salt: P4, destroyed at completion. Ledger salt: P4, kept in the residue store only for ledger lookups and deleted with the last ledger entry. Pseudonym: P1 identifier shown in retained evidence.
- Ledger entries: ledgerKey (HMAC-SHA256 of the did) and ledgerUntil only, kept 180 days. deletion_statement: P2 for its relay. deletion_notice: P2, encrypted end-to-end to the counterparties of the commitment or, for the departure notice, to each thread counterparty, who already know the did; it carries no content, thread ID or list of other recipients.

**Retention**
- Deleted content purged at execution; pseudonymized evidence-only vault in the residue store per RET-EVIDENCE (2 years after last related activity) when keepEvidence is true; ledger 180 days; residue outbox entries until delivered or 30 days after signing; residue DeletionRequest RET-EVIDENCE.
- Crypto-shredding removes keys for encrypted blobs; relays that hold ciphertext keep unreadable bytes until their retention sweep.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Attacker with a briefly unlocked device deletes the account | fresh unlock within 5 minutes, typed pseudonym confirmation, 14-day grace with persistent banner and local notification, cancellation allowed |
| T02 | Pseudonymized evidence re-identified through the salt or a stored join | salt destroyed at completion, did removed from the retained request, ledger keyed by HMAC with a separate salt and holding no requestId or pseudonym; residual risk - on a profile with a single deletion the existence of a ledger entry and a residue record can be correlated, counterparties keep their own signed copies with the did, and behavioral linkage in evidence may still identify the person |
| T03 | Deleted identity resurrected from an export, backup, other device or recovery kit | ledger consulted by restores into this browser profile; every device key revoked by signed statements before destruction; residual risk - an export restored on a fresh device, another device or the recovery kit can re-create the identity, and the UI says so before confirmation and in the summary |
| T04 | Relay ignores tombstones | signed tombstones are verifiable evidence; per-relay delivery state shown; clients can drop that relay |
| T05 | Counterparty harmed by sudden deletion mid-trade | deferral up to 30 days for open commitments and an encrypted signed deletion notice so counterparties can use recovery or disputes |
| T06 | Stale, replayed or forged deletion statement | dedupe on (did, requestId, batch hash), signer must be a registered key or listed as final by its account_deleted revocation, audience bound to relayId, 30-day acceptance window plus 10 minutes skew |
| T07 | The departure notice reveals who else the user talked to, or reaches people outside the user's threads | one notice per deletion sealed separately per mailbox, no recipient list, thread ID or content in the payload, and recipients limited to the thread counterparties listed by the F08 plans (V12) |
| T08 | Erase vault or a lock wipes the only copy of the user's data without warning | Erase vault runs this flow with the export prompt first and the 14-day grace; lock and principal switch never call DeletionPort (V13) |

**Abuse controls**
- One request at a time; relay_apply limited to 60 batches per hour per did by the relay command bus (F15.S02.M02) through RateLimitPort (N18); tombstone batches limited to 100 envelopes (FED-5).

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T01 | unit | PS-077-02.R01, PS-077-07.R03 | request deletion with wrong then right confirmation text and stale unlock | right text with fresh unlock creates pending_grace; others return documented errors |
| TEST-PS-077-09.T07 | integration | PS-077-07.R01, PS-077-01.R04 | complete deletion with keepEvidence true then false | true keeps a pseudonymized evidence-only vault in the residue store and deletes content; false also purges own evidence copies; pseudonym stable across modules |
| TEST-PS-077-09.T10 | integration | PS-077-01.R02, PS-077-07.R02 | after completion inspect storage and UI summary | content gone, salt destroyed, did removed, pseudonym recorded, this-device-only notice, recovery-kit warning, cannot-recall notice and relay-hold notice displayed |
| TEST-PS-077-09.T15 | e2e | PS-077-07.R02 | user flow on two devices with banner, cancel and final summary | banner and summary shown with the this-device limit and the other-device warning; axe zero serious issues |
| TEST-PS-077-09.T22 | e2e | PS-077-07.R02, PS-077-01.R04 | restore the pre-deletion export on a fresh device after completion | restore succeeds on that device, documenting the limit that the UI and completion summary stated |
| TEST-PS-077-09.T27 | e2e | PS-077-02.R05, PS-077-07.R02 | tap Erase vault in the PWA, then lock the vault and switch principal with queued entries | the export prompt is shown before anything is deleted and the deletion request starts grace only after confirmation; lock and switch keep every record and entry and never call DeletionPort |

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
