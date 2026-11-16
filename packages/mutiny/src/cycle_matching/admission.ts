import { canonicalJson } from '@classrup/kernel';
import type { Feasibility, Proposal } from '../trade_proposals/index.ts';
import { publicListingSchema, tombstoneSchema, type PublicListingProjection } from '@classrup/discovery';
import { verifyEnvelope, type VerifiedEnvelope } from '@classrup/federation';
import type { MatchEdge } from './index.ts';

/** Narrow alpha contract: explicitly request one published item while offering one own item. */
export const WANT_TYPE = 'classrup.alpha.want/v1';
export interface Want {
  readonly offeringListingCid: string;
  readonly requestedListingCid: string;
  readonly expiresAt: string;
}
export interface AdmissionOptions {
  readonly now: number;
  readonly localPrincipal: string;
  readonly optedIn: boolean;
  readonly blockedOwners?: readonly string[];
  /** Untrusted/new counterparties require an explicit local choice. */
  readonly includeUnknownIdentities?: boolean;
  readonly knownOwners?: readonly string[];
  readonly maxDistanceBucket?: number;
}
export interface AdmittedGraph {
  readonly edges: readonly MatchEdge[];
  readonly rejected: number;
  readonly oldestProjectionAt: number | null;
  readonly trust: 'explicitly-including-unknown' | 'known-owners-only';
}
export function parseWant(input: unknown): Want {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('Invalid want');
  const p = input as Record<string, unknown>;
  if (Object.keys(p).sort().join(',') !== 'expiresAt,offeringListingCid,requestedListingCid') throw new TypeError('Invalid want fields');
  if (typeof p.offeringListingCid !== 'string' || p.offeringListingCid.length < 1 || p.offeringListingCid.length > 200 || typeof p.requestedListingCid !== 'string' || p.requestedListingCid.length < 1 || p.requestedListingCid.length > 200 || p.offeringListingCid === p.requestedListingCid) throw new TypeError('Invalid want references');
  if (typeof p.expiresAt !== 'string' || !Number.isFinite(Date.parse(p.expiresAt)) || new Date(p.expiresAt).toISOString() !== p.expiresAt) throw new TypeError('Invalid want expiry');
  return { offeringListingCid: p.offeringListingCid, requestedListingCid: p.requestedListingCid, expiresAt: p.expiresAt };
}
/**
 * Re-verifies all signed input, excludes forks/tombstones/stale claims, and constructs exact-item wants.
 * The caller supplies its complete retained projection set (not only search hits). This does not establish global freshness.
 * Geographic admission is deliberately conservative: same L2 cell = bucket 0; same L1 only = bucket 4.
 */
export async function admitSignedGraph(listingStatements: readonly unknown[], wantStatements: readonly unknown[], options: AdmissionOptions): Promise<AdmittedGraph> {
  if (!Number.isSafeInteger(options.now) || options.now < 0 || !options.localPrincipal || options.optedIn !== true) throw new TypeError('MUTINY_MATCHING_NOT_ENABLED');
  if (listingStatements.length > 4000 || wantStatements.length > 20000) throw new RangeError('MUTINY_GRAPH_TOO_LARGE');
  const maxDistance = options.maxDistanceBucket ?? 4;
  if (!Number.isInteger(maxDistance) || maxDistance < 0 || maxDistance > 4) throw new TypeError('Invalid distance limit');
  const blocked = new Set(options.blockedOwners ?? []);
  const known = new Set([options.localPrincipal, ...(options.knownOwners ?? [])]);
  const listings = new Map<string, { envelope: VerifiedEnvelope; projection: PublicListingProjection }>();
  const latest = new Map<string, { revision: number; cid: string; conflicted: boolean }>();
  const tombstones: VerifiedEnvelope[] = [];
  const revisionCids = new Map<string, string>();
  const forkedListings = new Set<string>();
  let rejected = 0;
  for (const input of listingStatements) {
    const envelope = await verifyEnvelope(input, { now: options.now });
    if (envelope.type === 'classrup.alpha.tombstone/v1') { tombstones.push(envelope); continue; }
    if (envelope.type !== 'classrup.bazaar.listing/v1') throw new TypeError('Unsupported listing statement');
    const projection = publicListingSchema.parse(envelope.payload);
    if (projection.ownerId !== envelope.author) throw new TypeError('Unauthorized listing author');
    const key = JSON.stringify([projection.ownerId, projection.listingId]);
    const revisionKey = JSON.stringify([key, projection.revision]);
    const seenCid = revisionCids.get(revisionKey);
    if (seenCid !== undefined && seenCid !== envelope.cid) forkedListings.add(key);
    revisionCids.set(revisionKey, envelope.cid);
    const previous = latest.get(key);
    if (!previous || projection.revision > previous.revision) latest.set(key, { revision: projection.revision, cid: envelope.cid, conflicted: previous?.conflicted ?? false });
    else if (projection.revision === previous.revision && previous.cid !== envelope.cid) latest.set(key, { ...previous, conflicted: true });
    listings.set(envelope.cid, { envelope, projection });
  }
  const removed = new Map<string, number>();
  for (const envelope of tombstones) {
    const payload = tombstoneSchema.parse(envelope.payload);
    const target = listings.get(payload.target);
    if (payload.ownerId !== envelope.author || (target && (target.envelope.author !== envelope.author || target.projection.listingId !== payload.listingId))) throw new TypeError('Unauthorized tombstone');
    const key = JSON.stringify([payload.ownerId, payload.listingId]);
    removed.set(key, Math.max(removed.get(key) ?? 0, payload.revision));
  }
  function usable(record: { envelope: VerifiedEnvelope; projection: PublicListingProjection }): boolean {
    const { envelope, projection: p } = record;
    const key = JSON.stringify([p.ownerId, p.listingId]);
    const head = latest.get(key)!;
    const age = options.now - Date.parse(envelope.createdAt);
    return !forkedListings.has(key) && !head.conflicted && head.cid === envelope.cid && p.revision > (removed.get(key) ?? 0) && age >= 0 && age <= 30 * 86400000
      && Date.parse(p.expiresAt) > options.now && p.barterOptIn && p.availability === 'available' && p.kind !== 'wanted' && p.value !== undefined
      && !blocked.has(p.ownerId) && (options.includeUnknownIdentities === true || known.has(p.ownerId));
  }
  const edges = new Map<string, MatchEdge>();
  const wants = new Set<string>();
  let oldestProjectionAt: number | null = null;
  for (const input of wantStatements) {
    const envelope = await verifyEnvelope(input, { expectedType: WANT_TYPE, now: options.now });
    if (wants.has(envelope.cid)) continue;
    wants.add(envelope.cid);
    const want = parseWant(envelope.payload);
    const offered = listings.get(want.offeringListingCid);
    const requested = listings.get(want.requestedListingCid);
    const createdAt = Date.parse(envelope.createdAt);
    if (!offered || !requested || offered.envelope.author !== envelope.author) throw new TypeError('Want references missing or unauthorized offered listing');
    if (!usable(offered) || !usable(requested) || requested.envelope.author === envelope.author || options.now - createdAt < 15 * 60000 || options.now - createdAt > 30 * 86400000 || Date.parse(want.expiresAt) <= options.now) { rejected++; continue; }
    const giver = requested.projection;
    const receiver = offered.projection;
    // Coarse partitioning only. No exact location is accepted or inferred.
    if (giver.regionCell.slice(0, 4) !== receiver.regionCell.slice(0, 4) || giver.value!.currency !== receiver.value!.currency) { rejected++; continue; }
    const distanceBucket = giver.regionCell.length === 5 && giver.regionCell === receiver.regionCell ? 0 : 4;
    if (distanceBucket > maxDistance) { rejected++; continue; }
    const edge: MatchEdge = { giverId: giver.ownerId, receiverId: receiver.ownerId, inventoryItemId: giver.listingId, listingCid: requested.envelope.cid, wantCid: envelope.cid, receiverOfferingListingCid: offered.envelope.cid, valueMinor: giver.value!.amount, currency: giver.value!.currency, distanceBucket, wantCreatedAt: createdAt };
    const key = JSON.stringify([edge.giverId, edge.receiverId]);
    const existing = edges.get(key);
    // The canonical engine permits one edge per ordered pair; choose lexicographically, independent of delivery order.
    if (!existing || JSON.stringify([edge.listingCid, edge.wantCid]) < JSON.stringify([existing.listingCid, existing.wantCid])) edges.set(key, edge);
    const age = Math.min(createdAt, Date.parse(offered.envelope.createdAt), Date.parse(requested.envelope.createdAt));
    oldestProjectionAt = oldestProjectionAt === null ? age : Math.min(oldestProjectionAt, age);
  }
  return { edges: [...edges.values()], rejected, oldestProjectionAt, trust: options.includeUnknownIdentities === true ? 'explicitly-including-unknown' : 'known-owners-only' };
}

/** Recheck every exact directed leg against currently retained signed projections before any local verdict. */
export async function recheckProposal(proposal: Proposal, listingStatements: readonly unknown[], wantStatements: readonly unknown[], options: AdmissionOptions): Promise<Feasibility> {
  const graph = await admitSignedGraph(listingStatements, wantStatements, options);
  const admitted = new Set(graph.edges.map(leg => canonicalJson(leg)));
  return { revisionHash: proposal.revisionHash, checkedAt: options.now, feasible: proposal.snapshot.legs.every(leg => admitted.has(canonicalJson(leg))) };
}
