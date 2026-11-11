# PS-058-05 — Authorization and capabilities: Reputation

**Status:** SPECIFIED (Stage 3). **Module:** [F07.S03.M01 Reputation](SPEC.md) · **Scope:** MVP · **Code:** `packages/identity/src/trust/reputation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-OBS-001](../../../planning/contracts/CTR-OBS-001.md), [CTR-IOX-001](../../../planning/contracts/CTR-IOX-001.md), [CTR-FLG-001](../../../planning/contracts/CTR-FLG-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-058-05.R01** Vault policy - only the unlocked principal posts, withdraws or hides; reviews and tickets are accepted from others only on verified signatures by active device keys and on the subject's ticket, and authority comes from the signed bilateral evidence, not from the sender or relay.
- **PS-058-05.R02** Reviews are readable to anyone who holds the statement; public reviews are P1 community data shared through relays the author chose, and subject-only reviews are end-to-end encrypted to the subject.
- **PS-058-05.R03** Relays may stop serving a review copy under their hosting policy, which a vault may record only as provenance; they cannot create, edit, hide, withdraw or delete the author's statement in any vault.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| identity.review.post | principal | unlocked principal; open ReviewWindow containing the pair; not blockedWith subject; public audience needs the subject's ticket |
| identity.review.receive | principal | signature by an active author key and the subject's ticket verify; author not blocked (otherwise dropped silently) |
| identity.review_ticket.receive | principal | ticket signed by an active key of a party of a pending or open window naming the principal as holder |
| identity.review.withdraw | principal | unlocked principal and review.authorDid equals the principal DID |
| identity.review.hide_local | principal | unlocked local principal |
| identity.reputation_summary.read | principal | unlocked local principal |
| identity.review.read | principal | unlocked local principal; hidden reviews only with explicit request |
| identity.review_window.read_own | principal | unlocked local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-058-09.T09 | abuse | PS-058-05.R01, PS-058-05.R03 | locked vault posts; non-author withdraws; relay edits a stored review | FORBIDDEN; NOT_FOUND or FORBIDDEN; edit breaks the signature and is rejected |
| TEST-PS-058-09.T11 | abuse | PS-058-02.R03, PS-058-05.R02, PS-058-07.R01 | 31 reviews in 24 hours by one author; 201 received per hour from one source; a subject_only review read without the subject key; a comment containing a phone number | RATE_LIMITED for the 31st and excess quarantined; the subject_only review is unreadable; the composer warns about the contact data before signing |
| TEST-PS-058-09.T17 | integration | PS-058-03.R02, PS-058-05.R03 | relay R1 stops serving a review copy and answers with a signed not-served statement | vault review stays posted, notServedBy records R1, sourceCount drops by one, the review is never excluded |

## Dependencies

Module depends on: F07.S01.M01, F07.S02.M01, F07.S02.M02, F11.S01.M01, F11.S01.M02, F09.S01.M01, F09.S02.M02, F10.S01.M01, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-FED-001, CTR-SCH-001, CTR-PRV-001, CTR-COM-001, CTR-OBS-001, CTR-IOX-001, CTR-FLG-001. Predecessor: [domain_schema.md](domain_schema.md).
