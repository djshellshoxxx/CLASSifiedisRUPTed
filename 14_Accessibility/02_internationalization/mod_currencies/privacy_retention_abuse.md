# PS-112-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-112-07. **Owner:** [14_Accessibility/02_internationalization/mod_currencies](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_currencies. **Consumers:** F07, F10, F15, F16 per [dependency matrix](../../../DEPENDENCY_MATRIX.md); privacy classes follow CTR-PRV-001 (owner F10, OPEN).

## Purpose and scope
Defines the data classes, retention, disclosure, and abuse controls for currencies. Business outcome: currency data never reveals a participant's home address or location, never exposes one party's valuation to another party outside the subject, and cannot be used to manipulate published rates or to enumerate subjects. Exclusions: pseudonyms provide no anonymity against network metadata, counterparties or legal process; this module does not claim otherwise. No location data is collected or stored.

## Requirements
- PS-112-07.R01: Every field in [domain_schema.md](domain_schema.md) is assigned one data class below. Actors whose data is handled: participants, subject services, operators, auditors.
- PS-112-07.R02: Abuse and fraud scenarios are enumerated in "Threats" with a control and a test for each.
- PS-112-07.R03: Rate limits and caps are concrete and enforced server-side. Clients may cache public data only; they may not cache subject-private data beyond the session (no `localStorage` for evidence).
- PS-112-07.R04: Retention periods are concrete defaults; legal-hold exceptions override deletion. Deletion requests are answered with the retention basis code, never free text.
- PS-112-07.R05: Public surfaces (catalog, active quotes, public events) never include subject references, amounts tied to a subject, or preferences.
- PS-112-07.R06: Participants can see and export their own conversions and preference through the portability bundle (import_export_backup_rollback.md).

## Data classes (provisional labels, A-currencies-10)
| Class | Records and fields | Who may read | Retention default | Federation |
|---|---|---|---|---|
| PUBLIC | currency_definition (all fields); fx_quote (all fields) | Anyone | Catalog: no deletion. Quotes: 1095 days from `captured_at`, then archived as daily aggregates per pair | Opt-in only, signed, per CTR-FED-001 (D01) |
| INTERNAL | source_id allowlist, import batch metadata, aggregate metrics | Operators | Batch metadata 400 days | Never |
| SUBJECT_PRIVATE | valuation_pin (all fields); conversion_record (all fields) | Subject parties (C-PARTY), subject service, auditor with ticket | 24 months after subject close, unless legal hold (A-currencies-08) | Never in MVP |
| USER_PRIVATE | display_preference (`display_code`, `user_ref`) | Owner only | While account is active; removed within 30 days of account deletion | Never |

Location: none. `display_code` is a currency choice that could hint at region. It is therefore excluded from any listing, search, federation or analytics payload, and is never used to infer location.

## Retention and deletion
- Account deletion removes `display_preference`. For subject-private rows, deletion of the participant's account does not delete the other party's evidence. The participant's identifiers in those rows are replaced by a tombstone ref `usr_tombstone` after the retention basis is recorded.
- Deletion requests for SUBJECT_PRIVATE rows return a retention basis code: `EVIDENCE_WINDOW`, `LEGAL_HOLD` or `DISPUTE_OPEN`.
- Quote archive keeps no subject data, so it can outlive subject evidence without privacy cost.
- Logs follow observability_performance.md: 30 days, no personal data.
- Quote retention (1095 days) exceeds the evidence window, so every conversion remains recomputable while its record exists.

## Disclosure rules
- Public events, public queries and the public catalog never include `subject_ref`, `user_ref` or any amount for a subject.
- `conversion_record` and `valuation_pin` are visible to parties only through the subject module's check. Auditors see them only with a ticket; each read is logged with the ticket reference and reason code.
- Preference reads and writes are restricted to the owner; no admin read path exists in MVP.
- Event payloads never include amounts (commands_queries_events.md).

## Abuse controls and limits
| Control | Limit | Scope | Response |
|---|---|---|---|
| Convert rate | 30 per minute per actor; 300 per hour per `subject_ref` | Server | CURRENCIES_RATE_LIMITED, `Retry-After` |
| Pin rate | 60 per minute per actor | Server | CURRENCIES_RATE_LIMITED |
| PINNED rows per subject | 16 | Server | CURRENCIES_PIN_LIMIT_EXCEEDED |
| Quote publish, per pair | 1 per 60 s | Source | CURRENCIES_RATE_LIMITED |
| Quote publish, per source | 10 per hour | Source | CURRENCIES_RATE_LIMITED |
| Outlier band | ±20% against newest ACTIVE quote | Pair | CURRENCIES_QUOTE_OUTLIER without override |
| Preference set | 10 per minute per user | User | CURRENCIES_RATE_LIMITED |
| Catalog list and quote read | 120 per minute per client address bucket | Edge | HTTP 429 at edge; no currencies error body |

## Threats and controls
| Threat | Control | Test |
|---|---|---|
| Forged or manipulated quote | Operator or allowlisted importer only; outlier guard; second approver; audit log of publisher ref | TEST-PS-112-07-T01 |
| Replayed convert request | Idempotency key; pin state checks; quote status check | TEST-PS-112-07-T02 |
| Enumeration of subjects by probing `subject_ref` | Identical 403 for unknown and unauthorized (R02 in authorization_capabilities.md) | TEST-PS-112-07-T03 |
| Metadata leakage through logs or events | Field allowlist in logs; no amounts in events; no subject refs in public feeds | TEST-PS-112-07-T04 |
| Sybil accounts influencing rates | Rates come only from operator sources; no user input to quotes; no reputation weighting | TEST-PS-112-07-T05 |
| Graph deanonymization of trades via pins | Pin and conversion rows visible to parties and ticketed auditors only; no public pin feed | TEST-PS-112-07-T03 |
| Preference correlation to locate a participant | Preference never leaves owner view, never in analytics; no location derivation | TEST-PS-112-07-T06 |
| Stale quote used offline | Server enforces `expires_at`; client shows `as_of` and expired badge | TEST-PS-112-07-T07 |
| Malicious federated peer quote | Federated quote ingestion excluded from MVP; signed envelopes only when D01 is decided | Exclusion check in TEST-PS-112-09-T10 |
| Deletion used to erase evidence | Retention basis code; legal hold overrides; tombstone replacement | TEST-PS-112-07-T08 |

## Open decisions
- A-currencies-08: Conversion and pin evidence is kept 24 months after subject close; quotes 1095 days. These are defaults until D07 decides retention classes.
- A-currencies-10: Class labels (PUBLIC, INTERNAL, SUBJECT_PRIVATE, USER_PRIVATE) are provisional until CTR-PRV-001 is approved by F10.
- Related: D05 (geoprivacy: this module stores no location and must not add any), D07 (retention), D06 (receipts are not created here).
