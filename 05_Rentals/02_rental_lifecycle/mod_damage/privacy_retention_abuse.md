# PS-041-07 — privacy retention abuse

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-041-07. **Owner:** [05_Rentals/02_rental_lifecycle/mod_damage](SPEC.md). **Implementing module:** 05_Rentals/02_rental_lifecycle/mod_damage. **Consumers:** declared via [dependency matrix](../../../DEPENDENCY_MATRIX.md); named in the Dependencies section of this file.

## Purpose and scope
Defines what personal and sensitive data the module holds, where it lives, how long it is kept, who may see it, and how abuse is limited. Pseudonymous participant IDs are the only identity in this module. No guarantee of anonymity is made against network metadata, counterparties or legal process (PROJECT_SPEC trust boundaries).

Exclusions: identity records (F07), moderation case records (F12), payment evidence (F09), and location precision (F10 geoprivacy; this module stores none).

## Requirements
- **PS-041-07.R01** Minimization. The module stores no home address, no precise location, no contact details and no device identifiers. Image metadata with GPS coordinates or device serials is removed before storage (V18).
- **PS-041-07.R02** Abuse cases. The module must handle: repeated claims against one renter, inflated amounts, forged or re-used evidence, probing for claim existence, scripted command floods, and blocked participants attempting writes. Controls are listed below.
- **PS-041-07.R03** Disclosure. Party-visible data is limited to the claim, its evidence metadata and its timeline. Moderators see the case data they are assigned. No claim data is included in federated payloads or public listings.

## Data classes
**Assumption A-damage-18:** Local classes are used until CTR-PRV-001 publishes location, retention and disclosure classes (owner F10). Mapping is one-to-one when published.

| Class | Data | Location | Disclosure | Retention |
|---|---|---|---|---|
| P-DMG-1 restricted | Evidence media (held in shared evidence storage), note_text, caption_text | Evidence store only; never in events | Parties to the claim; assigned moderator | 12 months after terminal (A-damage-19) |
| P-DMG-2 participant-private | damage_claim fields, damage_response, damage_attestation, damage_event, description_text, comment_text | Relay/backend store in the primary region set by F15 | Parties; assigned moderator; F10 export for the subject | 24 months after terminal (A-damage-19) |
| P-DMG-3 party-visible summary | state, category, claimed and agreed amounts, dates | Same as P-DMG-2 | Both parties; moderator; not public | Same as P-DMG-2 |

Rules:
- Events carry identifiers, states, amounts and enums only (A-damage-13). Free text is never copied into events, logs or metrics.
- Coordinates are never stored. Approximate item location is held by the rental catalog, not here.
- Evidence media is not part of any federated envelope (CTR-FED-001 is not used).

## Retention and deletion
- **Assumption A-damage-19:** Claim, response, attestation and event rows are kept 24 months after the claim reaches a terminal state. Evidence media is kept 12 months after terminal. Legal hold overrides both. D07 (retention) is OPEN.
- Moderation holds do not extend retention. They pause timers only.
- While non-terminal, no deletion is performed on a claim. A deletion request from a participant is queued until terminal state, then executed at the retention boundary.
- On deletion, free text and media are removed. Remaining rows keep the participant ID as a tokenized reference so the counterparty's record stays consistent.
- Deletion uses a purge job that writes a tombstone event (`DamageRecordPurged`, identifiers only). Event sequence is preserved.

## Access control
- Authorization matrix is in authorization_capabilities.md. Non-parties receive DAMAGE_CLAIM_NOT_FOUND.
- Evidence media access uses short-lived signed references issued per request. Reference lifetime at most 5 minutes.
- Moderators access evidence only through a case reference (`moderation_case_ref`) that F12 has opened.

## Abuse controls
**Assumption A-damage-20:** Rate limits per actor: open_claim 5 per lender per 24 hours; attach_evidence 20 per participant per hour; respond 30 per participant per hour. Exceeding a limit returns DAMAGE_RATE_LIMITED with `Retry-After`.

| Abuse case | Control |
|---|---|
| Repeated claims against one renter | More than 3 claims against the same renter in 30 days raises a flag to F12. Claims are not blocked automatically. |
| Inflated amounts | Cap of 100000000 minor units (A-damage-04). Renter counter and attestation are required before any agreed value. |
| Forged or re-used evidence | Digest verification (V17). Digests prove byte integrity, not truth. Duplicate digests across claims are flagged to F12. Treated as self-attested evidence. |
| Probing claim existence | Non-party reads return DAMAGE_CLAIM_NOT_FOUND. Identical error for missing claims. |
| Command floods | Rate limits; idempotency; no client timestamps accepted. |
| Blocked participant writes | DAMAGE_PARTICIPANT_BLOCKED on all writes. |
| Abusive description text | Description is visible only to parties and the moderator. Flagging goes to F12. The module does not auto-remove text. |
| Silence used to force outcomes | No implied acceptance; expiry is EXPIRED (PS-041-03). |

## Accessibility and privacy notices
- Notices that a claim was opened or changed are delivered through F13 and carry no free text.
- Evidence captions are optional and user-authored; they are not used for automated decisions.

## Open decisions
- **Assumption A-damage-18:** Local data classes pending CTR-PRV-001.
- **Assumption A-damage-19:** Retention periods; D07 OPEN.
- **Assumption A-damage-20:** Rate limit values.
- The 3-claims-in-30-days flag threshold is a default for F12 review.
- D07 (retention) and D10 (auth and portability) remain OPEN.
