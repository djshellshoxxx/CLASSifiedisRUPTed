# PS-071-05 — authorization and capabilities

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 09_Commerce/02_settlement/mod_receipts (Commerce Lead). **Parent:** [SPEC](SPEC.md). **Canonical contracts:** CTR-CAP-001 (R01–R08), CTR-COM-001 (Authorization), CTR-PRV-001 (R07). **Decisions:** D06 (PROVISIONAL, unapproved).

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-071-05.R01 | Only the claimant may upload evidence before attestation. | MVP |
| PS-071-05.R02 | After `COUNTERPARTY_ATTESTED`, the counterparty may read evidence content; before that, only the uploader. | MVP |
| PS-071-05.R03 | Moderators read evidence only under a `case:` grant with purpose `dispute`. | MVP |
| PS-071-05.R04 | Operators have no default evidence access (CTR-PRV-001 R07). | MVP |
| PS-071-05.R05 | Redaction may be requested by the uploader before attestation; after attestation only by a case decision. | MVP |

## Data / schema
Capability IDs: `evd.create`, `evd.read`, `evd.redact`, `receipt.export`, `clm.attest`.

## Commands / queries / events
| Command | Action | Actor |
|---|---|---|
| `evd.upload` | `evd.create` | claimant |
| `evd.redact` | `evd.update` / `evd.delete` | uploader (pre-attest), case (post-attest) |
| `receipt.export` | `evd.export` | either party |
| `receipt.get` | `evd.read` | parties per R02 |

## States & transitions
Visibility changes at attestation (PS-071-03 transition).

## Validation & errors
Non-party: `SYS.NOT_FOUND`. Counterparty before attestation: `SYS.NOT_FOUND` for content (metadata only is shown as "evidence pending").

## Authorization
Field visibility: counterparty sees evidence digest and kind before attestation; content after attestation.

## Failure, idempotency, concurrency, offline
Grant checks per request.

## Privacy, retention, abuse
Reads of evidence by moderators emit `aud_` records with resource ID and purpose.

## Observability & budgets
Count of evidence reads per case; alert above 50 per case (ASSUMPTION).

## Tests
- TEST-PS-071-05-01 (unit): visibility matrix before and after attestation.
- TEST-PS-071-05-02 (negative): counterparty cannot read content before attestation.
- TEST-PS-071-05-03 (negative): operator read without grant returns `SYS.FORBIDDEN`.
- TEST-PS-071-05-04 (integration): moderator read emits `aud_`.

## Acceptance criteria
1. Matrix implemented exactly.
2. No content leak before attestation.
3. Every moderator read is audited.

## Assumptions & open decisions
- ASSUMPTION: evidence read alert threshold 50 per case.
- D06 (PROVISIONAL default, unapproved).
