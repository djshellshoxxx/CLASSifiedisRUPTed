# PS-069-07 — Privacy, retention and abuse: Noncustodial payment claims

**Status:** SPECIFIED (Stage 3). **Module:** [F09.S01.M01 Noncustodial payment claims](SPEC.md) · **Scope:** MVP · **Code:** `packages/commerce/src/payments/noncustodial` · **Contracts:** [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-069-07.R01** Deals and claims are P2 and are never in public projections, search, federation or notification payloads; notifications carry a reference and template key only.
- **PS-069-07.R02** Evidence is retained for RET-EVIDENCE (2 years after last activity, jurisdiction override via F18) and pseudonymized on account deletion; signatures are retained as evidence and marked unverifiable-after-pseudonymization.
- **PS-069-07.R03** Claim spam, false claims and acknowledgement pressure are limited by per-vault limits, local blocking and the dispute path; signatures evidence assertions only.
- **PS-069-07.R04** The module registers ExportSectionPort (section commerce.deals), DeletionPort (the pseudonymization above) and RetentionPurgePort (RET-EVIDENCE) with F10 (N6), annotates every Deal and PaymentClaim field with its F10.S02.M02 class, and consumes privacy.deletion.completed.
- **PS-069-07.R05** Ingest is flood-bounded - per-did buffering applies only to known parties, the quarantine holds at most 500 entries or 5 MiB with oldest-first eviction, and once it is full statements whose signer is party to no known Deal or context are dropped instead of quarantined.
- **PS-069-07.R06** Statements from a blocked did are dropped silently at ingest (N7, F07.S02.M02), except statements for a Deal with an open dispute case, which are stored as evidence with notifications suppressed.

## Specification

**Data classification**
- Deal and PaymentClaim: P2 (parties). txRef and note: P2 free text; never federated.
- Field classes annotated per F10.S02.M02: party dids, amounts, statement cids, txRef and note are P2; no P3 or P4 field exists.
- The UI and exports state that a claim is an assertion by the payer and an acknowledgement is an assertion by the payee.

**Retention**
- RET-EVIDENCE (2 years after last related activity); expired and cancelled Deals follow the same class; purged through the RetentionPurgePort unless a legal hold applies (F10.S01.M02).
- On deletion: did replaced with a per-deletion pseudonym in retained records; counterparty copies in other vaults are not altered and cannot be recalled.
- Quarantined and buffered statements: dropped after 24 h or on eviction; never exported.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Payer claims payment never made to pressure the payee | claims display as claimed (unverified); only a payee-signed acknowledgement unlocks completion; payee can dispute with one tap |
| T02 | Payee acknowledges then denies receipt | acknowledgement is a signed statement kept by both parties as evidence; receipts (F09.S02.M01) and disputes (F09.S02.M02) use it |
| T03 | Forged statement from a non-party | signature, key status and role check at ingest; quarantine with reason and no state change |
| T04 | Replay of an old statement | cid deduplication and per-author seq and prev chain; replays are no-ops |
| T05 | Fork - payer vault signs two different claims with the same prev or seq | detection by the per-author chain; claim frozen, both statements retained, user prompted to renegotiate or open a dispute |
| T06 | Claim flooding to harass a payee | local block, per-party limit of 20 statements per hour accepted at ingest, bounded quarantine of excess |
| T07 | Counterparty signs a Deal with inflated or redirected obligations | ContextTermsPort recomputes parties and obligations from the verified context statement; mismatch quarantined with COMMERCE_DEAL_CONTEXT_CONFLICT |
| T08 | Sybil flood from freshly generated did:keys exhausts vault storage | vault-wide quarantine cap of 500 entries or 5 MiB with oldest-first eviction; non-party signers dropped once full; per-did buffering only for known parties |
| T09 | Private key pasted as a crypto txid would be signed and sent | MethodRulePort hold keeps the claim unsigned and unsent until the verifier finds the transaction or the payer attests it is a public transaction ID |

**Abuse controls**
- Ingest limit 20 statements per hour per known party did and 200 per day; statements from dids that are party to no known Deal or context share a vault-wide quarantine cap of 500 entries or 5 MiB (oldest-first eviction) and are dropped once it is full.
- Local block (F07.S02.M02) rejects commands with BLOCKED_PARTY and drops incoming statements from blocked parties silently with no signal to the sender, except evidence for a Deal with an open dispute case.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-069-09.T10 | abuse | PS-069-05.R01, PS-069-05.R02, PS-069-07.R01, PS-069-02.R02 | forged statement, wrong-role signer, signing key not active in the signer's identity document, third party reading | statement quarantined with reason, no state change, NOT_FOUND for non-parties, no deal data in public payloads |
| TEST-PS-069-09.T13 | chaos | PS-069-06.R03, PS-069-07.R03, PS-069-09.R03, PS-069-02.R02, PS-069-02.R05 | vault B receives two different claims by the payer with the same prev | claim frozen with COMMERCE_STATEMENT_FORK, both retained, no auto-resolution; flood of 21 statements in an hour from a known party quarantines the 21st |
| TEST-PS-069-09.T14 | integration | PS-069-07.R02 | principal deletion completes | retained records carry the pseudonym, signatures flagged unverifiable-after-pseudonymization, counterparty copy untouched |
| TEST-PS-069-09.T30 | abuse | PS-069-07.R05 | 10 000 fresh dids each send one statement to vault B | quarantine never exceeds 500 entries or 5 MiB; oldest evicted first; once full, statements from non-parties are dropped; known parties' statements still applied |
| TEST-PS-069-09.T31 | integration | PS-069-07.R04 | export, deletion and retention purge driven by F10 | section commerce.deals exported; DeletionPort plan pseudonymizes the principal; RetentionPurgePort purges records past RET-EVIDENCE; every field carries an F10.S02.M02 class |
| TEST-PS-069-09.T34 | integration | PS-069-07.R06 | blocked counterparty sends a claim, and an acknowledgement on a Deal with an open dispute case | first dropped silently with no signal; second stored as evidence with notification suppressed |

## Dependencies

Module depends on: F09.S03.M01, F09.S03.M03, F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-COM-001, CTR-MNY-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
