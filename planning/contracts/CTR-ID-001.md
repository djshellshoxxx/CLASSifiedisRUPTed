# CTR-ID-001 — Identifiers

**Status:** SPEC-DRAFT-COMPLETE (pending approval). **Owner:** F15 Platform (named owner UNASSIGNED; see SECURITY_SENSITIVE_SURFACES_AUDIT_2026-11-15_PASS3.md S3-11). **Parent:** planning/CONTRACTS.md. **Consumers:** CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-FED-001.

**Decision label:** ULID body format is PROVISIONAL (ULID default, unapproved). UUIDv4 is the listed alternative. CONTRACTS.md marks the choice OPEN.

## Scope

Entity identifiers for every persisted or transmitted aggregate. External identifiers (chain transaction hashes, chain addresses, peer-supplied key material) are not entity IDs. They are typed external references defined in CTR-COM-001 and CTR-FED-001.

## Requirements

| ID | Requirement (measurable) | Priority |
|---|---|---|
| CTR-ID-001.R01 | Entity ID = `<prefix>_<body>`. Prefix: 3 lowercase letters from the registry below. Body: 26 characters of Crockford base32 (`0123456789ABCDEFGHJKMNPQRSTVWXYZ`; excludes I, L, O, U). Total length 30. | MVP |
| CTR-ID-001.R02 | Two body classes. `ulid`: 48-bit millisecond timestamp + 80-bit CSPRNG randomness (default). `opaque`: 128-bit CSPRNG, no timestamp bits, for objects whose creation time is sensitive. Class is fixed per prefix in the registry. | MVP |
| CTR-ID-001.R03 | Canonical form: lowercase prefix, uppercase body. Parsers accept lowercase body input and normalize to uppercase before any comparison. Any other character is rejected. | MVP |
| CTR-ID-001.R04 | ULID first body character must be `0`–`7` (128-bit range). Larger first character is rejected. | MVP |
| CTR-ID-001.R05 | Externally visible `ulid` IDs use non-monotonic generation: every ID draws fresh CSPRNG randomness. Monotonic ULID mode (incrementing randomness within one millisecond) is forbidden for externally visible IDs. | MVP |
| CTR-ID-001.R06 | Sequential integers, database auto-increment keys and row offsets are never exposed as entity IDs. Ordering uses `revision` (CTR-EVT-001) or a sequence field named in the owning contract. | MVP |
| CTR-ID-001.R07 | IDs are identifiers, not secrets or capabilities. No authorization decision may depend on ID unguessability (CTR-CAP-001). | MVP |
| CTR-ID-001.R08 | Global uniqueness without coordination: prefix plus 80- or 128-bit randomness. Cross-node references use `(origin_node, event_id)` (CTR-FED-001). No cross-node ordering is implied. | MVP |
| CTR-ID-001.R09 | Entity ID length is exactly 30 characters. Any other length → `ID.MALFORMED`. | MVP |
| CTR-ID-001.R10 | Human-facing short codes (display, support references) are presentation only. They are never accepted for lookup and never used for authorization. | MVP |

**Prefix registry** (immutable once published; one owner each):

| Prefix | Aggregate | Class | Owner |
|---|---|---|---|
| acc | account (pseudonym holder) | ulid | F07 |
| prf | pseudonymous profile view | ulid | F07 |
| ses | session | opaque | F07 |
| dev | device or credential enrollment | opaque | F07 |
| rec | account recovery request | opaque | F07 |
| key | key record (public metadata only) | ulid | F16 |
| sys | system or service principal | ulid | F16 |
| ope | operator principal | ulid | F16 |
| mod | moderator principal | ulid | F12 |
| grt | capability grant | ulid | F16 |
| dec | authorization decision record | ulid | F16 |
| aud | audit record | ulid | F16 |
| evt | event | ulid | F15 |
| nod | federation node | ulid | F11 |
| fpr | federation peer | ulid | F11 |
| dlv | federation delivery batch | ulid | F11 |
| lst | listing | ulid | F01 |
| cyc | barter cycle proposal | ulid | F02 |
| par | cycle participant slot | ulid | F02 |
| srv | service listing | ulid | F03 |
| auc | auction | ulid | F04 |
| bid | bid | opaque | F04 |
| rnt | rental | ulid | F05 |
| thr | message thread | opaque | F08 |
| msg | message | opaque | F08 |
| att | attachment | opaque | F08 |
| trx | exchange or transaction | ulid | F09 |
| clm | payment or settlement claim | ulid | F09 |
| qte | pinned currency quote | ulid | F09 |
| evd | evidence item | ulid | F09 |
| dsp | dispute | ulid | F09 |
| rpt | report | opaque | F12 |
| cas | moderation case | ulid | F12 |
| ntf | notification | opaque | F13 |

## Data / schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:classrupt:contract:CTR-ID-001:entity-id:1.0.0",
  "type": "string",
  "minLength": 30,
  "maxLength": 30,
  "pattern": "^[a-z]{3}_[0-9A-HJKMNP-TV-Z]{26}$"
}
```

The pattern applies after R03 normalization. Each consumer schema must also check that the prefix belongs to the registry entry for its `aggregate_type` (rule `ID.PREFIX_MISMATCH`).

## Commands / queries / events

Not applicable. This contract defines values only. Registry changes are governed by the versioning rules below.

## Versioning and compatibility

- Add a prefix: MINOR. Old consumers reject unknown prefixes with `ID.UNKNOWN_PREFIX`. Federated events with unknown prefixes are rejected per CTR-FED-001.
- Change the alphabet, body length, class of an existing prefix, or the meaning of a prefix: forbidden in place. Requires a new contract (CTR-ID-002) with a migration plan.
- Retired prefixes are never reused.

## Examples

Valid:

```json
{"aggregate_type": "listing", "aggregate_id": "lst_01HZX3K9Q7M2V8T4W6Y0B5N1CD"}
```

Invalid (body has 4 characters and reads as a sequential integer; violates R01, R06, R09):

```json
{"aggregate_type": "listing", "aggregate_id": "lst_1042"}
```

## Validation and errors

| Code | Retryable | Category / HTTP | When |
|---|---|---|---|
| ID.MALFORMED | false | validation / 400 | Violates R01, R03, R04 or R09. |
| ID.UNKNOWN_PREFIX | false | validation / 400 | Prefix absent from registry. |
| ID.PREFIX_MISMATCH | false | validation / 400 | Prefix does not match `aggregate_type`. |

Diagnostics contain the field path only. The input value is never echoed (prevents ID probing through error text).

## Authorization

Not applicable to the format itself. Object access rules are in CTR-CAP-001.

## Failure, idempotency, concurrency, offline

ID generation is local and needs no coordination. Offline clients may generate IDs for pending writes (D08). The server accepts a client-generated ID only if its prefix and class match the target aggregate and the ID does not already exist for another actor (duplicate → `ID.MALFORMED` with diagnostic `duplicate`, no existence leak). ASSUMPTION: clients generate `ulid` IDs with the device clock; clock skew does not affect uniqueness.

## Privacy, retention, abuse

- ASSUMPTION: a `ulid` body reveals creation time to the millisecond. This is acceptable for objects already publicly timestamped (listings, cycle proposals, auctions). Private-timing objects (sessions, messages, attachments, bids, reports, recovery requests, notifications) use the `opaque` class.
- IDs are not personal data by themselves. Linkage risk is handled in CTR-PRV-001.
- Enumeration: the API returns the same response for a nonexistent ID and for an ID the actor cannot read (`SYS.NOT_FOUND`, see CTR-ERR-001).

## Observability and budgets

- Metric: `id_validation_rejections_total` by code. Alert on sustained spikes (enumeration signal, BT-01).
- Logs contain prefix and class only when debugging. Full IDs of `ses`, `rec` and `dev` are never logged in clear (CTR-PRV-001 SECRET rules apply to session linkage).
- Budget: parse and validate ≤ 0.05 ms p95 per ID (ASSUMPTION).

## Tests

- TEST-CTR-ID-001-01 (unit): pattern accepts canonical IDs; rejects `I`, `L`, `O`, `U`; rejects lengths 29 and 31; rejects first body character `8`–`Z`.
- TEST-CTR-ID-001-02 (unit): lowercase body normalizes to uppercase; uppercase prefix is rejected.
- TEST-CTR-ID-001-03 (property): 1,000,000 generated `ulid` IDs contain zero duplicates; within each millisecond bucket, ascending consecutive pairs are 45%–55% (non-monotonic, R05).
- TEST-CTR-ID-001-04 (property): 10,000 `opaque` IDs; bits 0–47 show no rank correlation with generation time (|Spearman rho| < 0.05).
- TEST-CTR-ID-001-05 (lint): registry check. Unique prefixes, `[a-z]{3}`, one owner, class set, no reuse of retired prefixes.
- TEST-CTR-ID-001-06 (integration): API rejects an `aggregate_id` whose prefix differs from `aggregate_type` with `ID.PREFIX_MISMATCH`.
- TEST-CTR-ID-001-07 (negative integration): IDs adjacent to a readable object return a response body identical to a nonexistent ID (R07, enumeration).
- TEST-CTR-ID-001-08 (schema lint): no entity ID is typed as integer in any API or event schema.

## Acceptance criteria

1. Registry lists every prefix with aggregate, class and owner; lint TEST-05 passes.
2. Every consumer contract references only the CTR-ID-001 entity-id schema.
3. TEST-CTR-ID-001-01 through -08 pass in CI.
4. No sequential or database key is exposed in any API or event schema.

## Assumptions & open decisions

- OPEN: ULID vs UUIDv4 (CONTRACTS.md). PROVISIONAL: ULID (unapproved).
- ASSUMPTION: 80-bit randomness is sufficient for global uniqueness at expected scale; collision analysis to be recorded with the F15 review.
- ASSUMPTION: account ID re-issuance during portability/migration is governed by D10 (OPEN); this format does not change that.
- Related: R01 (home-address and linkage risk) in RISK_REGISTER.md; CTR-PRV-001 linkage rules.
