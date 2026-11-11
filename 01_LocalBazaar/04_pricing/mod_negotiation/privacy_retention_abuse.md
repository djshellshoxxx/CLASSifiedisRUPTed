# PS-010-07 — Privacy, retention and abuse: Price negotiation

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M02 Price negotiation](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/negotiation` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-COM-001](../../../planning/contracts/CTR-COM-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-010-07.R01** Amounts and notes are P2 and never appear in public projections, relay indexes, federation or notification payloads; relays see ciphertext and routing metadata only.
- **PS-010-07.R02** Negotiations are retained RET-EVIDENCE; on principal deletion (privacy.deletion.completed) the deleting vault replaces the party with the pseudonym and the counterparty keeps its own copy.
- **PS-010-07.R03** Notes are plain text; links are rendered as text and can be reported.
- **PS-010-07.R04** The module registers ExportSectionPort, DeletionPort and RetentionPurgePort with F10 (N6), annotates every Negotiation and NegotiationRound field with its F10.S02.M02 class, and pseudonymizes retained chains on privacy.deletion.completed.

## Specification

**Data classification**
- Negotiation and NegotiationRound: P2 (buyer, seller); field classes annotated per F10.S02.M02.
- Notes: P2 free text scanned locally by spam heuristics; never federated.

**Retention**
- Terminal negotiations: RET-EVIDENCE (2 years after last related activity).
- Quarantined statements: RET-SHORT 30 days.

**Threats and controls**

| ID | Threat | Control |
|---|---|---|
| T01 | Forged counter or acceptance to trick a party | signatures over JCS, role and chain checks, acceptance through comms.consent.verify bound to the round digest and listingRevision |
| T02 | Replay of an old acceptance | consent binds the round digest, prev hash chain, expiry and idempotency by statementCid; closes and confirmations bind the round cid |
| T03 | Bait-and-switch: seller changes listing after buyer commits | accept binds listingRevision; stale revision refused; material edits flag the chain |
| T04 | Inventory double-sell via concurrent accepts | hold taken in the seller vault before confirmation; no confirmation without hold; honest limit: only this seller vault prevents double-sell, forks are frozen |
| T05 | Fork and equivocation by a malicious party signing two rounds | detection by same roundNo, chain frozen, both signed statements kept as evidence |
| T06 | Harassment through endless counters | 10-round and 14-day limits, rate limit 20 counters per hour, block list |
| T07 | Mixed-currency rounds breaking the convergence rule | chain pinned to the root currency and quantity (V13) |

**Abuse controls**
- At most 20 counter commands per hour per vault and 50 open chains per listing in the seller vault.
- Report action on any round stores the signed statements as evidence for the relay moderator or local block.

Classes per [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-010-09.T02 | unit | PS-010-01.R02, PS-010-07.R01 | inspect projection, relay payload, logs and notifications | no amounts or notes outside encrypted statements |
| TEST-PS-010-09.T15 | integration | PS-010-07.R02 | principal deletion of the buyer (privacy.deletion.completed in B) | B's retained chains carry the pseudonym; S's copy keeps amounts; retention evidence respected |
| TEST-PS-010-09.T20 | abuse | PS-010-07.R03 | a round note containing a URL is shown in both vaults, then reported | URL rendered as plain text without a link; the report stores the signed round statements and their cids as evidence |
| TEST-PS-010-09.T26 | integration | PS-010-07.R04 | export sections, deletion plan and retention purge through the F10 ports | sections present with field classes; deletion plan pseudonymizes retained chains and purges notes of non-evidence chains |

## Dependencies

Module depends on: F01.S04.M01, F01.S03.M01, F01.S01.M01, F01.S02.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-IDM-001, CTR-MNY-001, CTR-PRV-001, CTR-FED-001, CTR-COM-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
