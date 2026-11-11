# PS-077-01 — Domain schema: Account and data deletion

**Status:** SPECIFIED (Stage 3). **Module:** [F10.S01.M04 Account and data deletion](SPEC.md) · **Scope:** MVP · **Code:** `packages/privacy/src/data_controls/delete` · **Contracts:** [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-077-01.R01** A DeletionRequest stores the principal did (until completion only), status, request time, grace end (14 days), deferral limit, evidence option, per-module step states, per-relay and per-counterparty delivery states and the completion summary.
- **PS-077-01.R02** The pseudonymization salt exists only inside the request until completion and is then destroyed, so the pseudonym cannot be recomputed from the did afterwards.
- **PS-077-01.R03** A deletion ledger entry is kept for 180 days after completion in the residue store, keyed by HMAC-SHA256(ledgerSalt, did) with a separate, kept ledger salt and holding no requestId, pseudonym or plain did; the completed request record in residue form is P3 and retained as RET-EVIDENCE as proof of the deletion request.
- **PS-077-01.R04** A per-origin residue store outside the erased principal vault holds only the completed DeletionRequest without did or salt, the ledger entries, outbox entries of statements already signed and still awaiting delivery (until peer_accepted, or 30 days after signing), and, when keepEvidence is true, a pseudonymized evidence-only vault retained per RET-EVIDENCE; nothing else of the principal survives on the device.
- **PS-077-01.R05** The relay deletion statement classrup.privacy.deletion_statement/v1 and the counterparty notice classrup.privacy.deletion_notice/v1 have their own schemas with explicit field allowlists and signer role principal, are registered in the F11.S01.M01 statement registry, and are separate from the vault-only entity schema classrup.privacy.deletion_request/v1.
- **PS-077-01.R06** The deletion notice has two kinds - a commitment notice per open commitment for its counterparties, and one departure notice signed once in the sign step and sealed separately to the mailbox key of every thread counterparty that the F08 DeletionPort plans list, so all thread counterparties receive the same cid; the deleted did is the envelope author and is never repeated in the payload.

## Specification

### DeletionRequest

Schema `classrup.privacy.deletion_request/v1` · storage **device** · privacy **P3** · retention **RET-EVIDENCE**

| Field | Type and constraints |
|---|---|
| id | uuidv7 — primary key |
| vaultId | uuidv7 — local vault scope (CTR-ID-001 tenant slot) |
| did? | did — principal being deleted; removed at executing -> completed |
| status | enum — pending_grace \| deferred \| executing \| failed \| completed \| cancelled |
| requestedAt | timestamp — local clock |
| graceEndsAt | timestamp — requestedAt + 14 days |
| deferredUntil? | timestamp — at most graceEndsAt + 30 days |
| keepEvidence | boolean — default true; false also purges the user's own evidence copies on this device |
| salt? | string — 256-bit random value; present only until completion, then destroyed |
| pseudonym? | string — del- plus 16 base32 characters of HMAC-SHA256(salt, did); set at execution; the retained record keeps it but never the did |
| steps | array — up to 128 {moduleId, step: sign\|revoke_keys\|pseudonymize\|shred\|purge\|destroy_keys, state: pending\|done\|failed, attempts: int ≤ 8} |
| blockers | array — open commitments {kind, ref} found at the last check, up to 50 |
| relays | array — up to 20 {relayId (canonical relayId of F15.S02.M01), statementCids: string[], syncState: prepared\|transport_acknowledged\|peer_accepted, someRetained?: boolean} |
| counterparties | array — up to 1000 {kind: commitment\|departure, commitmentRef? (commitment only), recipientDid, mailboxId, noticeCid, syncState: prepared\|transport_acknowledged\|peer_accepted} |
| statementsSignedAt? | timestamp — local clock when the sign step produced the relay statements and notices; never re-signed |
| tombstoneCount | int — ≥ 0 |
| completedAt? | timestamp — local clock |
| ledgerUntil? | timestamp — completedAt + 180 days |
| residue | boolean — true once the record lives in the residue store |
| revision | int — CTR-ID-001 ID-4 |

**Invariants**
- At most one request in pending_grace, deferred, executing or failed status per vault.
- graceEndsAt equals requestedAt plus 14 days exactly and cannot be shortened.
- salt is absent whenever status is completed or cancelled, and did is absent whenever status is completed.
- status executing is never cancelled; cancel is allowed only in pending_grace and deferred.
- No stored record or derivable key joins the did and the pseudonym after completion; ledger entries hold only ledgerKey and ledgerUntil.
- Every statement is signed in the sign step before any revoke_keys or destroy_keys step, and nothing is signed afterwards.
- All departure entries share one noticeCid, and each recipientDid appears at most once per notice kind and commitmentRef.

### Storage DDL

```sql
CREATE TABLE privacy_deletion_request (
  id TEXT PRIMARY KEY, vault_id TEXT NOT NULL, status TEXT NOT NULL, grace_ends_at TEXT NOT NULL,
  revision INTEGER NOT NULL, data TEXT NOT NULL);
CREATE UNIQUE INDEX privacy_deletion_active ON privacy_deletion_request(vault_id)
  WHERE status IN ('pending_grace','deferred','executing','failed');
-- residue store (per origin, outside the principal vault): no did, no requestId, no pseudonym in the ledger
CREATE TABLE privacy_deletion_ledger (ledger_key TEXT PRIMARY KEY, ledger_until TEXT NOT NULL);
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-077-09.T06 | contract | PS-077-01.R01, PS-077-01.R05, PS-077-04.R01, PS-077-04.R02, PS-077-09.R02 | execute request and execution; ingest relay_apply on a relay double | entity, statements, tombstones and events validate against registry schemas; deletion_statement and deletion_notice payloads contain exactly the allowlisted fields |
| TEST-PS-077-09.T07 | integration | PS-077-07.R01, PS-077-01.R04 | complete deletion with keepEvidence true then false | true keeps a pseudonymized evidence-only vault in the residue store and deletes content; false also purges own evidence copies; pseudonym stable across modules |
| TEST-PS-077-09.T10 | integration | PS-077-01.R02, PS-077-07.R02 | after completion inspect storage and UI summary | content gone, salt destroyed, did removed, pseudonym recorded, this-device-only notice, recovery-kit warning, cannot-recall notice and relay-hold notice displayed |
| TEST-PS-077-09.T11 | chaos | PS-077-01.R03 | restore an old export into this browser profile after completion and inspect the ledger | restore flow refuses the deleted principal via privacy.deletion.ledger_check unless the user overrides with a new identity; the ledger entry holds only ledgerKey and ledgerUntil |
| TEST-PS-077-09.T18 | integration | PS-077-01.R03 | clock advanced 181 days after completion | ledger entry and ledger salt purged by the RetentionPurgePort; ledger_check returns deleted false and the UI no longer warns |
| TEST-PS-077-09.T21 | integration | PS-077-01.R04, PS-077-01.R03 | inspect the residue store and every vault database after completion | only the residue request without did or salt, ledger entries keyed by HMAC, pending outbox entries and, with keepEvidence, the pseudonymized evidence vault remain; no record joins the did and the pseudonym |
| TEST-PS-077-09.T22 | e2e | PS-077-07.R02, PS-077-01.R04 | restore the pre-deletion export on a fresh device after completion | restore succeeds on that device, documenting the limit that the UI and completion summary stated |
| TEST-PS-077-09.T23 | integration | PS-077-01.R04, PS-077-06.R01 | relay offline at execution returns on day 3, a second relay returns on day 29, a third never returns | residue outbox delivers on day 3 and day 29 and both relays accept; the third entry is dropped after 30 days and the summary shows it never acknowledged |
| TEST-PS-077-09.T24 | contract | PS-077-01.R05 | deletion notice for an open cycle captured at a relay double and opened by counterparty doubles | relay sees only ciphertext, mailbox ID and size; counterparties decrypt, verify signer role principal and see exactly the allowlisted fields |
| TEST-PS-077-09.T25 | integration | PS-077-01.R06, PS-077-02.R05, PS-077-04.R02 | deletion with 40 threads and 63 thread counterparties listed by an F08.S01.M02 plan double, one open cycle and a notice addressed to a did that no plan listed | one departure notice signed once and sealed to 63 mailboxes under one cid, payload {requestId, signedAt, kind, effectiveAt, recourse}; the cycle gets a commitment notice; the unlisted recipient is refused with VALIDATION_FAILED; the account_deleted revocation lists the departure cid |

## Dependencies

Module depends on: F10.S01.M02, F10.S01.M03, F07.S01.M01, F16.S02.M02, F11.S01.M01, F15.S01.M01, F15.S02.M02, F10.S02.M02, CTR-PRV-001, CTR-FED-001, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-IOX-001, CTR-OBS-001, CTR-FLG-001. Predecessor: [module SPEC](SPEC.md).
