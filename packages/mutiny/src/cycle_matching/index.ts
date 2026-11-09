import { canonicalJson } from '@classrup/kernel';

/** Inputs must already have passed signed projection admission. This pure engine does not verify signatures. */
export interface MatchEdge {
  readonly giverId: string;
  readonly receiverId: string;
  readonly inventoryItemId: string;
  readonly listingCid: string;
  readonly wantCid: string;
  readonly receiverOfferingListingCid?: string;
  readonly valueMinor: string;
  readonly currency: string;
  readonly distanceBucket: number;
  readonly wantCreatedAt: number;
}
export interface MatchOptions {
  readonly now: number;
  readonly localPrincipal?: string;
  readonly lmax?: number;
  readonly expansionBudget?: number;
  readonly timeBudgetMs?: number;
  readonly maxSuggestions?: number;
  /** A monotonic clock. Injection permits deterministic count-budget tests. */
  readonly monotonicNow?: () => number;
}
export interface CycleScore {
  readonly participants: number;
  readonly imbalancePermille: number;
  readonly maxDistanceBucket: number;
  readonly oldestWantAgeDays: number;
}
export interface CycleSuggestion {
  readonly cycleKey: string;
  readonly legs: readonly MatchEdge[];
  readonly score: CycleScore;
}
export interface MatchResult {
  readonly suggestions: readonly CycleSuggestion[];
  readonly inputHash: string;
  readonly stats: {
    readonly nodes: number;
    readonly edges: number;
    readonly expansions: number;
    readonly durationMs: number;
    readonly cyclesFound: number;
    readonly truncated: 'none' | 'expansions' | 'time' | 'results';
  };
}
const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
const id = (s: string): boolean => typeof s === 'string' && s.length > 0 && s.length <= 512;
function integer(value: number, minimum: number, maximum: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) throw new TypeError(`Invalid ${name}`);
}
function validateEdge(e: MatchEdge, now: number): void {
  if (![e.giverId, e.receiverId, e.inventoryItemId, e.listingCid, e.wantCid].every(id) || e.giverId === e.receiverId) throw new TypeError('Invalid edge identity');
  if (typeof e.valueMinor !== 'string' || !/^(0|[1-9][0-9]{0,29})$/.test(e.valueMinor) || !/^[A-Z]{3}$/.test(e.currency)) throw new TypeError('Invalid edge money');
  integer(e.distanceBucket, 0, 4, 'distance bucket');
  integer(e.wantCreatedAt, 0, now, 'want timestamp');
}
function ringKeyInput(legs: readonly MatchEdge[]): string {
  return canonicalJson(legs);
}
export function canonicalRing(legs: readonly MatchEdge[]): readonly MatchEdge[] {
  integer(legs.length, 2, 8, 'ring length');
  let first = 0;
  const parties = new Set<string>();
  const items = new Set<string>();
  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i]!;
    validateEdge(leg, Number.MAX_SAFE_INTEGER);
    if (!id(leg.giverId) || !id(leg.inventoryItemId) || leg.receiverId !== legs[(i + 1) % legs.length]!.giverId || parties.has(leg.giverId) || items.has(leg.inventoryItemId)) throw new TypeError('Invalid elementary directed ring');
    if (leg.receiverOfferingListingCid !== undefined && leg.receiverOfferingListingCid !== legs[(i + 1) % legs.length]!.listingCid) throw new TypeError('Want offer does not match next leg');
    parties.add(leg.giverId); items.add(leg.inventoryItemId);
    if (compare(leg.giverId, legs[first]!.giverId) < 0) first = i;
  }
  return [...legs.slice(first), ...legs.slice(0, first)].map((leg) => ({ ...leg }));
}
async function digest(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
/** Rotation invariant, direction sensitive; references bind exactly the item/want projections in the ring. */
export function cycleKey(legs: readonly MatchEdge[]): Promise<string> {
  return digest(ringKeyInput(canonicalRing(legs)));
}
function score(legs: readonly MatchEdge[], now: number): CycleScore {
  let imbalance = 0n;
  for (let i = 0; i < legs.length; i++) {
    const outgoing = BigInt(legs[i]!.valueMinor);
    const incoming = BigInt(legs[(i + legs.length - 1) % legs.length]!.valueMinor);
    const max = outgoing > incoming ? outgoing : incoming;
    const difference = outgoing > incoming ? outgoing - incoming : incoming - outgoing;
    const gap = max === 0n ? 0n : (difference * 1000n + max - 1n) / max;
    if (gap > imbalance) imbalance = gap;
  }
  return { participants: legs.length, imbalancePermille: Number(imbalance), maxDistanceBucket: Math.max(...legs.map((e) => e.distanceBucket)), oldestWantAgeDays: Math.floor((now - Math.min(...legs.map((e) => e.wantCreatedAt))) / 86400000) };
}
/** Enumerate a deterministic prefix, rank it, then greedily select disjoint cycles. Timing truncation is machine-dependent. */
export async function discoverCycles(input: readonly MatchEdge[], options: MatchOptions): Promise<MatchResult> {
  const { now, localPrincipal } = options;
  integer(now, 0, Number.MAX_SAFE_INTEGER, 'now');
  const lmax = options.lmax ?? 5;
  const expansionBudget = options.expansionBudget ?? 100000;
  const timeBudgetMs = options.timeBudgetMs ?? 250;
  const maxSuggestions = options.maxSuggestions ?? 500;
  integer(lmax, 2, 8, 'lmax'); integer(expansionBudget, 1, 100000, 'expansion budget');
  integer(timeBudgetMs, 1, 250, 'time budget'); integer(maxSuggestions, 1, 500, 'suggestion limit');
  if (localPrincipal !== undefined && !id(localPrincipal)) throw new TypeError('Invalid local principal');
  if (input.length > 20000) throw new RangeError('MUTINY_GRAPH_TOO_LARGE');
  const edges = input.map((edge) => { validateEdge(edge, now); return { ...edge }; });
  edges.sort((a, b) => compare(a.giverId, b.giverId) || compare(a.receiverId, b.receiverId));
  const nodes = [...new Set(edges.flatMap((e) => [e.giverId, e.receiverId]))].sort(compare);
  if (nodes.length > 2000) throw new RangeError('MUTINY_GRAPH_TOO_LARGE');
  const adjacency = new Map<string, MatchEdge[]>();
  for (let i = 0; i < edges.length; i++) {
    const e = edges[i]!;
    const previous = edges[i - 1];
    if (previous?.giverId === e.giverId && previous.receiverId === e.receiverId) throw new TypeError('Duplicate directed edge');
    const outgoing = adjacency.get(e.giverId) ?? [];
    outgoing.push(e); adjacency.set(e.giverId, outgoing);
  }
  const inputHash = await digest(canonicalJson({ edges, now, localPrincipal: localPrincipal ?? null, lmax, expansionBudget, timeBudgetMs, maxSuggestions }));
  const clock = options.monotonicNow ?? (() => performance.now());
  const startTime = clock();
  if (!Number.isFinite(startTime)) throw new TypeError('Invalid monotonic clock');
  let expansions = 0;
  let cyclesFound = 0;
  let truncated: MatchResult['stats']['truncated'] = 'none';
  const candidates: { legs: readonly MatchEdge[]; score: CycleScore; orderKey: string }[] = [];
  function stopped(): boolean {
    if (truncated !== 'none') return true;
    if (clock() - startTime >= timeBudgetMs) { truncated = 'time'; return true; }
    if (expansions >= expansionBudget) { truncated = 'expansions'; return true; }
    return false;
  }
  for (const start of nodes) {
    if (stopped()) break;
    const seen = new Set([start]);
    const items = new Set<string>();
    const path: MatchEdge[] = [];
    function visit(node: string): void {
      for (const edge of adjacency.get(node) ?? []) {
        if (stopped()) return;
        expansions++;
        if (compare(edge.receiverId, start) < 0 || items.has(edge.inventoryItemId)) continue;
        if (path.length > 0 && edge.currency !== path[0]!.currency) continue;
        if (edge.receiverId === start) {
          if (path.length === 0) continue;
          const ring = [...path, edge];
          cyclesFound++;
          if (ring.some((leg, i) => leg.receiverOfferingListingCid !== undefined && leg.receiverOfferingListingCid !== ring[(i + 1) % ring.length]!.listingCid)) continue;
          if (localPrincipal !== undefined && !seen.has(localPrincipal)) continue;
          candidates.push({ legs: ring, score: score(ring, now), orderKey: ringKeyInput(ring) });
          // Bound retained candidates and post-search hashing, not only final selected output.
          if (candidates.length >= 500) { truncated = 'results'; return; }
        } else if (path.length + 1 < lmax && !seen.has(edge.receiverId)) {
          seen.add(edge.receiverId); items.add(edge.inventoryItemId); path.push(edge);
          visit(edge.receiverId);
          path.pop(); items.delete(edge.inventoryItemId); seen.delete(edge.receiverId);
        }
      }
    }
    visit(start);
  }
  const durationMs = Math.max(0, clock() - startTime);
  // Hash only bounded candidates after enumeration. No unbounded graph traversal or async gaps inside the budgeted search.
  const hashed = await Promise.all(candidates.map(async (candidate) => ({ legs: candidate.legs, score: candidate.score, cycleKey: await digest(candidate.orderKey) })));
  hashed.sort((a, b) => b.score.participants - a.score.participants || Math.ceil(a.score.imbalancePermille / 10) - Math.ceil(b.score.imbalancePermille / 10) || a.score.maxDistanceBucket - b.score.maxDistanceBucket || b.score.oldestWantAgeDays - a.score.oldestWantAgeDays || compare(a.cycleKey, b.cycleKey));
  const selected: CycleSuggestion[] = [];
  const usedParties = new Set<string>();
  const usedItems = new Set<string>();
  for (const candidate of hashed) {
    if (candidate.legs.some((leg) => usedParties.has(leg.giverId) || usedItems.has(leg.inventoryItemId))) continue;
    selected.push(candidate);
    for (const leg of candidate.legs) { usedParties.add(leg.giverId); usedItems.add(leg.inventoryItemId); }
    if (selected.length === maxSuggestions) break;
  }
  return { suggestions: selected, inputHash, stats: { nodes: nodes.length, edges: edges.length, expansions, durationMs, cyclesFound, truncated } };
}
