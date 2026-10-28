/**
 * Cross-feature ports. A feature package never imports another feature package: it declares
 * what it needs through these interfaces and the relay (apps/relay) wires the owner's
 * implementation in. Owners are named per port; snapshots carry ids and public data only.
 */
import type { Actor } from './actor';
import type { FxQuote, MoneyJson } from './money';
import type { CommandContext } from './runtime';

// ---- Listings (owner F01 bazaar) -------------------------------------------------------------
export type ListingKind = 'sell' | 'wanted' | 'giveaway' | 'barter' | 'service' | 'rental' | 'auction';
export type ListingStatus = 'draft' | 'published' | 'paused' | 'reserved' | 'sold' | 'expired' | 'archived' | 'removed';

export interface ListingSnapshot {
  readonly id: string;
  readonly tenantId: string;
  readonly ownerId: string;
  readonly kind: ListingKind;
  readonly status: ListingStatus;
  readonly title: string;
  readonly category: string;
  readonly price?: MoneyJson;
  readonly acceptsBarter: boolean;
  /** Coarse public geohash cell (<= PUBLIC_CELL_PRECISION). Never exact location. */
  readonly regionCell?: string;
  readonly quantityAvailable: number;
  readonly version: number;
  readonly publishedAt?: number;
  readonly expiresAt?: number;
}

export interface ListingLookup {
  get(listingId: string): ListingSnapshot | undefined;
}

// ---- Inventory reservations (owner F01.S03.M01 availability) ----------------------------------
export type ReservationHolder = 'offer' | 'trade' | 'cycle' | 'auction' | 'rental' | 'booking' | 'order';
export type ReservationStatus = 'held' | 'committed' | 'released' | 'expired';

export interface ReservationRequest {
  readonly listingId: string;
  readonly quantity: number;
  readonly holderType: ReservationHolder;
  readonly holderId: string;
  readonly expiresAt: number;
}

export interface ReservationSnapshot extends ReservationRequest {
  readonly reservationId: string;
  readonly status: ReservationStatus;
}

/**
 * Reservations prevent double-allocation of the same item across trades/cycles/auctions.
 * reserve() throws INVENTORY.UNAVAILABLE when quantity cannot be held. All calls are idempotent
 * per (holderType, holderId, listingId).
 */
export interface InventoryPort {
  reserve(ctx: CommandContext, req: ReservationRequest): ReservationSnapshot;
  release(ctx: CommandContext, reservationId: string, reason: string): void;
  commit(ctx: CommandContext, reservationId: string): void;
  available(listingId: string): number;
}

// ---- Accounts (owner F07 identity) ------------------------------------------------------------
export type AccountStatus = 'active' | 'suspended' | 'deactivated' | 'deleted';

export interface AccountSnapshot {
  readonly id: string;
  readonly tenantId: string;
  readonly pseudonym: string;
  readonly status: AccountStatus;
  /** Active Ed25519 signing key ids (`ed25519:...`). */
  readonly signingKeyIds: readonly string[];
  /** Active X25519 encryption key ids (`x25519:...`). */
  readonly boxKeyIds: readonly string[];
  readonly createdAt: number;
}

export interface AccountLookup {
  get(accountId: string): AccountSnapshot | undefined;
}

// ---- Blocks between users (owner F12.S02.M03 abuse) ---------------------------------------------
export interface BlockPort {
  /** True if either account blocked the other. */
  isBlocked(a: string, b: string): boolean;
}

// ---- Notifications (owner F13) -----------------------------------------------------------------
export interface NotificationRequest {
  readonly tenantId: string;
  readonly recipientId: string;
  /** Topic used for preferences/opt-out, e.g. `trade.proposal`. */
  readonly topic: string;
  /** Template id; content is rendered by F13 + F14 using `data`. Never put message bodies here. */
  readonly template: string;
  readonly data: Readonly<Record<string, string | number>>;
  readonly dedupKey?: string;
  readonly priority?: 'low' | 'normal' | 'high';
}

export interface NotifyPort {
  notify(req: NotificationRequest): void;
}

// ---- Content policy (owner F18 governance: prohibited goods, jurisdictions) ---------------------
export interface ContentPolicyInput {
  readonly tenantId: string;
  readonly kind: ListingKind;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly jurisdiction?: string;
}

export interface PolicyDecision {
  readonly decision: 'allow' | 'review' | 'deny';
  readonly reasons: readonly string[];
}

export interface ContentPolicyPort {
  evaluate(input: ContentPolicyInput): PolicyDecision;
}

// ---- Risk and rate limits (owner F12.S03 antifraud) ---------------------------------------------
export interface RiskInput {
  readonly actor: Actor;
  /** Operation name, e.g. `mutiny.cycle.propose`. */
  readonly action: string;
  readonly subjectId?: string;
  readonly amount?: MoneyJson;
}

export interface RiskDecision {
  readonly decision: 'allow' | 'challenge' | 'deny';
  readonly score: number;
  readonly reasons: readonly string[];
}

export interface RiskPort {
  assess(input: RiskInput): RiskDecision;
}

export interface RateLimitPort {
  /** Consume `cost` tokens from bucket `key`; throws RATE.LIMITED (category rate_limited). */
  consume(key: string, cost?: number): void;
}

// ---- FX quotes (owner F09.S03.M02 rates) --------------------------------------------------------
export interface QuotePort {
  /** Latest unexpired quote base->quote at `now`, or undefined if none is available. */
  latest(base: string, quote: string, now: number): FxQuote | undefined;
  get(quoteId: string): FxQuote | undefined;
}

// ---- Safe defaults for tests and for running a module standalone --------------------------------
export const noBlocks: BlockPort = { isBlocked: () => false };
export const allowAllContent: ContentPolicyPort = { evaluate: () => ({ decision: 'allow', reasons: [] }) };
export const allowAllRisk: RiskPort = { assess: () => ({ decision: 'allow', score: 0, reasons: [] }) };
export const noRateLimit: RateLimitPort = { consume: () => undefined };
export class RecordingNotifier implements NotifyPort {
  readonly sent: NotificationRequest[] = [];
  notify(req: NotificationRequest): void {
    this.sent.push(req);
  }
}
