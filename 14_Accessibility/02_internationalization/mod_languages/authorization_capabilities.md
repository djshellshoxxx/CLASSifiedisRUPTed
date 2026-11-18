# PS-113-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-113-05. **Owner:** [14_Accessibility/02_internationalization/mod_languages](SPEC.md). **Implementing module:** 14_Accessibility/02_internationalization/mod_languages. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); specific subscribers unresolved.

## Purpose and scope
Defines who may perform which action on which resource in the languages capability, expressed against CTR-CAP-001 (capability and permission matrix, owner F16 with F07 identity). Deny by default. Each row names a capability; the decision is made by the authorization service, not by client code.

## Requirements to specify
- [x] PS-113-05.R01: Describe observable business outcome, actors and exclusions.
- [x] PS-113-05.R02: Enumerate normal, invalid, expired, duplicate, concurrent, offline and adversarial cases.
- [x] PS-113-05.R03: Specify accessibility, localization, performance and operational budgets where applicable.
- [x] PS-113-05.R04: Capability names and actor x action x resource matrix.
- [x] PS-113-05.R05: Ownership and enumeration-resistance rules for participant data.
- [x] PS-113-05.R06: Revocation and suspension behaviour.

## Business outcome and exclusions
**Outcome:** Participants change only their own language list. Operators manage the catalog. Auditors can see revision history for their assigned scope without seeing catalog drafts or other people's lists beyond what the capability allows.

**Exclusions:** moderators have no capability on this module; identity proof, account recovery and credential issuance (F07); federation trust (F11).

## Actors
| Actor | Principal source | Notes |
|---|---|---|
| anonymous | no session | reads public catalog only |
| participant | F07 session, pseudonymous | owns exactly one preference row |
| operator | F07 operator role `catalog_admin` | manages catalog; cannot read preferences |
| auditor | F07 role `audit_reader` | reads revision history with a stated purpose code |
| system_service | service credential issued by F16 | erasure job and resolver for notification rendering |

## Capabilities
| Capability | Grants |
|---|---|
| `languages.catalog.read` | read catalog; anonymous sees `active` only; operator sees all statuses including `draft` |
| `languages.catalog.write` | `create_draft`, `set_coverage` |
| `languages.catalog.status` | `transition` (activate, deprecate, reactivate, retire) |
| `languages.preference.read:self` | `preference.get` for own `participant_id` |
| `languages.preference.write:self` | `preference.set`, `preference.withdraw` for own `participant_id` |
| `languages.preference.resolve` | `preference.resolve` for own id, or for a service principal in a listed scope |
| `languages.preference.revisions.read` | `preference.revisions` for any participant, with a purpose code; audited |
| `languages.preference.erase` | erasure job only; executes erasure on F07 account-deletion event |

## Actor x action x resource matrix
Legend: Y = allowed, N = denied (`LANGUAGES_FORBIDDEN`), S = allowed only for own record (other records return `LANGUAGES_NOT_FOUND`), P = allowed with purpose code and audit event.

| Action | Resource | anonymous | participant | operator | auditor | system_service |
|---|---|---|---|---|---|---|
| list catalog (active) | language_catalog_entry | Y | Y | Y | Y | Y |
| list catalog (draft, retired) | language_catalog_entry | N | N | Y | N | N |
| create_draft, set_coverage | language_catalog_entry | N | N | Y | N | N |
| transition | language_catalog_entry | N | N | Y | N | N |
| get preference | language_preference | N | S | N | N | N |
| set / withdraw preference | language_preference | N | S | N | N | N |
| resolve preference | language_preference | N | S | N | N | Y (listed scope) |
| read revisions | language_preference_revision | N | S | N | P | N |
| erase preference | language_preference, revision | N | N | N | N | Y (erasure job only) |

Operators cannot read participant preferences even though they manage the catalog. Auditors read revisions but not the `command_id` of other actors' writes beyond what the purpose code allows.

## Ownership and enumeration rules
- `participant_id` for `set`, `withdraw`, `get` and `revisions` is taken from the session. A body field of `participant_id` must match the session or the request fails with `LANGUAGES_NOT_FOUND`.
- Responses for another participant's id are indistinguishable from a missing row (`LANGUAGES_NOT_FOUND`), to prevent enumeration.
- Catalog errors for operators and anonymous callers never reveal draft existence: anonymous requests for a draft tag return `LANGUAGES_NOT_FOUND`, not `LANGUAGES_FORBIDDEN`.
- Audit reads (auditor, purpose code) write one audit event containing `purpose_code`, `auditor_ref`, `participant_id`, `recorded_at`. The revisions returned are not logged.

## Revocation and suspension (CTR-CAP-001)
- Capability revocation takes effect for new commands within 60 seconds. In-flight commands complete under the decision made at receipt.
- Participant suspension (F07 status): writes return `LANGUAGES_FORBIDDEN`; reads of own preference and export remain allowed so the participant can leave with their data.
- Operator capability removal blocks new catalog writes immediately. It does not change existing catalog rows.
- Service credentials for the erasure job are rotated on the F16 schedule; a revoked credential cannot start erasure.

## Adversarial cases (R02)
- Participant sends another `participant_id` in body: `LANGUAGES_NOT_FOUND`.
- Operator attempts `preference.get`: `LANGUAGES_FORBIDDEN`.
- Stale session token after suspension: write refused, read allowed for own record.
- Forged capability claim in body or header: ignored; capabilities come only from F16.
- Operator writes a catalog row with a tag that already exists as retired: refused by V-14.

## Performance and accessibility (R03)
- Authorization decision adds at most 20 ms p95 per request using a cached decision with a 60-second TTL that matches revocation.
- Denied responses use the same accessible error presentation as validation errors (see [validation_rules.md](validation_rules.md)).

## Assumptions
**Assumption A-languages-12:** Participant data in this module uses CTR-PRV-001 working labels defined in [privacy_retention_abuse.md](privacy_retention_abuse.md). Capabilities depend on those labels being confirmed.

**Assumption A-languages-13:** Auditor access to revisions requires a purpose code from a fixed list maintained by F16.

## Open decisions
- Final capability names must be registered in CTR-CAP-001 (owner F16). Names above are working names.
- Whether operators with `catalog_admin` may also hold `languages.preference.resolve` for support tooling is unresolved; default is no.
- Auditor purpose code list is owned by F16; the default list is not defined here.

## Test references
Matrix tests `TEST-PS-113-05-Tnn` in [contract_and_acceptance_tests.md](contract_and_acceptance_tests.md).
