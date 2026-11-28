# PS-042-04 — Commands, queries and events: Rental handoff

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S02.M01 Rental handoff](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_lifecycle/handoff` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-042-04.R01** Vault commands draft, submit, request_changes and attest build local state; submit, request_changes and attest each produce a named signed statement and a sync outbox entry in the same vault transaction.
- **PS-042-04.R02** One ingestion command applies inbound statements, deduplicates by cid, fetches and verifies referenced photos, derives local events with actor.kind federated and quarantines failures.
- **PS-042-04.R03** Events are local (EVT-8); rentals.handoff.attested is derived in each vault only when both signatures on the same cid are held.
- **PS-042-04.R04** Every statement schema this module sends is registered in the F11.S01.M01 statement registry with its signer role, and the receiving vault acts only on statements it accepted.
- **PS-042-04.R05** A referenced photo is detected as missing only when comms.attachment.download returns NOT_FOUND during ingestion or a re-fetch; it is listed in missingPhotos[], keeps attest and request_changes refused with RENTALS_EVIDENCE_MISSING and is re-requested from the author through the thread, and comms.attachment.deleted, which F08.S01.M03 emits only in the uploader vault, is not consumed.

## Specification

### Commands

| Command | Capability | Input | Output | Errors | Emits | Idempotent |
|---|---|---|---|---|---|---|
| `rentals.handoff.draft` | rentals.handoff.edit | [vault-local; photos are stripped through F10.S02.M03 and encrypted through F08.S01.M03 comms.attachment.attach] { reservationId, checklist, readings?, photos?, notes?, expectedRevision? } | { handoffId, revision, reportRevision } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, RENTALS_HANDOFF_WINDOW, COMMS_ATTACHMENT_TOO_LARGE, RENTALS_PHOTO_METADATA |  | yes (Idempotency-Key) |
| `rentals.handoff.submit` | rentals.handoff.edit | [statement classrup.rentals.handoff_report/v1 signed by the author, E2E encrypted to the other party] { handoffId, expectedRevision } | { handoffId, revision, reportCid, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, VALIDATION_FAILED, RENTALS_HANDOFF_WINDOW, COMMS_ATTACHMENT_TOO_LARGE |  | yes (Idempotency-Key) |
| `rentals.handoff.request_changes` | rentals.handoff.attest | [statement classrup.rentals.handoff_changes_request/v1 signed by the counterparty over the report cid] { handoffId, expectedRevision, reportCid, reason } | { handoffId, revision, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_REPORT_STALE, RENTALS_CHANGE_LIMIT, RENTALS_EVIDENCE_MISSING, VALIDATION_FAILED |  | yes (Idempotency-Key) |
| `rentals.handoff.attest` | rentals.handoff.attest | [statement classrup.rentals.handoff_attestation/v1 signed by the counterparty over the exact report cid] { handoffId, expectedRevision, reportCid } | { handoffId, revision, attestationCid, state, syncState } | NOT_FOUND, CONFLICT_REVISION, CONFLICT_STATE, RENTALS_REPORT_STALE, RENTALS_HANDOFF_WINDOW, RENTALS_EVIDENCE_MISSING, RENTALS_PHOTO_METADATA | rentals.handoff.attested | yes (Idempotency-Key) |
| `rentals.handoff.receive` | rentals.handoff.receive | [vault-local ingestion of an inbound envelope per CTR-FED-001; fetches, decrypts and verifies referenced photos] { envelope, via? } | { accepted: boolean, quarantined?: boolean, code?, appliedIds[], missingPhotos[] } | RENTALS_STATEMENT_INVALID, UNSUPPORTED_SCHEMA_VERSION, RENTALS_REPORT_STALE, RENTALS_HANDOFF_WINDOW, RENTALS_PHOTO_METADATA, CONFLICT_STATE | rentals.handoff.attested | yes (Idempotency-Key) |

### Queries

| Query | Capability | Input | Output | Errors |
|---|---|---|---|---|
| `rentals.handoff.get` | rentals.handoff.read_own | [vault-local] { handoffId } | { handoff: RentalHandoff, diffFromPrevious?: ChecklistDiff, missingPhotos[] } | NOT_FOUND |
| `rentals.handoff.get_for_reservation` | rentals.handoff.read_own | [vault-local] { reservationId } | { handoff?: RentalHandoff } | NOT_FOUND |

### Events produced

| Type | Privacy | Payload |
|---|---|---|
| `rentals.handoff.attested` | P2 | { handoffId, reservationId, ownerId, renterId, reportCid, reportRevision, attestationCids[], attestedAt } |

### Events consumed

| Type | Effect |
|---|---|
| `rentals.reservation.confirmed` | create an empty handoff in drafting for the reservation with the checklistTemplate and startsAt carried in the payload |
| `rentals.reservation.cancelled` | cancel an unattested handoff and keep its drafts as history |
| `rentals.deposit.funded` | show deposit funded on the handoff screen |
| `rentals.deposit.agreed` | show deposit agreed but not yet funded warning until funded is received |
| `identity.block.added` | suppress notifications for the counterparty through filterBlocked; handoff statements for reservations confirmed before the block are still verified and stored |
| `privacy.deletion.completed` | replace the deleted party's DID in retained handoffs and statement metadata with the deletion pseudonym; signed statements and photo copies are kept so signatures and hashes still verify |

### Module errors

| Code | HTTP | Retryable | Meaning |
|---|---|---|---|
| RENTALS_HANDOFF_WINDOW | 409 | no | outside 2 hours before to 24 hours after the reservation start, or delivered more than 72 hours after the statement was signed |
| RENTALS_REPORT_STALE | 409 | no | the statement names a report cid that is not the latest report revision |
| RENTALS_CHANGE_LIMIT | 409 | no | five change rounds already used |
| RENTALS_EVIDENCE_MISSING | 409 | yes | a referenced photo is not yet held and verified in this vault; fetch or ask the author to re-send it |
| RENTALS_PHOTO_METADATA | 422 | no | a photo still carries EXIF, XMP or GPS metadata after decryption; it is quarantined and never stored, displayed or attested |

Common codes per [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md).

**Note:** Statements and signer roles registered in F11.S01.M01 (N2): classrup.rentals.handoff_report/v1 (owner or renter of the reservation; when both submit the same revision concurrently the owner's report is canonical), classrup.rentals.handoff_changes_request/v1 (the party that did not author the named report), classrup.rentals.handoff_attestation/v1 (the party that did not author the named report). Photos (N9): F08.S01.M03 attachments of at most 5 MiB, metadata stripped through F10.S02.M03 before encryption, referenced by MediaBlob id computed over the stripped plaintext, which travels only inside the encrypted statement while the relay holds only the F08.S01.M03 ciphertext and never a P2 MediaBlob; the receiving vault fetches, decrypts, SHA-256 verifies and stores each photo locally under RET-EVIDENCE, and a later message or attachment deletion does not touch copies already stored; because comms.attachment.deleted is emitted only in the uploader vault, a photo not yet held is detected as missing only when comms.attachment.download returns NOT_FOUND, then listed in missingPhotos[] and re-requested from the author. Blocks (N7): handoff statements for a reservation confirmed before a block are still verified and stored; only notifications are suppressed, through F07.S02.M02 filterBlocked, and isBlockedEither is never used to drop them.

### Example

```
owner vault: rentals.handoff.draft { "reservationId": "0192f500-0002-…", "checklist": [{ "id": "tent-body", "label": "Tent body", "condition": "ok" }],
  "photos": [{ "blobId": "blob:sha256-47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU", "attachmentId": "0192f520-00a1-…" }] }
owner: rentals.handoff.submit -> { "reportCid": "sha256-Rp…", "syncState": "prepared" }
renter vault: receives the report, fetches and verifies the photo, rentals.handoff.attest { "reportCid": "sha256-Rp…" }
  -> state attested, rentals.handoff.attested emitted in both vaults once both signatures are held
```

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-042-09.T05 | integration | PS-042-03.R03, PS-042-04.R03 | both parties sign offline at the meeting and sync later | attested when both signatures held; reservation endsAt unchanged; event emitted once per vault |
| TEST-PS-042-09.T06 | integration | PS-042-04.R01, PS-042-04.R02, PS-042-06.R01, PS-042-09.R03 | full flow with relay that duplicates, drops and reorders | both vaults converge on attested with identical cids; duplicates skipped |
| TEST-PS-042-09.T07 | contract | PS-042-04.R01, PS-042-04.R03, PS-042-04.R04 | each command, statement and event | payloads and signatures validate against registry schemas and the registered signer roles |
| TEST-PS-042-09.T15 | e2e | PS-042-01.R01, PS-042-04.R01 | mobile owner and renter complete a handoff in two browsers | both show attested with the same fingerprint; axe zero serious issues |
| TEST-PS-042-09.T18 | integration | PS-042-07.R04, PS-042-01.R02, PS-042-04.R05 | relay blob of one photo expired before the renter fetched it; author deletes the thread message after the renter stored the other photos; no comms.attachment.deleted reaches the renter vault | the download returns NOT_FOUND, the photo is listed in missingPhotos[] and re-requested, and attest is refused with RENTALS_EVIDENCE_MISSING until re-sent; stored copies stay and verify against their MediaBlob ids after the deletion |

## Dependencies

Module depends on: F05.S01.M01, F05.S01.M02, F08.S01.M01, F08.S01.M03, F15.S02.M03, F10.S02.M03, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
