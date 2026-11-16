// F13.S01.M03 routing table: domain event -> category, template key, recipient rule, urgency, collapse key (N4).
// Payload field names are the contract with the producing modules: party DIDs are read from the named fields (string, array,
// or objects with a did, as in the parties of the N3 completion events); a row with no `to` fields addresses the local principal.
export const CATEGORIES = ['offers', 'cycles', 'messages', 'auctions', 'bookings', 'moderation', 'security'] as const;
export type NotifyCategory = (typeof CATEGORIES)[number];
export const REF_TYPES = ['listing', 'offer', 'proposal', 'cycle', 'thread', 'auction', 'booking', 'rental', 'deal', 'case', 'account'] as const;
export type RefType = (typeof REF_TYPES)[number];

export interface Route {
  readonly type: string;
  readonly category: NotifyCategory;
  /** Template key notify.tpl.<category>.<name>. */
  readonly template: string;
  /** Payload fields holding recipient DIDs; empty means the local principal (the event is already local). */
  readonly to: readonly string[];
  /** Payload field naming the acting party; an event the local principal caused never notifies them (V02). */
  readonly actor?: string;
  /** Payload field whose value is the collapse key. */
  readonly collapse: string;
  /** Payload field carrying the opaque reference id and the reference type. */
  readonly ref?: { readonly type: RefType; readonly idField: string };
  readonly urgency?: 'normal' | 'urgent';
  /** comms.message.received is muted per thread. */
  readonly muted?: 'thread';
}

const r = (type: string, category: NotifyCategory, name: string, to: readonly string[], collapse: string, extra: Partial<Route> = {}): Route => ({ type, category, template: `notify.tpl.${category}.${name}`, to, collapse, ...extra });
const offer = (idField = 'offerId'): Route['ref'] => ({ type: 'offer', idField });

export const ROUTES: readonly Route[] = [
  r('bazaar.offer.made', 'offers', 'made', ['sellerId'], 'offerListingId', { actor: 'buyerId', ref: offer() }),
  r('bazaar.offer.accepted', 'offers', 'accepted', ['buyerId'], 'offerId', { actor: 'sellerId', ref: offer() }),
  r('bazaar.offer.rejected', 'offers', 'rejected', ['buyerId'], 'offerId', { actor: 'sellerId', ref: offer() }),
  r('bazaar.offer.expired', 'offers', 'expired', ['buyerId', 'sellerId'], 'offerId', { ref: offer() }),
  r('bazaar.negotiation.countered', 'offers', 'countered', ['partyIds'], 'negotiationId', { actor: 'actorId', ref: offer() }),
  r('commerce.deal.opened', 'offers', 'deal_opened', ['counterpartyId'], 'dealId', { actor: 'openedById', ref: { type: 'deal', idField: 'dealId' } }),
  r('commerce.payment.claimed', 'offers', 'payment_claimed', ['payeeId'], 'dealId', { actor: 'payerId', ref: { type: 'deal', idField: 'dealId' } }),
  r('commerce.payment.acknowledged', 'offers', 'payment_acknowledged', ['payerId'], 'dealId', { actor: 'payeeId', ref: { type: 'deal', idField: 'dealId' } }),
  r('commerce.payment.disputed', 'offers', 'payment_disputed', ['partyIds'], 'dealId', { actor: 'actorId', ref: { type: 'deal', idField: 'dealId' } }),
  r('comms.message.received', 'messages', 'new', [], 'threadId', { actor: 'senderId', ref: { type: 'thread', idField: 'threadId' }, muted: 'thread' }),
  r('mutiny.cycle.proposed', 'cycles', 'proposed', ['participantIds'], 'cycleId', { actor: 'proposerId', ref: { type: 'cycle', idField: 'cycleId' } }),
  r('mutiny.cycle.committed', 'cycles', 'committed', ['participantIds'], 'cycleId', { ref: { type: 'cycle', idField: 'cycleId' } }),
  r('mutiny.cycle.declined', 'cycles', 'declined', ['participantIds'], 'cycleId', { actor: 'declinerId', ref: { type: 'cycle', idField: 'cycleId' } }),
  r('mutiny.cycle.participant_dropped', 'cycles', 'participant_dropped', ['remainingParticipantIds'], 'cycleId', { ref: { type: 'cycle', idField: 'cycleId' } }),
  r('mutiny.cycle.cancelled', 'cycles', 'cancelled', ['participantIds'], 'cycleId', { ref: { type: 'cycle', idField: 'cycleId' } }),
  r('mutiny.cycle.completed', 'cycles', 'completed', ['parties'], 'cycleId', { ref: { type: 'cycle', idField: 'cycleId' } }),
  r('mutiny.recovery.opened', 'cycles', 'recovery_opened', ['participantIds'], 'cycleId', { ref: { type: 'cycle', idField: 'cycleId' } }),
  r('mutiny.proposal.revised', 'cycles', 'proposal_revised', ['partyIds'], 'proposalId', { actor: 'actorId', ref: { type: 'proposal', idField: 'proposalId' } }),
  r('auctions.bid.outbid', 'auctions', 'outbid', ['outbidBidderId'], 'auctionId', { ref: { type: 'auction', idField: 'auctionId' } }),
  r('auctions.auction.won', 'auctions', 'won', ['winnerId'], 'auctionId', { ref: { type: 'auction', idField: 'auctionId' } }),
  r('auctions.auction.unsold', 'auctions', 'unsold', ['sellerId'], 'auctionId', { ref: { type: 'auction', idField: 'auctionId' } }),
  r('auctions.auction.closed', 'auctions', 'closed', ['sellerId'], 'auctionId', { ref: { type: 'auction', idField: 'auctionId' } }),
  r('auctions.result.voided', 'auctions', 'voided', ['sellerId', 'bidderIds'], 'auctionId', { ref: { type: 'auction', idField: 'auctionId' } }),
  r('services.quote.issued', 'bookings', 'quote_issued', ['requesterId'], 'quoteId', { actor: 'providerId', ref: { type: 'booking', idField: 'quoteId' } }),
  r('services.quote.accepted', 'bookings', 'quote_accepted', ['providerId'], 'quoteId', { actor: 'requesterId', ref: { type: 'booking', idField: 'quoteId' } }),
  r('services.booking.confirmed', 'bookings', 'confirmed', ['providerId', 'clientId'], 'bookingId', { ref: { type: 'booking', idField: 'bookingId' } }),
  r('services.booking.cancelled', 'bookings', 'cancelled', ['partyIds'], 'bookingId', { actor: 'actorId', ref: { type: 'booking', idField: 'bookingId' } }),
  r('services.milestone.submitted', 'bookings', 'milestone_submitted', ['clientId'], 'bookingId', { actor: 'providerId', ref: { type: 'booking', idField: 'bookingId' } }),
  r('services.milestone.approved', 'bookings', 'milestone_approved', ['providerId'], 'bookingId', { actor: 'clientId', ref: { type: 'booking', idField: 'bookingId' } }),
  r('services.dispute.opened', 'bookings', 'dispute_opened', ['partyIds'], 'bookingId', { actor: 'actorId', ref: { type: 'booking', idField: 'bookingId' } }),
  r('rentals.reservation.requested', 'bookings', 'rental_requested', ['ownerId'], 'reservationId', { actor: 'renterId', ref: { type: 'rental', idField: 'reservationId' } }),
  r('rentals.reservation.confirmed', 'bookings', 'rental_confirmed', ['renterId'], 'reservationId', { actor: 'ownerId', ref: { type: 'rental', idField: 'reservationId' } }),
  r('rentals.reservation.cancelled', 'bookings', 'rental_cancelled', ['partyIds'], 'reservationId', { actor: 'actorId', ref: { type: 'rental', idField: 'reservationId' } }),
  r('rentals.rental.overdue', 'bookings', 'rental_overdue', ['ownerId', 'renterId'], 'rentalId', { ref: { type: 'rental', idField: 'rentalId' } }),
  r('rentals.damage.claimed', 'bookings', 'damage_claimed', ['renterId'], 'rentalId', { actor: 'ownerId', ref: { type: 'rental', idField: 'rentalId' } }),
  r('comms.meetup.proposed', 'bookings', 'meetup_proposed', ['partyIds'], 'meetupId', { actor: 'proposerId', ref: { type: 'thread', idField: 'threadId' } }),
  r('comms.meetup.agreed', 'bookings', 'meetup_agreed', ['partyIds'], 'meetupId', { ref: { type: 'thread', idField: 'threadId' } }),
  r('comms.meetup.cancelled', 'bookings', 'meetup_cancelled', ['partyIds'], 'meetupId', { actor: 'actorId', ref: { type: 'thread', idField: 'threadId' } }),
  r('comms.meetup.no_show', 'bookings', 'meetup_no_show_claim', ['accusedId'], 'meetupId', { actor: 'claimantId', ref: { type: 'thread', idField: 'threadId' } }),
  r('moderation.action.applied', 'moderation', 'action_applied', ['affectedUserId'], 'actionId', { ref: { type: 'case', idField: 'actionId' } }),
  r('moderation.appeal.decided', 'moderation', 'appeal_decided', ['appellantId'], 'appealId', { ref: { type: 'case', idField: 'appealId' } }),
  r('identity.device_key.added', 'security', 'device_added', [], 'keyId', { urgency: 'urgent' }),
  r('identity.device_key.revoked', 'security', 'device_revoked', [], 'keyId', { urgency: 'urgent' }),
  r('identity.session.revoked', 'security', 'session_revoked', [], 'sessionId', { urgency: 'normal' }),
  r('identity.recovery.completed', 'security', 'recovery_completed', [], 'recoveryId', { urgency: 'urgent' }),
  r('identity.recovery.kit_created', 'security', 'recovery_kit_created', [], 'recoveryKitId', { urgency: 'normal' }),
  r('federation.account.moved', 'security', 'account_moved', [], 'moveId', { urgency: 'normal' }),
  r('privacy.export.ready', 'security', 'export_ready', [], 'exportId', { urgency: 'normal' }),
];

export const ROUTE_BY_TYPE: ReadonlyMap<string, Route> = new Map(ROUTES.map(row => [row.type, row]));
export const TEMPLATE_KEYS: ReadonlySet<string> = new Set(ROUTES.map(row => row.template));
/** The fixed list of 3 templates that may carry urgency urgent (all security). */
export const URGENT_TEMPLATES: ReadonlySet<string> = new Set(ROUTES.filter(row => row.urgency === 'urgent').map(row => row.template));
