# CTR-COM-001 — Payment evidence, claims and finality

**Status:** APPROVED. **Owner:** F09.S01.M01 (mod_noncustodial) and F09.S02 (settlement).

- **COM-1** The platform never holds funds or wallet private keys (no custody, no escrow). There is no `paid: boolean`; there are `PaymentClaim` records.
- **COM-2** `PaymentClaim`: `{ id, tenantId, contextRef {type, id}, method: cash|crypto|external, amount: Money, payerId, payeeId, claimedAt, txRef?, status, verification }`.
- **COM-3** Status machine: `claimed → acknowledged` (payee confirms) | `claimed → disputed`; crypto: `claimed → pending_confirmation → confirmed → final`, `confirmed|pending_confirmation → reorged → pending_confirmation|failed`; any non-final → `expired` after 14 days without progress.
- **COM-4** `verification`: `{ source: self|counterparty|chain|provider, chainId?, confirmations?, finalityPolicy?, checkedAt?, verifierVersion? }`. UI labels: *claimed (unverified)*, *acknowledged by payee*, *confirmed N/M on chain*, *final*. Only `final` (chain) or `acknowledged` (cash/external) may unlock downstream “completed” states, and the UI shows which.
- **COM-5** Default finality: Bitcoin 6 confirmations; Ethereum-family: block at or below the `finalized` tag; other chains disabled until configured. Chain verifiers are adapters behind `ChainVerifierPort`; with none configured, crypto claims stay `claimed` (honest unverified) — never auto-confirmed.
- **COM-6** Receipts (D06) are signed statements `{claimId, statement, signerId, signedAt, sig}` evidencing an assertion, not delivery.
