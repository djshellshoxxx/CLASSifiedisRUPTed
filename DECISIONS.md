# Decision register — client-side reconciliation

Owner mandate is settled: client-side CLASS, local user keys/data, no mandatory product backend/accounts/server secrets. Engineering defaults below are delegated and require independent review; no formal security certification is implied.

| ID | Subject | Decision | Remaining evidence / owner input |
|---|---|---|---|
| D01 | Federation | optional signed public interchange; quarantine known forks | reviewed key/signature/rotation profile and fixtures; no ActivityPub claim |
| D02 | Matcher | deterministic bounded simple-cycle search 2..8 | reviewed budgets/property oracles for F02 consumers |
| D03 | Value | integer minor units; same-currency claims; pinned rational FX future | currency metadata and selected FX source before enablement |
| D04 | Partial handoff | per-party assertions; no atomicity/physical rollback | owner review of product promises; no silent reroute |
| D05 | Geography | coarse public region, exact address local/private | actual region taxonomy and sparse-population review |
| D06 | Receipts | claim/acknowledgement/external observation distinct | network/provider-specific evidence policy |
| D07 | Retention | local deletion/export; no global erasure/product holds | per-category limits, restore/revocation and backup crypto review |
| D08 | Offline | local commit independent of delivery | tab race/abort/quota tests, peer freshness UI |
| D09 | Rentals | external deposit claims; proposed local calendar | terms/jurisdiction; no global booking exclusivity |
| D10 | Identity | user-owned keys initially; pseudonyms only | reviewed vault unlock/rotation/recovery/backup protocol |
| D11 | Messaging | drafts local, send gated pending encryption review | protocol/library/device verification/multi-device design |
| D12 | Notifications | in-app baseline, no always-on promise | chosen push/mail dependency/privacy contract if enabled |
| D13 | Auctions/paid placement | remain tracked; trusted close time/shared paid reach cannot be guaranteed locally | owner chooses voluntary peer protocol with explicit limits or exact approved disabled/deferred behavior; product backend forbidden |
| D14 | Original coverage | repository/current instruction is available evidence | missing private original-idea source needed to certify exhaustive coverage |
| D15 | Content/jurisdiction | no fabricated legal approval/universal prohibited list | owner-selected jurisdiction and reviewed policy before real-world public-commerce release; local design continues |

D13..15 require actual owner/source/policy input, not generated approval. D01/D07/D10/D11 require independent security evidence. No row approves a registered DRAFT process. [Architecture](planning/CLIENT_SIDE_ARCHITECTURE.md) and [handoff](HANDOFF.md) contain affected paths and next steps.
