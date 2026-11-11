# PS-011-05 — Authorization and capabilities: Purchase offers

**Status:** SPECIFIED (Stage 3). **Module:** [F01.S04.M01 Purchase offers](SPEC.md) · **Scope:** MVP · **Code:** `packages/bazaar/src/pricing/offers` · **Contracts:** [CTR-ID-001](../../../planning/contracts/CTR-ID-001.md), [CTR-EVT-001](../../../planning/contracts/CTR-EVT-001.md), [CTR-ERR-001](../../../planning/contracts/CTR-ERR-001.md), [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md), [CTR-MNY-001](../../../planning/contracts/CTR-MNY-001.md), [CTR-IDM-001](../../../planning/contracts/CTR-IDM-001.md), [CTR-PRV-001](../../../planning/contracts/CTR-PRV-001.md), [CTR-FED-001](../../../planning/contracts/CTR-FED-001.md), [CTR-SCH-001](../../../planning/contracts/CTR-SCH-001.md)

> Generated from `module.spec.yaml` by `tools/specgen`. Edit the YAML, then run `pnpm spec:render`.

## Requirements

- **PS-011-05.R01** Vault policy (CAP-8): only the unlocked local principal acts: the buyer vault makes and withdraws, the listing author's vault accepts, rejects and resolves conflicts; inbound statements count only when signed by an authorized key of buyerId (offer, withdrawal) or of the listing author of the verified projection (decision, acceptance consent).
- **PS-011-05.R02** Offers exist only in the buyer's and the seller's vaults; any other local query returns NOT_FOUND and relays hold only ciphertext.
- **PS-011-05.R03** No relay role can read offers; a party may voluntarily attach decrypted offer evidence to a report on one relay, and that relay's moderators see only what was attached (CAP-9, PRV-5).

## Specification

| Capability | Granted to | Conditions |
|---|---|---|
| bazaar.offer.make | local principal (buyer) | buyer vault unlocked; not isBlockedEither(listing author); listing projection verified; the seller vault accepts the statement only if signed by a key of buyerId |
| bazaar.offer.receive | peer | vault policy: offer and withdrawal statements only when signed by a key of buyerId; decisions only when signed by the author key of the verified listing projection; otherwise quarantined |
| bazaar.offer.accept | local principal (seller) | seller vault: actor is the listing author (Listing.ownerId); the buyer vault accepts the acceptance only through comms.consent.verify for that author key |
| bazaar.offer.reject | local principal (seller), system (F01.S04.M02) | seller vault: actor is the listing author; reason countered only from F01.S04.M02 inside the counter transaction; buyer vault: only F01.S04.M02 after a verified first round |
| bazaar.offer.withdraw | local principal (buyer) | buyer vault: offer.buyerId = local principal and status made |
| bazaar.offer.resolve_conflict | local principal (seller) | seller vault: actor is the listing author; every named offer is frozen on the same unit |
| bazaar.offer.read_as_seller | local principal (seller) | seller vault only; hidden offers only for internal callers (F01.S01.M04 evidence check); no relay role can read offers |
| bazaar.offer.read_own | local principal (buyer) | buyer vault: offer.buyerId = local principal |

Default deny; evaluation and audit per [CTR-CAP-001](../../../planning/contracts/CTR-CAP-001.md).

## Verification

| Test | Level | Covers | Scenario | Expected |
|---|---|---|---|---|
| TEST-PS-011-09.T08 | abuse | PS-011-05.R01, PS-011-05.R02, PS-011-07.R01 | non-owner accepts; third party queries offers; public listing view | FORBIDDEN or NOT_FOUND; no offer data in public payloads |
| TEST-PS-011-09.T09 | abuse | PS-011-05.R03 | relay moderator of R inspects mailboxes and a report with and without voluntarily attached offer evidence | mailbox holds only ciphertext; the moderator sees only what the reporting party attached to the report on R |

## Dependencies

Module depends on: F01.S01.M01, F01.S01.M03, F01.S02.M01, F01.S03.M01, F09.S01.M01, F09.S03.M01, F09.S03.M03, F07.S02.M02, F08.S02.M02, F11.S01.M01, F11.S01.M02, F11.S02.M03, F16.S02.M03, F10.S01.M02, F10.S01.M03, F10.S01.M04, F10.S02.M02, CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-MNY-001, CTR-IDM-001, CTR-PRV-001, CTR-FED-001, CTR-SCH-001. Predecessor: [domain_schema.md](domain_schema.md).
