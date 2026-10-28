# PS-103-05 — local capability checks

**Status:** SPECIFIED — REVIEW PENDING. **Requirement family:** PS-103-05 (R01–R03). **Owner:** [module](SPEC.md). **Implementation:** none.

## PS-103-05.R01 — principal and trust boundary

A notice belongs to one local principal in one F15 vault. F07 establishes the active principal through explicit unlock; a pseudonym is only a local display label. F16 is the authority for default-deny local capabilities. No global member, admin, moderator, sender account, device identity service, or Sybil resistance is assumed. Imported peer objects have read/projection permissions only and cannot write this inbox.

## PS-103-05.R02 — operation capabilities

The future F16 local policy must authorize scoped operations equivalent to `notice.inbox.read`, `notice.read_state.write`, and `notice.delete`. `consumeLocalEvent` is service-internal and may write only when F15 marks the source event committed for the same active vault/principal. `clearReadNotices` requires the same delete scope and an explicit UI confirmation. This specification names consumer scopes only; F16 owns capability issuance, revocation, persistence and protocol review.

Check vault/principal binding and capability again inside the write transaction. Do not rely on a hidden UI control, cached boolean, JavaScript mutex, caller-provided owner ID, banner token, or stale capability snapshot. A principal switch or lock revokes the in-memory view and requires fresh authorization. If F16 cannot provide the required scope or its decision is unavailable, fail closed with `FORBIDDEN` or `POLICY_UNAVAILABLE`; do not fall back to broad app authority.

## PS-103-05.R03 — denial and leakage behavior

An unauthorized query for an unknown, foreign, deleted or hidden notice returns the same `NOT_FOUND` shape. Unauthorized mutation cannot change read state, delete a row, advance the event cursor, or reveal title/category/source event. No capability grants remote delivery, acknowledgment, consent, payment confirmation, moderation power, export authority, or control over another vault.

## Acceptance mapping

- `TEST-PS-103-05`: locked vault, wrong principal/vault, forged owner, missing/revoked capability, stale tab grant, read-only imported event and hidden-notice non-disclosure. These are planned security oracles only.
