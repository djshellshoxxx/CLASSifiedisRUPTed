# PS-040-05 — authorization capabilities

**Status:** SPECIFIED — Stage 3 draft, pending review. **Requirement ID:** PS-040-05. **Owner:** [05_Rentals/01_rental_catalog/mod_deposits](SPEC.md). **Implementing module:** 05_Rentals/01_rental_catalog/mod_deposits. **Consumers:** PWA client (hides unavailable actions), moderation (dispute scope), observability (denial counters).

## Purpose and scope
Define which actor may perform which action on which deposit resource. The capability matrix is owned by CTR-CAP-001 (owner F16, identity by F07). This file supplies the deposit rows. Authorization is enforced by the server on every request. Client-side hiding is never a control.

## Requirements
- PS-040-05.R01: Business outcome: each action on a deposit is allowed only for the party or scoped role defined in the matrix, and every denial is logged without personal data. Exclusions: rental booking permissions, listing ownership rules, and federation trust (F11).
- PS-040-05.R02: Case coverage: non-party read (NOT_FOUND), party with wrong role (FORBIDDEN_ROLE), revoked capability (FORBIDDEN_REVOKED), stale capability token replayed after revocation, moderator acting on a deposit outside dispute scope, and operator attempting to read records.
- PS-040-05.R03: Access checks combine capability and relationship. Holding a capability alone is insufficient; the caller must be the depositor or receiver recorded on the deposit, or hold a dispute scope for that exact deposit.
- PS-040-05.R04: Capability keys follow `deposits.<action>` and are registered with CTR-CAP-001. Revocation takes effect for the next request. Tokens are not trusted beyond their expiry.
- PS-040-05.R05: Operators configure flags, timers and caps. Operators have no read access to deposit records or evidence. Aggregate counts only.

## Matrix
Legend: Y = allowed; N = denied; S = allowed only in the state named in workflow_state_machine.md; D = dispute scope for this deposit only.

| Action (capability) | Depositor | Receiver | Dispute moderator | Operator | Non-party | System timer |
|---|---|---|---|---|---|---|
| deposits.create | N | Y (S: draft) | N | N | N (NOT_FOUND) | N |
| deposits.propose | N | Y (S: draft) | N | N | N | N |
| deposits.counter | Y (S: proposed, receiver proposed) | Y (S: proposed, depositor proposed) | N | N | N | N |
| deposits.accept | Y (S: proposed, non-proposer) | Y (S: proposed, non-proposer) | N | N | N | N |
| deposits.decline | Y (S: proposed, non-proposer) | Y (S: proposed, non-proposer) | N | N | N | N |
| deposits.cancel | Y (S: agreed, proposed by depositor, or per state rules) | Y (S: draft, proposed by receiver, agreed) | N | N | N | N |
| deposits.claim_paid | Y (S: agreed) | N | N | N | N | N |
| deposits.confirm_received | N | Y (S: paid_claimed) | N | N | N | N |
| deposits.claim_return | N | Y (S: received_claimed) | N | N | N | N |
| deposits.claim_withhold | N | Y (S: received_claimed) | N | N | N | N |
| deposits.confirm_return | Y (S: return_claimed) | N | N | N | N | N |
| deposits.acknowledge_withhold | Y (S: withheld_claimed) | N | N | N | N | N |
| deposits.open_dispute | Y (S: paid_claimed, received_claimed, return_claimed, withheld_claimed) | Y (S: same) | N | N | N | N |
| deposits.attach_evidence | Y (S: paid_claimed to disputed) | Y (S: received_claimed to disputed) | N | N | N | N |
| deposits.resolve_dispute | N | N | D (S: disputed) | N | N | N |
| deposits.read | Y | Y | D | N (aggregate only) | N (NOT_FOUND) | N |
| deposits.list_mine | Y | Y | N | N | N | N |
| deposits.export_own | Y | Y | N | N | N | N |
| deposits.configure | N | N | N | Y (flags, timers, caps) | N | N |
| deposits.apply_timer | N | N | N | N | N | Y (system only) |

## Dispute scope rules
- Dispute scope is `deposits.resolve_dispute:<deposit_id>`. It is granted through CTR-CAP-001 only when a dispute is open on that deposit. It expires 72 hours after grant or on resolution, whichever comes first (A-deposits-17).
- The moderator may read the deposit, history and evidence for that deposit only.
- Every grant and use is logged with the moderator's pseudonymous ID.

## Revocation rules
- A blocked participant (F07) is refused every state-changing action with DEPOSITS_FORBIDDEN_REVOKED.
- A blocked participant keeps read access to their own records unless a moderation order restricts it. Restriction is a flag that CTR-CAP-001 owns.
- Revocation of a moderator scope takes effect on the next request. In-flight transactions finish with the authority they had at lock time.
- Timers are system actions and are not revocable by participant status.

## Assumptions and open decisions
- A-deposits-17: Moderator access is per dispute through a scoped capability, not a standing role.
- A-deposits-18: Non-parties receive DEPOSITS_NOT_FOUND, not FORBIDDEN, so existence is not disclosed.
- A-deposits-30: rental_status checks used in guards are provisional until 02_rental_lifecycle publishes its contract.
- Open: capability role names (depositor, receiver, dispute_moderator, operator) must be confirmed in CTR-CAP-001 (F16). Not yet in planning/CONTRACTS.md.

## Test cases
- TEST-PS-040-05-T01: Operator calls deposits.read. Pass: denied; no record fields returned. Fail: any field returned.
- TEST-PS-040-05-T02: Moderator reads a deposit outside dispute scope. Pass: DEPOSITS_NOT_FOUND. Fail: data returned.
- TEST-PS-040-05-T03: Depositor calls deposits.accept on a proposal they made. Pass: DEPOSITS_FORBIDDEN_ROLE. Fail: accepted.
