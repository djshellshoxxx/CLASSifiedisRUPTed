/**
 * Default feature-flag catalog (F15.S04.M02). Exported as data so the relay can extend or reconcile it
 * with flag names used by other packages (`FlagService.define`).
 */
import type { FlagDefinition } from './flags';

const on = (key: string, description: string, dependsOn: readonly string[] = []): FlagDefinition => ({
  key,
  description,
  default: true,
  dependsOn,
  killSwitch: false,
});

/** Optional, opt-in modules ship disabled until a tenant enables them. */
const optIn = (key: string, description: string, dependsOn: readonly string[] = []): FlagDefinition => ({ ...on(key, description, dependsOn), default: false });

export const DEFAULT_FLAGS: readonly FlagDefinition[] = Object.freeze([
  on('bazaar.listings', 'Create, edit and publish listings'),
  on('bazaar.listing_types', 'Sell, wanted, giveaway and barter listing kinds', ['bazaar.listings']),
  on('bazaar.inventory', 'Quantity, availability and reservations', ['bazaar.listings']),
  on('bazaar.pricing', 'Prices, offers and currency handling', ['bazaar.listings']),
  on('bazaar.promotion', 'Paid listing promotion', ['bazaar.pricing', 'commerce.payments']),
  on('mutiny.trade_proposals', 'Two-party barter proposals with consent'),
  on('mutiny.cycle_matching', 'Multi-party cycle discovery', ['mutiny.trade_proposals']),
  on('mutiny.cycle_execution', 'Cycle consent, locking and execution', ['mutiny.cycle_matching']),
  on('mutiny.value_balancing', 'Cross-currency value differences', ['mutiny.trade_proposals']),
  on('services.catalog', 'Service offerings'),
  on('services.booking', 'Service quotes and bookings', ['services.catalog']),
  on('auctions.lifecycle', 'Auction creation and bidding'),
  on('auctions.integrity', 'Auction integrity flags and shill detection', ['auctions.lifecycle']),
  on('rentals.catalog', 'Rental items'),
  on('rentals.lifecycle', 'Rental bookings, handoff and return', ['rentals.catalog']),
  on('discovery.search', 'Search and saved queries'),
  on('discovery.geoprivacy', 'Coarse regional discovery'),
  on('discovery.ranking', 'Result ranking', ['discovery.search']),
  on('identity.accounts', 'Pseudonymous accounts and sessions'),
  on('identity.profiles', 'Public profiles', ['identity.accounts']),
  on('identity.trust', 'Reputation and trust evidence', ['identity.accounts']),
  on('comms.messaging', 'End-to-end encrypted messaging'),
  on('comms.negotiation', 'Offer and counter-offer negotiation', ['comms.messaging']),
  on('comms.meetups', 'Meetup coordination and safe spots', ['comms.messaging']),
  on('commerce.payments', 'Payment claims (non-custodial)'),
  on('commerce.settlement', 'Settlement verification and disputes', ['commerce.payments']),
  on('commerce.valuation', 'FX quotes and valuation'),
  on('privacy.data_controls', 'Consent, export and deletion'),
  optIn('federation.protocol', 'Signed federation envelopes and peer trust'),
  optIn('federation.relay_sync', 'Relay-to-relay record sync', ['federation.protocol']),
  optIn('federation.interop', 'External protocol interoperability', ['federation.protocol']),
  on('moderation.reporting', 'Reports and cases'),
  on('moderation.policy', 'Enforcement and appeals', ['moderation.reporting']),
  on('moderation.antifraud', 'Risk signals and rate limits'),
  on('notifications.delivery', 'Notification delivery'),
  on('notifications.preferences', 'Notification preferences', ['notifications.delivery']),
  on('governance.policy', 'Jurisdiction rules and prohibited categories'),
  on('governance.community', 'Community proposals and transparency reports', ['governance.policy']),
  on('platform.operations', 'Observability, backups and recovery'),
  on('platform.configuration', 'Feature flags, module registry and tenants'),
  on('platform.pwa', 'Offline, cache and install support'),
  on('platform.assurance', 'Threat register, incidents and response playbooks'),
]);
