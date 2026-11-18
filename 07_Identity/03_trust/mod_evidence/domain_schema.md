# PS-057-01 — domain schema

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** 07_Identity/03_trust/mod_evidence. **Parent:** [SPEC.md](SPEC.md). **Canonical contracts:** CTR-ID-001 (`prf`, `acc`; `evd` is owned by F09 and is NOT used here, see below), CTR-PRV-001 (RET-EVD, PRIVATE_PERSONAL), CTR-SCH-001, CTR-COM-001 (R14 attestation pattern, reused by reference only), CTR-CAP-001.

**Duplicate slug.** `mod_evidence` also exists at 12_Moderation/01_reporting/mod_evidence (PS-093). This module covers trust evidence about a pseudonym only. Moderation evidence is a different record class.

**Canonical owner ID for the record class.** The CTR-ID-001 prefix `evd` (evidence item) is owned by F09 for payment and settlement evidence. Trust evidence in this module has no registry prefix yet: PENDING CTR-ID-001 entry (candidate prefix `tev`, owner F07). Consumers reference trust evidence by full ID only.

## Requirements
| ID | Requirement (measurable) | Priority |
|---|---|---|
| PS-057-01.R01 | Each evidence record names one subject `prf_` and one `kind` from the closed enum below. | MVP |
| PS-057-01.R02 | Stored content is a digest (SHA-256) and metadata only. No identity document images, no free-text narratives over 500 code points. | MVP |
| PS-057-01.R03 | Each record stores `provenance`: issuer type, issuer reference (`prf_`, `acc_` for owner-issued only, or verifier ID), issued_at, signature reference if signed. | MVP |
| PS-057-01.R04 | Records are append-only; correction is supersession by a new record with `supersedes` link. | MVP |
| PS-057-01.R05 | Schema `trust.evidence` 1.0.0 registered; signed records are never migrated lossily (CTR-SCH-001 R08). | MVP |
| PS-057-01.R06 | Verified government-ID checks as stored evidence. | Future (D06 separates external verification; not in MVP) |

## Data / schema
| Field | Type | Constraint | Class |
|---|---|---|---|
| `evidence_id` | string(30) | prefix `tev` once assigned (PENDING); opaque class | PSEUDONYMOUS |
| `subject_prf_id` | string(30) | prefix `prf`, FK | PSEUDONYMOUS |
| `kind` | enum, closed | `self_attested`, `counterparty_signed`, `verifier_result`, `system_observed` | PSEUDONYMOUS |
| `content_digest` | string(64) | lowercase hex SHA-256 of canonical body | PSEUDONYMOUS |
| `issuer_ref` | string | `prf_`, `acc_` (owner-issued only), or `ver_` verifier ID | PSEUDONYMOUS |
| `signature` | object | `alg` = Ed25519 (ASSUMPTION), `key_ref`, `sig` base64url | PSEUDONYMOUS |
| `supersedes` | string(30) or null | same subject, same kind | PSEUDONYMOUS |
| `withdrawn_at` | timestamp or null | set once | PSEUDONYMOUS |
| `issued_at`, `recorded_at` | timestamp | RFC 3339 UTC, ms | PSEUDONYMOUS |
| `revision` | int | ≥ 1 per aggregate | internal |

## Commands / queries / events
Schema reference; see [commands_queries_events.md](commands_queries_events.md).

## States & transitions
Lifecycle in [workflow_state_machine.md](workflow_state_machine.md): `recorded` → `superseded` or `withdrawn`.

## Validation & errors
See [validation_rules.md](validation_rules.md).

## Authorization
Field visibility in PS-057-05.

## Failure, idempotency, concurrency, offline
Append-only writes with idempotency key; see PS-057-06.

## Privacy, retention, abuse
Class PSEUDONYMOUS. Retention RET-EVD (24 months after final state, ASSUMPTION; personal fields redacted at 12 months, hashes retained). See PS-057-07.

## Observability & budgets
Counts by kind and state only.

## Tests
- TEST-PS-057-01-01 (unit): every `kind` value accepted; unknown rejected.
- TEST-PS-057-01-02 (property): supersession chains never cycle.
- TEST-PS-057-01-03 (contract): schema digest registered; signed record round-trips byte-identical.
- TEST-PS-057-01-04 (negative): content over 500 code points or image MIME type rejected.

## Acceptance criteria
1. No stored field holds personal document content (schema lint).
2. Append-only: no update path changes content, digest or signature.
3. Every record has a subject and provenance.
4. Canonical owner ID decision recorded as PENDING with candidate prefix.

## Assumptions & open decisions
- PENDING CTR-ID-001: `tev` prefix and owner F07 for trust evidence.
- ASSUMPTION: Ed25519 signatures; library choice to be recorded from audited options (research record pending).
- PROVISIONAL (D06 default, unapproved): signed statements only; external verification separate.
- PROVISIONAL (D07 default, unapproved): RET-EVD retention.
