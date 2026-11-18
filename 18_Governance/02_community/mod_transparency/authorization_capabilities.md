# PS-148-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-148-05. **Owner:** [18_Governance/02_community/mod_transparency](SPEC.md). **Implementing module:** 18_Governance/02_community/mod_transparency. **Consumers:** F16 security (capability registry, CTR-CAP-001 owner), F07 identity (actor and role claims), F15 platform gateway (token verification), F12 moderation and [mod_governance](../mod_governance/SPEC.md) (reviewer assignment); declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md).

## Purpose and scope
Define which actor may perform which action on which resource, and what the module checks in addition to the gateway. The matrix is the module's input to the canonical capability model in CTR-CAP-001 (owner F16 with F07 identity); this file does not redefine that model.

Exclusions: identity proofing, credential issuance and account recovery (F07); key management for subject tokens (F16, see PS-148-07.R06).

## Requirements
- PS-148-05.R01: Business outcome: only the right people can author, review, publish or read internal records, and the public can read only published, permitted content. Actors: public visitor, subject participant, author, governance reviewer, auditor, operator, scheduler.
- PS-148-05.R02: Cases: valid token with the correct capability; expired token (15 minutes maximum lifetime); revoked grant mid-session; token for another resource scope; author attempting approval; operator attempting to read internal records; replayed token; missing token on a public read.
- PS-148-05.R03: Accessibility and localization of authorization errors use message keys only (PS-148-02.R03). Authorization adds no more than 10 ms p95 to a command (PS-148-08.R05).
- PS-148-05.R04: Capabilities are named `transparency.<resource>.<action>` and are granted through CTR-CAP-001. Module capability list: `transparency.entry.author`, `transparency.entry.review`, `transparency.report.author`, `transparency.report.publish`, `transparency.redaction.manage`, `transparency.explanation.read_own`, `transparency.internal.read`, `transparency.audit.read`.
- PS-148-05.R05: Deny by default. A request with no matching capability is rejected before any state read.
- PS-148-05.R06: Revocation: a revoked grant blocks new commands within 60 seconds, the maximum capability cache TTL. Commands already in progress re-check the grant at commit time (PS-148-06.R07).
- PS-148-05.R07: Separation of duties: author, reviewer and approver are different actors for every publication (PS-148-03.R06). Operators hold `transparency.redaction.manage` but not review or publish capabilities.
- PS-148-05.R08: Enumeration resistance: a caller without read access to a resource gets TRANSPARENCY_NOT_FOUND, not NOT_AUTHORIZED. TRANSPARENCY_NOT_AUTHORIZED is returned only for write actions by callers who can see the resource.

## Actor definitions
| Actor | How established | Notes |
|---|---|---|
| public | no token | reads PUBLIC_* PUBLISHED content only |
| subject participant | token with `transparency.explanation.read_own` and matching subject_token | sees own participant_explanation only |
| author | token with `transparency.entry.author` or `transparency.report.author` | cannot approve own work |
| governance reviewer | token with `transparency.entry.review` and role GOVERNANCE_REVIEWER | approver for entries and reports |
| auditor | token with `transparency.audit.read` | read-only, internal views |
| operator | token with `transparency.redaction.manage` | manages redaction profiles; no content authorship |
| scheduler | system credential, scope limited to timer jobs | can only apply REVIEW timeout and purge |

## Entry matrix (actor x action x resource: decision_entry)
Codes: Y allowed, N denied (NOT_FOUND where the resource is invisible), C conditional (see note).

| Actor | create | edit | submit | approve | reject | withdraw | read public | read explanation | read internal |
|---|---|---|---|---|---|---|---|---|---|
| public | N | N | N | N | N | N | C (PUBLISHED, PUBLIC_*) | N | N |
| subject participant | N | N | N | N | N | N | C (as public) | C (own, PARTICIPANT_ONLY or subject-bearing) | N |
| author | Y | C (own, PREPARING) | C (own) | N | N | N | C (as public) | N | C (own) |
| governance reviewer | N | N | N | C (not own) | Y | C (not own) | Y | N | Y |
| auditor | N | N | N | N | N | N | Y | N | Y (read only) |
| operator | N | N | N | N | N | N | N | N | N |
| scheduler | N | N | N | N | C (timeout only) | N | N | N | N |

Notes: "C (own)" means the caller is the author_actor_ref. "C (not own)" means the caller differs from author_actor_ref. Operators have no entry access because redaction profiles are not content.

## Report matrix (actor x action x resource: transparency_report)
| Actor | create | freeze | unfreeze | publish | withdraw | read public | read internal |
|---|---|---|---|---|---|---|---|
| public | N | N | N | N | N | C (PUBLISHED or SUPERSEDED) | N |
| author | Y | Y (own) | Y (own) | N | N | C (as public) | Y (own) |
| governance reviewer | N | N | N | C (not author) | Y | Y | Y |
| auditor | N | N | N | N | N | Y | Y (read only) |
| operator | N | N | N | N | N | N | N |

## Redaction profile matrix
| Actor | create | activate or deactivate | read |
|---|---|---|---|
| operator | Y | Y (with second reviewer for profiles with PUBLIC_REDACTED use) | Y |
| governance reviewer | N | N | Y |
| others | N | N | N |

## Capability token rules (CTR-CAP-001 inputs)
- Claims: actor_ref (ULID), capability name, resource scope (entry, report or profile ID or `*` for list reads), issued_at, expires_at (at most 15 minutes after issue), jti.
- Tokens are verified by the gateway (F15) and again by the module for the specific resource (defence in depth).
- Role changes and grant revocations are read from the capability registry with a cache of at most 60 seconds.

## Open decisions
- A-TRANSPARENCY-05: Four-eyes publication is required for all decision and report publication in version 1; there is no self-approval path, including for operators.
- Assumption A-TRANSPARENCY-04 (subject token keys) is governed by F16 and is referenced in PS-148-07.R06; the module does not hold the key.
