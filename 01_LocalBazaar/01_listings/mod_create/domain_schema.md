# PS-002-01 — Creation data model

**Status:** SPECIFIED — pending architecture/security review; application not implemented. **Owner:** F01.S01.M01. **Parent:** [SPEC.md](SPEC.md). Contract references: [API/events](../../../planning/contracts/CORE_API_EVENTS_DATA.md), [listing model](../../../planning/contracts/CLASSIFIED_LISTING_CONTRACT.md), [security threats](../../../planning/SECURITY_PRIVACY_THREAT_MODEL.md), [test gates](../../../planning/RELEASE_AND_TEST_GATES.md). All examples are proposed v1 contracts.

## Requirements and typed data
- PS-002-01.R01: Authorized member creates exactly one draft listing scoped to the authenticated tenant. Server generates UUIDv7 id, owner_id from session, timestamps and revision 1.
- PS-002-01.R02: Draft input fields: kind (enum sell/wanted/giveaway, required); title (NFC Unicode text 3..120, optional until publish); description (text 0..10000, default empty); condition (new/used/for_parts/unspecified); public_area_id (3..64 approved coarse code, optional for draft); quantity (integer 1..100000); price (optional object {currency ISO4217 uppercase code, amount_minor canonical positive 64-bit integer decimal string}); price_on_request (boolean, false default). Reject owner_id, tenant_id, state, revision and private address in request.
- PS-002-01.R03: Persist in listings relation as detailed in CLASSIFIED_LISTING_CONTRACT: primary key(tenant_id,id), CHECK kind enum, quantity>=0, revision>=1, price minor positive, paired nullable currency/amount and giveaway prohibits price. Account/session FK links to F07 canonical user table; final FK DDL depends on F07 schema ratification. Never copy F07 credentials into listing.
- PS-002-01.R04: Public listing must have title and coarse area; server draft state always private. F06 search stores only published projection. Monetary field stored SQL BIGINT with JSON decimal string, never IEEE754 double.
## SQL mutation rule
INSERT listings tenant/owner/id/state='draft'/revision=1 together with outbox listing.created and idempotency receipt inside one transaction. SQL CHECK ensures price fields paired; indexes owner(tenant_id,owner_id,updated_at), public visibility index only after F01 publish rules. On DB failure rollback entire transaction.
## Acceptance
TEST-PS-002-01 includes zero/overflow price, unset draft fields, tenant collisions and DB constraint matrices; 100 concurrent identical creates yield one authoritative row. Pending test execution.
