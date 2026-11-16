# Dependency matrix

**Declared dependency list, not an execution graph; cycles must be checked (see TD-02).**

Status: DRAFT. Rows cover all 148 modules in `INDEX.md`. Edges are declared from feature scope, not yet confirmed against module `SPEC.md` files. ASSUMPTION: edges are design-level; no runtime call graph is implied.

How to read this table:
- **Depends on** lists module IDs only (feature code is the ID prefix). A module never lists itself. A feature never lists its own feature code; same-feature edges appear only as real sibling module IDs.
- **Provides to** is the inverse of Depends on, computed from the same edges. `none` = no declared consumer yet.
- **Contracts** cite canonical IDs in `planning/contracts/CTR-*.md`. Cross-cutting edges to F07, F10, F15 and F16 and settlement (F09.S02) and moderation (F12) edges are per module, only where the module actually uses them.
- Duplicate module names (e.g. `mod_offers`, `mod_consent`) are distinct rows. Consumers reference the canonical owner by full ID.

| Module ID | Module path | Depends on | Provides to | Contracts |
|---|---|---|---|---|
| F01.S01.M01 | 01_LocalBazaar/01_listings/mod_create | F07.S01.M02, F09.S03.M01, F10.S01.M01, F12.S03.M04, F16.S01.M01 | F01.S01.M02, F01.S01.M03, F01.S02.M01, F01.S02.M02, F01.S02.M03, F01.S04.M01, F02.S01.M01, F04.S01.M01, F08.S01.M02 | CTR-ID-001, CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001 |
| F01.S01.M02 | 01_LocalBazaar/01_listings/mod_edit | F01.S01.M01, F07.S01.M02, F09.S03.M01, F16.S01.M01 | F01.S03.M02 | CTR-EVT-001, CTR-ERR-001, CTR-CAP-001, CTR-SCH-001 |
| F01.S01.M03 | 01_LocalBazaar/01_listings/mod_publish | F01.S01.M01, F12.S02.M01, F15.S02.M01 | F01.S01.M04, F01.S03.M01, F06.S01.M01 | CTR-EVT-001, CTR-ERR-001, CTR-FED-001, CTR-CAP-001 |
| F01.S01.M04 | 01_LocalBazaar/01_listings/mod_archive | F01.S01.M03, F08.S01.M02, F10.S01.M02 | none | CTR-EVT-001, CTR-PRV-001 |
| F01.S02.M01 | 01_LocalBazaar/02_listing_types/mod_sell | F01.S01.M01, F09.S03.M03, F14.S02.M02 | F18.S01.M03 | CTR-SCH-001, CTR-ERR-001 |
| F01.S02.M02 | 01_LocalBazaar/02_listing_types/mod_wanted | F01.S01.M01, F06.S01.M02, F09.S03.M03 | none | CTR-SCH-001, CTR-EVT-001 |
| F01.S02.M03 | 01_LocalBazaar/02_listing_types/mod_giveaway | F01.S01.M01, F08.S03.M02, F12.S02.M02 | none | CTR-ERR-001, CTR-PRV-001 |
| F01.S03.M01 | 01_LocalBazaar/03_inventory/mod_availability | F01.S01.M03, F15.S01.M01 | F01.S03.M02, F02.S02.M05, F02.S03.M02, F03.S01.M02, F05.S01.M01 | CTR-EVT-001, CTR-SCH-001 |
| F01.S03.M02 | 01_LocalBazaar/03_inventory/mod_variants | F01.S01.M02, F01.S03.M01, F09.S03.M03 | none | CTR-SCH-001, CTR-ERR-001 |
| F01.S04.M01 | 01_LocalBazaar/04_pricing/mod_offers | F01.S01.M01, F09.S03.M03 | F01.S04.M02, F08.S02.M01 | CTR-EVT-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 |
| F01.S04.M02 | 01_LocalBazaar/04_pricing/mod_negotiation | F01.S04.M01, F08.S01.M02, F08.S02.M02 | none | CTR-EVT-001, CTR-ERR-001, CTR-CAP-001 |
| F02.S01.M01 | 02_LocalMutiny/01_trade_proposals/mod_two | F01.S01.M01, F07.S03.M01, F12.S02.M03, F16.S01.M01 | F02.S01.M02, F02.S01.M03, F02.S02.M01, F02.S02.M05 | CTR-ID-001, CTR-EVT-001, CTR-CAP-001, CTR-ERR-001 |
| F02.S01.M02 | 02_LocalMutiny/01_trade_proposals/mod_party | F02.S01.M01, F02.S02.M01, F08.S02.M02 | F02.S01.M03, F02.S02.M04 | CTR-ID-001, CTR-EVT-001, CTR-CAP-001 |
| F02.S01.M03 | 02_LocalMutiny/01_trade_proposals/mod_offer | F02.S01.M01, F02.S01.M02, F08.S02.M01 | F02.S01.M04 | CTR-EVT-001, CTR-ERR-001, CTR-CAP-001 |
| F02.S01.M04 | 02_LocalMutiny/01_trade_proposals/mod_counteroffer | F02.S01.M03, F02.S04.M03, F08.S02.M02 | F02.S03.M01 | CTR-EVT-001, CTR-ERR-001 |
| F02.S02.M01 | 02_LocalMutiny/02_cycle_matching/mod_three | F02.S01.M01, F02.S02.M05, F06.S03.M01 | F02.S01.M02, F02.S02.M02 | CTR-EVT-001, CTR-ERR-001 |
| F02.S02.M02 | 02_LocalMutiny/02_cycle_matching/mod_four | F02.S02.M01, F02.S02.M05, F15.S03.M01 | F02.S02.M03 | CTR-EVT-001, CTR-ERR-001 |
| F02.S02.M03 | 02_LocalMutiny/02_cycle_matching/mod_n | F02.S02.M02, F02.S02.M05, F15.S02.M03 | F02.S02.M04 | CTR-EVT-001, CTR-SCH-001 |
| F02.S02.M04 | 02_LocalMutiny/02_cycle_matching/mod_party | F02.S01.M02, F02.S02.M03, F02.S03.M01 | none | CTR-EVT-001, CTR-ID-001 |
| F02.S02.M05 | 02_LocalMutiny/02_cycle_matching/mod_feasibility | F01.S03.M01, F02.S01.M01, F02.S04.M03 | F02.S02.M01, F02.S02.M02, F02.S02.M03 | CTR-ERR-001, CTR-EVT-001 |
| F02.S03.M01 | 02_LocalMutiny/03_cycle_execution/mod_consent | F02.S01.M04, F10.S01.M01 | F02.S02.M04, F02.S03.M02 | CTR-CAP-001, CTR-EVT-001 |
| F02.S03.M02 | 02_LocalMutiny/03_cycle_execution/mod_lock | F01.S03.M01, F02.S03.M01 | F02.S03.M03 | CTR-EVT-001, CTR-ERR-001 |
| F02.S03.M03 | 02_LocalMutiny/03_cycle_execution/mod_dropouts | F02.S03.M02, F07.S03.M01 | F02.S03.M04 | CTR-EVT-001, CTR-CAP-001 |
| F02.S03.M04 | 02_LocalMutiny/03_cycle_execution/mod_recovery | F02.S03.M03, F15.S03.M03 | none | CTR-EVT-001, CTR-ERR-001 |
| F02.S04.M01 | 02_LocalMutiny/04_value_balancing/mod_mixed | F02.S04.M03, F09.S03.M01 | none | CTR-SCH-001, CTR-ERR-001 |
| F02.S04.M02 | 02_LocalMutiny/04_value_balancing/mod_currency | F09.S03.M01, F09.S03.M03 | none | CTR-SCH-001 |
| F02.S04.M03 | 02_LocalMutiny/04_value_balancing/mod_valuation | F09.S03.M02, F09.S03.M03 | F02.S01.M04, F02.S02.M05, F02.S04.M01 | CTR-SCH-001, CTR-ERR-001 |
| F03.S01.M01 | 03_Services/01_service_catalog/mod_skills | F07.S01.M01, F07.S03.M02 | F03.S01.M02, F03.S02.M01, F06.S01.M01 | CTR-SCH-001, CTR-EVT-001 |
| F03.S01.M02 | 03_Services/01_service_catalog/mod_availability | F01.S03.M01, F03.S01.M01, F15.S01.M01 | F03.S02.M01 | CTR-EVT-001, CTR-SCH-001 |
| F03.S02.M01 | 03_Services/02_service_booking/mod_quotes | F03.S01.M01, F03.S01.M02, F08.S02.M01, F09.S03.M03 | F03.S02.M02 | CTR-ERR-001, CTR-EVT-001 |
| F03.S02.M02 | 03_Services/02_service_booking/mod_milestones | F03.S02.M01, F09.S01.M01, F09.S02.M01 | F03.S02.M03 | CTR-COM-001, CTR-EVT-001, CTR-SCH-001 |
| F03.S02.M03 | 03_Services/02_service_booking/mod_disputes | F03.S02.M02, F09.S02.M02, F12.S01.M01 | none | CTR-COM-001, CTR-CAP-001, CTR-ERR-001 |
| F04.S01.M01 | 04_Auctions/01_auction_lifecycle/mod_reserve | F01.S01.M01, F09.S03.M01 | F04.S01.M02 | CTR-SCH-001, CTR-ERR-001 |
| F04.S01.M02 | 04_Auctions/01_auction_lifecycle/mod_bids | F04.S01.M01, F07.S01.M02 | F04.S01.M03, F04.S02.M01, F04.S02.M02 | CTR-EVT-001, CTR-CAP-001, CTR-ID-001 |
| F04.S01.M03 | 04_Auctions/01_auction_lifecycle/mod_close | F04.S01.M02, F04.S02.M02, F09.S02.M01 | none | CTR-COM-001, CTR-EVT-001 |
| F04.S02.M01 | 04_Auctions/02_auction_integrity/mod_anti | F04.S01.M02, F07.S03.M01, F12.S03.M02 | F04.S02.M03 | CTR-EVT-001, CTR-ERR-001 |
| F04.S02.M02 | 04_Auctions/02_auction_integrity/mod_sniping | F04.S01.M02, F15.S03.M01 | F04.S01.M03 | CTR-EVT-001 |
| F04.S02.M03 | 04_Auctions/02_auction_integrity/mod_fraud | F04.S02.M01, F09.S02.M03, F12.S03.M01 | none | CTR-COM-001, CTR-PRV-001 |
| F05.S01.M01 | 05_Rentals/01_rental_catalog/mod_availability | F01.S03.M01, F15.S01.M01 | F05.S01.M02 | CTR-SCH-001, CTR-EVT-001 |
| F05.S01.M02 | 05_Rentals/01_rental_catalog/mod_deposits | F05.S01.M01, F09.S01.M01, F09.S02.M01 | F05.S02.M01, F05.S02.M03 | CTR-COM-001, CTR-SCH-001 |
| F05.S02.M01 | 05_Rentals/02_rental_lifecycle/mod_handoff | F05.S01.M02, F08.S03.M01 | F05.S02.M02 | CTR-EVT-001, CTR-PRV-001 |
| F05.S02.M02 | 05_Rentals/02_rental_lifecycle/mod_return | F05.S02.M01, F09.S02.M01 | F05.S02.M03 | CTR-EVT-001, CTR-COM-001 |
| F05.S02.M03 | 05_Rentals/02_rental_lifecycle/mod_damage | F05.S01.M02, F05.S02.M02, F09.S02.M02, F12.S01.M02 | none | CTR-COM-001, CTR-EVT-001 |
| F06.S01.M01 | 06_Discovery/01_search/mod_index | F01.S01.M03, F03.S01.M01, F15.S02.M03 | F06.S01.M02 | CTR-EVT-001, CTR-SCH-001, CTR-PRV-001 |
| F06.S01.M02 | 06_Discovery/01_search/mod_query | F06.S01.M01, F06.S02.M01, F10.S02.M01 | F01.S02.M02, F06.S01.M03, F06.S03.M01 | CTR-PRV-001, CTR-ERR-001 |
| F06.S01.M03 | 06_Discovery/01_search/mod_filter | F06.S01.M02, F14.S02.M01 | F06.S02.M03 | CTR-ERR-001 |
| F06.S02.M01 | 06_Discovery/02_geoprivacy/mod_coarse | F10.S01.M01, F10.S01.M02 | F06.S01.M02, F06.S02.M02, F08.S03.M02 | CTR-PRV-001 |
| F06.S02.M02 | 06_Discovery/02_geoprivacy/mod_location | F06.S02.M01, F10.S02.M03 | F06.S02.M03 | CTR-PRV-001, CTR-CAP-001 |
| F06.S02.M03 | 06_Discovery/02_geoprivacy/mod_proximity | F06.S01.M03, F06.S02.M02, F12.S02.M03 | none | CTR-PRV-001, CTR-ERR-001 |
| F06.S03.M01 | 06_Discovery/03_ranking/mod_relevance | F06.S01.M02, F07.S03.M01 | F02.S02.M01, F06.S03.M02 | CTR-SCH-001 |
| F06.S03.M02 | 06_Discovery/03_ranking/mod_fairness | F06.S03.M01, F12.S03.M03 | none | CTR-ERR-001 |
| F07.S01.M01 | 07_Identity/01_accounts/mod_pseudonyms | F16.S02.M01 | F03.S01.M01, F07.S01.M02, F07.S02.M02, F07.S03.M02, F12.S02.M01, F13.S01.M02, F16.S01.M01 | CTR-ID-001, CTR-CAP-001, CTR-PRV-001 |
| F07.S01.M02 | 07_Identity/01_accounts/mod_sessions | F07.S01.M01, F15.S02.M02, F16.S01.M02 | F01.S01.M01, F01.S01.M02, F04.S01.M02, F07.S01.M03, F08.S01.M01, F12.S01.M01, F13.S01.M01 | CTR-CAP-001, CTR-ERR-001 |
| F07.S01.M03 | 07_Identity/01_accounts/mod_recovery | F07.S01.M02, F13.S01.M02, F16.S03.M02 | none | CTR-CAP-001, CTR-ERR-001 |
| F07.S02.M01 | 07_Identity/02_profiles/mod_portable | F07.S02.M02, F10.S01.M02, F16.S02.M03 | F10.S01.M03, F11.S01.M01 | CTR-FED-001, CTR-SCH-001 |
| F07.S02.M02 | 07_Identity/02_profiles/mod_profiles | F07.S01.M01, F10.S02.M03 | F07.S02.M01, F07.S03.M01, F13.S02.M02, F14.S02.M01 | CTR-SCH-001, CTR-PRV-001 |
| F07.S03.M01 | 07_Identity/03_trust/mod_reputation | F07.S02.M02, F07.S03.M02, F12.S03.M02 | F02.S01.M01, F02.S03.M03, F04.S02.M01, F06.S03.M01, F11.S03.M01, F18.S02.M01 | CTR-SCH-001, CTR-EVT-001 |
| F07.S03.M02 | 07_Identity/03_trust/mod_evidence | F07.S01.M01, F12.S01.M02, F16.S02.M03 | F03.S01.M01, F07.S03.M01 | CTR-PRV-001, CTR-CAP-001 |
| F08.S01.M01 | 08_Communications/01_messaging/mod_private | F07.S01.M02, F10.S01.M01, F16.S02.M01 | F08.S01.M02, F08.S01.M03, F08.S03.M01 | CTR-CAP-001, CTR-PRV-001, CTR-ERR-001 |
| F08.S01.M02 | 08_Communications/01_messaging/mod_threads | F01.S01.M01, F08.S01.M01, F12.S01.M01 | F01.S01.M04, F01.S04.M02, F08.S02.M01, F08.S03.M03 | CTR-ID-001, CTR-EVT-001, CTR-SCH-001 |
| F08.S01.M03 | 08_Communications/01_messaging/mod_attachments | F08.S01.M01, F12.S02.M03, F15.S02.M03 | none | CTR-PRV-001, CTR-SCH-001 |
| F08.S02.M01 | 08_Communications/02_negotiation/mod_offers | F01.S04.M01, F08.S01.M02 | F02.S01.M03, F03.S02.M01, F08.S02.M02 | CTR-EVT-001, CTR-SCH-001, CTR-CAP-001 |
| F08.S02.M02 | 08_Communications/02_negotiation/mod_consent | F08.S02.M01, F10.S01.M01, F16.S01.M01 | F01.S04.M02, F02.S01.M02, F02.S01.M04, F08.S03.M01 | CTR-CAP-001, CTR-EVT-001 |
| F08.S03.M01 | 08_Communications/03_meetups/mod_safe | F08.S01.M01, F08.S02.M02, F12.S02.M03 | F05.S02.M01, F08.S03.M02 | CTR-PRV-001, CTR-ERR-001 |
| F08.S03.M02 | 08_Communications/03_meetups/mod_handoff | F06.S02.M01, F08.S03.M01 | F01.S02.M03, F08.S03.M03, F09.S01.M02 | CTR-PRV-001, CTR-EVT-001 |
| F08.S03.M03 | 08_Communications/03_meetups/mod_coordination | F08.S01.M02, F08.S03.M02, F13.S01.M03 | none | CTR-EVT-001 |
| F09.S01.M01 | 09_Commerce/01_payments/mod_noncustodial | F09.S03.M01, F12.S03.M01, F16.S01.M02 | F03.S02.M02, F05.S01.M02, F09.S01.M03, F09.S02.M01 | CTR-COM-001, CTR-CAP-001, CTR-ERR-001 |
| F09.S01.M02 | 09_Commerce/01_payments/mod_cash | F08.S03.M02, F09.S03.M03 | F09.S02.M01 | CTR-COM-001, CTR-EVT-001 |
| F09.S01.M03 | 09_Commerce/01_payments/mod_crypto | F09.S01.M01, F09.S03.M02, F16.S02.M02 | F09.S02.M03 | CTR-COM-001, CTR-ERR-001 |
| F09.S02.M01 | 09_Commerce/02_settlement/mod_receipts | F09.S01.M01, F09.S01.M02, F16.S02.M03 | F03.S02.M02, F04.S01.M03, F05.S01.M02, F05.S02.M02, F09.S02.M02, F09.S02.M03 | CTR-COM-001, CTR-SCH-001, CTR-EVT-001 |
| F09.S02.M02 | 09_Commerce/02_settlement/mod_disputes | F09.S02.M01, F12.S01.M02, F12.S01.M03 | F03.S02.M03, F05.S02.M03 | CTR-COM-001, CTR-CAP-001 |
| F09.S02.M03 | 09_Commerce/02_settlement/mod_reconciliation | F09.S01.M03, F09.S02.M01, F15.S03.M02 | F04.S02.M03 | CTR-COM-001, CTR-EVT-001 |
| F09.S03.M01 | 09_Commerce/03_valuation/mod_currency | F09.S03.M03, F14.S02.M02 | F01.S01.M01, F01.S01.M02, F02.S04.M01, F02.S04.M02, F04.S01.M01, F09.S01.M01, F09.S03.M02 | CTR-SCH-001, CTR-COM-001 |
| F09.S03.M02 | 09_Commerce/03_valuation/mod_rates | F09.S03.M01, F15.S02.M02 | F02.S04.M03, F09.S01.M03 | CTR-SCH-001, CTR-COM-001, CTR-EVT-001 |
| F09.S03.M03 | 09_Commerce/03_valuation/mod_precision | F15.S02.M02 | F01.S02.M01, F01.S02.M02, F01.S03.M02, F01.S04.M01, F02.S04.M02, F02.S04.M03, F03.S02.M01, F09.S01.M02, F09.S03.M01, F14.S02.M02 | CTR-SCH-001 |
| F10.S01.M01 | 10_Privacy/01_data_controls/mod_consent | F15.S02.M03, F16.S01.M01 | F01.S01.M01, F02.S03.M01, F06.S02.M01, F08.S01.M01, F08.S02.M02, F10.S01.M02, F13.S02.M02, F13.S02.M03 | CTR-PRV-001, CTR-CAP-001, CTR-EVT-001 |
| F10.S01.M02 | 10_Privacy/01_data_controls/mod_retention | F10.S01.M01, F15.S02.M03, F15.S03.M02 | F01.S01.M04, F06.S02.M01, F07.S02.M01, F10.S01.M03, F10.S01.M04 | CTR-PRV-001, CTR-SCH-001 |
| F10.S01.M03 | 10_Privacy/01_data_controls/mod_export | F07.S02.M01, F10.S01.M02 | none | CTR-PRV-001, CTR-FED-001 |
| F10.S01.M04 | 10_Privacy/01_data_controls/mod_delete | F10.S01.M02, F15.S02.M03, F15.S03.M02 | none | CTR-PRV-001, CTR-EVT-001 |
| F10.S02.M01 | 10_Privacy/02_security_boundaries/mod_threat | F16.S03.M01 | F06.S01.M02, F10.S02.M02 | CTR-CAP-001 |
| F10.S02.M02 | 10_Privacy/02_security_boundaries/mod_model | F10.S02.M01, F16.S02.M01 | F10.S02.M03 | CTR-CAP-001 |
| F10.S02.M03 | 10_Privacy/02_security_boundaries/mod_metadata | F10.S02.M02, F15.S02.M02 | F06.S02.M02, F07.S02.M02, F12.S03.M02 | CTR-PRV-001 |
| F11.S01.M01 | 11_Federation/01_protocol/mod_portable | F07.S02.M01, F15.S02.M03 | F11.S01.M02, F11.S01.M03, F11.S03.M03 | CTR-FED-001, CTR-SCH-001 |
| F11.S01.M02 | 11_Federation/01_protocol/mod_records | F11.S01.M01, F11.S01.M03, F15.S02.M03 | F11.S02.M01, F11.S02.M03 | CTR-FED-001, CTR-SCH-001 |
| F11.S01.M03 | 11_Federation/01_protocol/mod_signatures | F11.S01.M01, F16.S02.M03 | F11.S01.M02, F11.S02.M02 | CTR-FED-001, CTR-CAP-001 |
| F11.S02.M01 | 11_Federation/02_relay_sync/mod_delivery | F11.S01.M02, F15.S02.M01 | F11.S02.M02 | CTR-FED-001, CTR-EVT-001 |
| F11.S02.M02 | 11_Federation/02_relay_sync/mod_dedup | F11.S01.M03, F11.S02.M01 | F11.S02.M03 | CTR-FED-001, CTR-ID-001 |
| F11.S02.M03 | 11_Federation/02_relay_sync/mod_conflicts | F11.S01.M02, F11.S02.M02 | F11.S03.M03 | CTR-FED-001, CTR-SCH-001 |
| F11.S03.M01 | 11_Federation/03_interop/mod_trust | F07.S03.M01, F16.S02.M03 | F11.S03.M02 | CTR-FED-001, CTR-CAP-001 |
| F11.S03.M02 | 11_Federation/03_interop/mod_blocklists | F11.S03.M01, F12.S02.M03 | none | CTR-FED-001 |
| F11.S03.M03 | 11_Federation/03_interop/mod_migration | F11.S01.M01, F11.S02.M03, F15.S03.M03 | none | CTR-FED-001, CTR-SCH-001 |
| F12.S01.M01 | 12_Moderation/01_reporting/mod_flags | F07.S01.M02, F16.S01.M01 | F03.S02.M03, F08.S01.M02, F12.S01.M02, F12.S02.M01, F12.S02.M03 | CTR-CAP-001, CTR-ERR-001 |
| F12.S01.M02 | 12_Moderation/01_reporting/mod_evidence | F12.S01.M01, F16.S02.M03 | F05.S02.M03, F07.S03.M02, F09.S02.M02, F12.S01.M03 | CTR-PRV-001, CTR-SCH-001 |
| F12.S01.M03 | 12_Moderation/01_reporting/mod_appeals | F12.S01.M02, F12.S02.M01, F18.S02.M02 | F09.S02.M02 | CTR-CAP-001, CTR-ERR-001 |
| F12.S02.M01 | 12_Moderation/02_policy/mod_enforcement | F07.S01.M01, F12.S01.M01 | F01.S01.M03, F12.S01.M03, F18.S01.M02, F18.S02.M02 | CTR-CAP-001, CTR-EVT-001 |
| F12.S02.M02 | 12_Moderation/02_policy/mod_spam | F12.S03.M02, F12.S03.M03 | F01.S02.M03, F12.S02.M03 | CTR-ERR-001 |
| F12.S02.M03 | 12_Moderation/02_policy/mod_abuse | F12.S01.M01, F12.S02.M02 | F02.S01.M01, F06.S02.M03, F08.S01.M03, F08.S03.M01, F11.S03.M02 | CTR-PRV-001, CTR-EVT-001 |
| F12.S03.M01 | 12_Moderation/03_antifraud/mod_risk | F12.S03.M02, F12.S03.M04 | F04.S02.M03, F09.S01.M01 | CTR-PRV-001, CTR-COM-001 |
| F12.S03.M02 | 12_Moderation/03_antifraud/mod_signals | F10.S02.M03, F15.S03.M01 | F04.S02.M01, F07.S03.M01, F12.S02.M02, F12.S03.M01, F12.S03.M03 | CTR-PRV-001, CTR-EVT-001 |
| F12.S03.M03 | 12_Moderation/03_antifraud/mod_rate | F12.S03.M02, F15.S02.M02 | F06.S03.M02, F12.S02.M02, F12.S03.M04 | CTR-ERR-001 |
| F12.S03.M04 | 12_Moderation/03_antifraud/mod_limits | F12.S03.M03, F18.S01.M01 | F01.S01.M01, F12.S03.M01 | CTR-SCH-001, CTR-ERR-001 |
| F13.S01.M01 | 13_Notifications/01_delivery/mod_push | F07.S01.M02, F13.S02.M03 | F13.S01.M03 | CTR-EVT-001, CTR-PRV-001 |
| F13.S01.M02 | 13_Notifications/01_delivery/mod_email | F07.S01.M01, F13.S02.M03 | F07.S01.M03 | CTR-EVT-001, CTR-PRV-001 |
| F13.S01.M03 | 13_Notifications/01_delivery/mod_inapp | F13.S01.M01, F13.S02.M04 | F08.S03.M03 | CTR-EVT-001 |
| F13.S02.M01 | 13_Notifications/02_preferences/mod_quiet | F13.S02.M02 | F13.S02.M03 | CTR-PRV-001 |
| F13.S02.M02 | 13_Notifications/02_preferences/mod_hours | F07.S02.M02, F10.S01.M01 | F13.S02.M01, F13.S02.M04 | CTR-PRV-001, CTR-SCH-001 |
| F13.S02.M03 | 13_Notifications/02_preferences/mod_opt | F10.S01.M01, F13.S02.M01 | F13.S01.M01, F13.S01.M02, F13.S02.M04 | CTR-CAP-001, CTR-PRV-001 |
| F13.S02.M04 | 13_Notifications/02_preferences/mod_in | F13.S02.M02, F13.S02.M03 | F13.S01.M03 | CTR-EVT-001 |
| F14.S01.M01 | 14_Accessibility/01_a11y/mod_keyboard | F14.S01.M03 | F14.S01.M02 | CTR-ERR-001 |
| F14.S01.M02 | 14_Accessibility/01_a11y/mod_screenreader | F14.S01.M01, F14.S01.M03 | none | CTR-ERR-001 |
| F14.S01.M03 | 14_Accessibility/01_a11y/mod_wcag | F17.S01.M04 | F14.S01.M01, F14.S01.M02 | CTR-ERR-001 |
| F14.S02.M01 | 14_Accessibility/02_internationalization/mod_languages | F07.S02.M02 | F06.S01.M03, F14.S02.M02 | CTR-ERR-001, CTR-SCH-001 |
| F14.S02.M02 | 14_Accessibility/02_internationalization/mod_currencies | F09.S03.M03, F14.S02.M01 | F01.S02.M01, F09.S03.M01 | CTR-SCH-001, CTR-ERR-001 |
| F15.S01.M01 | 15_Platform/01_pwa/mod_offline | F15.S01.M02, F15.S02.M03 | F01.S03.M01, F03.S01.M02, F05.S01.M01 | CTR-SCH-001, CTR-EVT-001 |
| F15.S01.M02 | 15_Platform/01_pwa/mod_cache | F15.S02.M03, F16.S01.M02 | F15.S01.M01, F15.S01.M03, F15.S02.M02, F17.S02.M03 | CTR-PRV-001 |
| F15.S01.M03 | 15_Platform/01_pwa/mod_install | F15.S01.M02, F17.S03.M01 | none | CTR-ERR-001 |
| F15.S02.M01 | 15_Platform/02_backend/mod_relays | F15.S02.M02, F16.S01.M02 | F01.S01.M03, F11.S02.M01, F17.S03.M03 | CTR-FED-001, CTR-EVT-001 |
| F15.S02.M02 | 15_Platform/02_backend/mod_api | F15.S01.M02, F16.S01.M01 | F07.S01.M02, F09.S03.M02, F09.S03.M03, F10.S02.M03, F12.S03.M03, F15.S02.M01, F15.S03.M01, F15.S04.M01, F15.S04.M02, F17.S01.M03, F17.S02.M01 | CTR-ID-001, CTR-ERR-001, CTR-SCH-001, CTR-CAP-001 |
| F15.S02.M03 | 15_Platform/02_backend/mod_storage | F16.S02.M02 | F02.S02.M03, F06.S01.M01, F08.S01.M03, F10.S01.M01, F10.S01.M02, F10.S01.M04, F11.S01.M01, F11.S01.M02, F15.S01.M01, F15.S01.M02, F15.S03.M02, F15.S04.M03, F16.S01.M02 | CTR-SCH-001, CTR-PRV-001 |
| F15.S03.M01 | 15_Platform/03_operations/mod_observability | F15.S02.M02 | F02.S02.M02, F04.S02.M02, F12.S03.M02, F16.S03.M02 | CTR-EVT-001, CTR-ERR-001 |
| F15.S03.M02 | 15_Platform/03_operations/mod_backups | F15.S02.M03, F16.S02.M02 | F09.S02.M03, F10.S01.M02, F10.S01.M04, F15.S03.M03, F16.S03.M03 | CTR-PRV-001, CTR-SCH-001 |
| F15.S03.M03 | 15_Platform/03_operations/mod_recovery | F15.S03.M02, F16.S03.M03 | F02.S03.M04, F11.S03.M03, F17.S02.M02 | CTR-EVT-001, CTR-ERR-001 |
| F15.S04.M01 | 15_Platform/04_configuration/mod_feature | F15.S02.M02, F15.S04.M02 | none | CTR-SCH-001 |
| F15.S04.M02 | 15_Platform/04_configuration/mod_flags | F15.S02.M02, F15.S04.M03 | F15.S04.M01 | CTR-SCH-001, CTR-CAP-001 |
| F15.S04.M03 | 15_Platform/04_configuration/mod_tenants | F15.S02.M03, F16.S01.M01 | F15.S04.M02, F18.S01.M01 | CTR-CAP-001, CTR-ID-001 |
| F16.S01.M01 | 16_Security/01_authz/mod_authorization | F07.S01.M01, F16.S02.M01 | F01.S01.M01, F01.S01.M02, F02.S01.M01, F08.S02.M02, F10.S01.M01, F12.S01.M01, F15.S02.M02, F15.S04.M03 | CTR-CAP-001, CTR-ERR-001 |
| F16.S01.M02 | 16_Security/01_authz/mod_secrets | F15.S02.M03, F16.S02.M02 | F07.S01.M02, F09.S01.M01, F15.S01.M02, F15.S02.M01 | CTR-PRV-001, CTR-CAP-001 |
| F16.S02.M01 | 16_Security/02_cryptography/mod_key | F16.S02.M02 | F07.S01.M01, F08.S01.M01, F10.S02.M02, F16.S01.M01, F16.S02.M03 | CTR-SCH-001, CTR-CAP-001 |
| F16.S02.M02 | 16_Security/02_cryptography/mod_management | none | F09.S01.M03, F15.S02.M03, F15.S03.M02, F16.S01.M02, F16.S02.M01 | CTR-SCH-001 |
| F16.S02.M03 | 16_Security/02_cryptography/mod_signatures | F16.S02.M01 | F07.S02.M01, F07.S03.M02, F09.S02.M01, F11.S01.M03, F11.S03.M01, F12.S01.M02, F16.S03.M01 | CTR-SCH-001, CTR-EVT-001 |
| F16.S03.M01 | 16_Security/03_assurance/mod_threats | F16.S02.M03 | F10.S02.M01, F16.S03.M02 | CTR-CAP-001 |
| F16.S03.M02 | 16_Security/03_assurance/mod_incident | F15.S03.M01, F16.S03.M01 | F07.S01.M03, F16.S03.M03 | CTR-EVT-001, CTR-ERR-001 |
| F16.S03.M03 | 16_Security/03_assurance/mod_response | F15.S03.M02, F16.S03.M02 | F15.S03.M03 | CTR-EVT-001, CTR-ERR-001 |
| F17.S01.M01 | 17_Quality/01_testing/mod_unit | none | F17.S01.M02 | CTR-ERR-001 |
| F17.S01.M02 | 17_Quality/01_testing/mod_property | F17.S01.M01 | F17.S01.M03 | CTR-ID-001 |
| F17.S01.M03 | 17_Quality/01_testing/mod_integration | F15.S02.M02, F17.S01.M02 | F17.S01.M04 | CTR-EVT-001, CTR-CAP-001 |
| F17.S01.M04 | 17_Quality/01_testing/mod_e2e | F17.S01.M03 | F14.S01.M03, F17.S02.M01, F17.S03.M01 | CTR-ERR-001 |
| F17.S02.M01 | 17_Quality/02_performance/mod_load | F15.S02.M02, F17.S01.M04 | F17.S02.M02, F17.S03.M01 | CTR-ERR-001 |
| F17.S02.M02 | 17_Quality/02_performance/mod_chaos | F15.S03.M03, F17.S02.M01 | F17.S02.M03 | CTR-EVT-001 |
| F17.S02.M03 | 17_Quality/02_performance/mod_offline | F15.S01.M02, F17.S02.M02 | F17.S03.M02 | CTR-PRV-001 |
| F17.S03.M01 | 17_Quality/03_release/mod_ci | F17.S01.M04, F17.S02.M01 | F15.S01.M03, F17.S03.M02 | CTR-ERR-001 |
| F17.S03.M02 | 17_Quality/03_release/mod_gates | F17.S02.M03, F17.S03.M01 | F17.S03.M03 | CTR-ERR-001 |
| F17.S03.M03 | 17_Quality/03_release/mod_compatibility | F15.S02.M01, F17.S03.M02 | none | CTR-SCH-001, CTR-FED-001 |
| F18.S01.M01 | 18_Governance/01_policy/mod_jurisdictions | F15.S04.M03 | F12.S03.M04, F18.S01.M02, F18.S02.M01 | CTR-PRV-001, CTR-SCH-001 |
| F18.S01.M02 | 18_Governance/01_policy/mod_prohibited | F12.S02.M01, F18.S01.M01 | F18.S01.M03 | CTR-CAP-001, CTR-ERR-001 |
| F18.S01.M03 | 18_Governance/01_policy/mod_goods | F01.S02.M01, F18.S01.M02 | none | CTR-SCH-001 |
| F18.S02.M01 | 18_Governance/02_community/mod_governance | F07.S03.M01, F18.S01.M01 | F18.S02.M02 | CTR-CAP-001 |
| F18.S02.M02 | 18_Governance/02_community/mod_transparency | F12.S02.M01, F18.S02.M01 | F12.S01.M03 | CTR-EVT-001, CTR-PRV-001 |

## Cycle check

Method: module-ID graph built from the Depends on column (148 nodes). A mutual pair is A depends on B and B depends on A.

### Module mutual pairs: 0

None.

### Longer cycles (strongly connected components of size > 1): 0

None.

### Feature-level mutual pairs (informational): 10

F01 <-> F06, F01 <-> F08, F07 <-> F10, F07 <-> F12, F07 <-> F13, F07 <-> F16, F09 <-> F14, F12 <-> F18, F15 <-> F16, F15 <-> F17
