# PS-040-05 — Authorization and capabilities: Rental deposits (noncustodial)

**Status:** SPECIFIED (Stage 3). **Module:** [F05.S01.M02 Rental deposits (noncustodial)](SPEC.md) · **Scope:** MVP · **Code:** `packages/rentals/src/rental_catalog/deposits` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-040-05.R01** Vault policy - only the local principal who owns the reservation proposes, withdraws, attests release or claims forfeit; only the renter agrees, declines and responds; only the designated opener opens a dispute case.
- **PS-040-05.R02** Inbound statements are accepted only when the signer's key matches the role for that statement in this deposit; otherwise they are quarantined with a reason code.
- **PS-040-05.R03** Payment events are applied only when their contextRef belongs to deposit terms in this vault; no relay role exists.

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| rentals.deposit.propose | principal | local principal is the owner of the confirmed reservation |
| rentals.deposit.agree | principal | local principal is the renter of the reservation; terms proposed and current |
| rentals.deposit.withdraw | principal | owner (withdrawal) or renter (decline); state proposed, or agreed with no funding claim |
| rentals.deposit.release | principal | local principal is the owner; state funded or escalation_due, or release_pending with no release Deal; no return or window condition |
| rentals.deposit.forfeit | principal | local principal is the owner; state funded; V06 window open |
| rentals.deposit.respond | principal | local principal is the renter; state forfeit_claimed; not after respondBy |
| rentals.deposit.dispute | principal | designated opener only, on explicit action - the renter from funded (decision overdue or release refused), release_pending, forfeit_claimed (contest) or frozen; the owner from escalation_due after an unanswered forfeit claim |
| rentals.deposit.renegotiate | principal | local principal is owner or renter; state frozen |
| rentals.deposit.receive | principal | any envelope; acceptance depends on signature and signer role |
| rentals.deposit.read_own | principal | local principal is owner or renter of the reservation |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-040-09.T09 | abuse | PS-040-05.R01, PS-040-05.R02, PS-040-05.R03 | inbound release attestation signed by the renter; local respond_forfeit by the owner; payment event for a foreign contextRef | the statement is quarantined with RENTALS_STATEMENT_INVALID; the command returns FORBIDDEN; the event is ignored under V08; no state change |

## Dependencies

Module depends on: F05.S01.M01, F09.S01.M01, F09.S01.M03, F09.S02.M02, F09.S03.M01, F09.S03.M03, F08.S01.M01, F08.S02.M02, F07.S01.M01, F07.S02.M02, F11.S01.M01, F11.S01.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-COM-001, CTR-PRV-001, CTR-FED-001. Predecessor: [domain_schema.md](domain_schema.md).
