# PS-129-02 — Validation rules: Key registry and revocation

**Status:** SPECIFIED (Stage 3). **Module:** [F16.S02.M02 Key registry and revocation](SPEC.md) · **Scope:** MVP · **Code:** `packages/security/src/cryptography/management` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-129-02.R01** Revocation statements, list heads and relay-owned key registrations are validated for schema, signatures, signer authority and limits before storage, and user device keys are accepted only as F07.S02.M01 reports them.
- **PS-129-02.R02** Revocation effective times are clamped so that a signer cannot reach back more than 30 days before the earliest evidence of the statement, and a revocation is never dropped because it arrives late.
- **PS-129-02.R03** Every violation maps to one stable error code.

## Specification

| Rule | Check | Error |
|---|---|---|
| V01 | a statement matches classrup.security.keyrevocation/v1, a list head matches classrup/revocation-list/v1, and every public key is a valid point of the declared algorithm | VALIDATION_FAILED |
| V02 | a user device key enters only through a root-signed classrup.identity.device_link/v1 listed in the owner's root-signed portable identity document as F07.S02.M01 reports it; a relay_owned key only through security.keyrecord.register by a relay_operator or admin of this relay; a peer_relay key only as pinned by F11.S03.M01; an agreement key never | SECURITY_KEY_UNAUTHORIZED |
| V03 | keyrevocation signer, as in F07.S01.M01 V11 - the revoked key itself or the account root key (the recovery-key role, held on the root device or decrypted from the F07.S01.M03 recovery kit) take effect at once; another active device key of the same principal starts revocation_pending for 7 days unless the root key confirms; two device keys revoking each other become contested; reason recovery takes effect 72 hours after this store first saw the matching recovery notice; a revoked, pending or contested key cannot revoke; relay_owned keys are revoked only by the relay key | SECURITY_KEY_UNAUTHORIZED |
| V04 | revocationEffectiveFrom is at most 10 minutes after this store's receipt time; an earlier claim is clamped to no earlier than earliestEvidenceAt (verified relay receipt, else first receipt; never the signedAt claim) minus 30 days and labelled, and the revocation is recorded whatever its age | VALIDATION_FAILED |
| V05 | at most 10 active device keys per principal (the F07.S02.M01 document cap) and at most 20 active relay_owned keys per relay | SECURITY_KEY_LIMIT |
| V06 | a key whose hash is in the revoked-key set is never registered, cached as active or reactivated | CONFLICT_STATE |
| V07 | expectedRevision matches the stored KeyRecord revision | CONFLICT_REVISION |
| V08 | a revocation list head is signed by the publishing relay's current key under classrup/revocation-list/v1, its listSeq is greater than and its issuedAt not earlier than the stored head for that relay, and nextUpdateBy is at most 24 hours after issuedAt; a regression is recorded as a replay and never refreshes freshness | SECURITY_REVOCATION_LIST_STALE |
| V09 | finalCids appear only with reason account_deleted and hold at most 120 distinct cids in the CTR-ID-001 ID-3 form | VALIDATION_FAILED |

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-129-09.T02 | unit | PS-129-02.R01, PS-129-02.R03 | each rule V01–V09 violated | documented error code and nothing stored |
| TEST-PS-129-09.T09 | abuse | PS-129-07.R03, PS-129-02.R01 | 11th active device key in a document; 21st relay-owned key; 51st revocation from one source in a day; oversized statement; X25519 agreement key presented by a relay for a device | SECURITY_KEY_LIMIT; SECURITY_KEY_LIMIT; RATE_LIMITED; PAYLOAD_TOO_LARGE; SECURITY_KEY_UNAUTHORIZED with nothing stored |
| TEST-PS-129-09.T11 | integration | PS-129-02.R02 | revocation first received 45 days after issuance with a relay receipt at issuance; a revocation claiming effectiveFrom 60 days before its relay receipt; a statement by the revoked key first seen after the effective time | recorded revoked, never dropped; second effectiveFrom clamped to receipt minus 30 days and labelled; the later statement is refused |
| TEST-PS-129-09.T12 | abuse | PS-129-07.R03, PS-129-02.R03 | relay X replays an older signed list head with lower listSeq; high-stakes get_status with only relay X confirming | SECURITY_REVOCATION_LIST_STALE recorded, freshness stays at the stored head; freshnessClass stale until relay Y confirms |
| TEST-PS-129-09.T20 | unit | PS-129-01.R06, PS-129-02.R01 | account_deleted revocation with 121 cids; finalCids on a revocation with reason lost; a valid one with 120 cids serialized as a CTR-FED-001 envelope | VALIDATION_FAILED twice; the 120-cid statement verifies and stays under the 8 KiB relay statement limit |
| TEST-PS-129-09.T23 | unit | PS-129-02.R01, PS-129-03.R02 | revocation signed by the root key decrypted from a recovery kit; by another active device key, then confirmed by the root key; by the revoked key itself; two device keys revoking each other | immediate; pending until the root confirmation, then revoked; immediate; both contested until a root-key decision |

## Dependencies

Module depends on: F16.S01.M01, F16.S02.M03, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-CAP-001, CTR-OBS-001. Predecessor: [domain_schema.md](domain_schema.md).
