import { canonicalJson, sha256Hex } from '@classrup/kernel';
import { verifyEnvelope, type VerifiedEnvelope } from '@classrup/federation';
import { canonicalRing, type MatchEdge } from '../cycle_matching/index.ts';

export const PROPOSAL_TYPE = 'classrup.alpha.proposal_revision/v1';
export const CONSENT_TYPE = 'classrup.alpha.consent/v1';
export const RESERVATION_TYPE = 'classrup.alpha.reservation/v1';
export const WITHDRAWAL_TYPE = 'classrup.alpha.withdrawal/v1';
export interface ProposalSnapshot {
  readonly subjectId: string;
  readonly coordinatorId: string;
  readonly revisionNo: number;
  readonly previousHash: string | null;
  readonly legs: readonly MatchEdge[];
  readonly createdAt: number;
  readonly consentDeadline: number;
  readonly executionWindowMs: number;
}
export interface Proposal {
  readonly snapshot: ProposalSnapshot;
  readonly revisionHash: string;
}
export interface Evidence {
  readonly envelope: VerifiedEnvelope;
  readonly receivedAtLocal: number;
}
export interface CoordinationState {
  readonly proposal: Proposal;
  readonly status: 'proposed' | 'committed' | 'cancelled' | 'declined' | 'frozen';
  readonly reason: string | null;
  readonly evidence: readonly Evidence[];
  readonly consentCids: Readonly<Record<string, string>>;
  readonly reservationCids: Readonly<Record<string, string>>;
  readonly lastObservedAt: number;
  readonly committedLocallyAt: number | null;
  readonly commitFeasibility: Feasibility | null;
}
export interface Feasibility {
  readonly revisionHash: string;
  readonly checkedAt: number;
  readonly feasible: boolean;
}
const DAY = 86400000;
function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new TypeError('Expected object');
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key)) || keys.some((key) => !Object.hasOwn(value, key))) throw new TypeError('Unexpected or missing field');
}
function text(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 512) throw new TypeError('Invalid identifier');
  return value;
}
function integer(value: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new TypeError('Invalid integer');
  return value;
}
function edge(input: unknown): MatchEdge {
  const e = object(input);
  const base = { ...e }; delete base.receiverOfferingListingCid;
  exact(base, ['giverId', 'receiverId', 'inventoryItemId', 'listingCid', 'wantCid', 'valueMinor', 'currency', 'distanceBucket', 'wantCreatedAt']);
  const valueMinor = text(e.valueMinor);
  const currency = text(e.currency);
  if (!/^(0|[1-9][0-9]{0,29})$/.test(valueMinor) || !/^[A-Z]{3}$/.test(currency)) throw new TypeError('Invalid money');
  return { giverId: text(e.giverId), receiverId: text(e.receiverId), inventoryItemId: text(e.inventoryItemId), listingCid: text(e.listingCid), wantCid: text(e.wantCid), valueMinor, currency, distanceBucket: integer(e.distanceBucket, 0, 4), wantCreatedAt: integer(e.wantCreatedAt), ...(e.receiverOfferingListingCid === undefined ? {} : { receiverOfferingListingCid: text(e.receiverOfferingListingCid) }) };
}
/** Snapshot parsing/hashing is shared by outbound signing and inbound verification. No inventory or consent is created. */
export async function prepareProposal(input: unknown, now: number): Promise<Proposal> {
  integer(now);
  const s = object(input);
  exact(s, ['subjectId', 'coordinatorId', 'revisionNo', 'previousHash', 'legs', 'createdAt', 'consentDeadline', 'executionWindowMs']);
  if (!Array.isArray(s.legs) || s.legs.length < 2 || s.legs.length > 8) throw new TypeError('Invalid proposal legs');
  const legs = canonicalRing(s.legs.map(edge));
  const createdAt = integer(s.createdAt, 0, now);
  const consentDeadline = integer(s.consentDeadline, createdAt + 3600000, createdAt + 7 * DAY);
  const executionWindowMs = integer(s.executionWindowMs, DAY, 30 * DAY);
  if (consentDeadline + executionWindowMs - createdAt > 30 * DAY || consentDeadline <= now) throw new TypeError('Invalid proposal deadline');
  const coordinatorId = text(s.coordinatorId);
  if (!legs.some((leg) => leg.giverId === coordinatorId) || legs.some((leg) => leg.currency !== legs[0]!.currency || leg.wantCreatedAt > createdAt)) throw new TypeError('Invalid proposal participant or currency');
  const revisionNo = integer(s.revisionNo, 1, 20);
  const previousHash = s.previousHash === null ? null : text(s.previousHash);
  if ((revisionNo === 1) !== (previousHash === null)) throw new TypeError('Invalid proposal parent');
  const snapshot: ProposalSnapshot = { subjectId: text(s.subjectId), coordinatorId, revisionNo, previousHash, legs, createdAt, consentDeadline, executionWindowMs };
  return { snapshot, revisionHash: await sha256Hex(canonicalJson(snapshot)) };
}
function participants(proposal: Proposal): string[] { return proposal.snapshot.legs.map((leg) => leg.giverId); }
function terminal(state: CoordinationState): boolean { return ['cancelled', 'declined', 'frozen'].includes(state.status); }
function next(state: CoordinationState, patch: Partial<CoordinationState>): CoordinationState { return { ...state, ...patch }; }
function tick(state: CoordinationState, now: number): CoordinationState {
  integer(now);
  const observed = Math.max(now, state.lastObservedAt);
  if (!terminal(state) && state.status === 'proposed' && observed >= state.proposal.snapshot.consentDeadline) return next(state, { status: 'cancelled', reason: 'consent_timeout', lastObservedAt: observed });
  if (state.status === 'committed') {
    const lost = participants(state.proposal).some(party => {
      const reservation = state.evidence.find(entry => entry.envelope.cid === state.reservationCids[party]);
      if (!reservation) return true;
      const payload = object(reservation.envelope.payload);
      return typeof payload.expiresAt !== 'string' || !Number.isFinite(Date.parse(payload.expiresAt)) || Date.parse(payload.expiresAt) <= observed;
    });
    if (lost) return next(state, { status: 'frozen', reason: 'reservation_expired', lastObservedAt: observed });
  }
  return next(state, { lastObservedAt: observed });
}
export function evaluateCoordination(state: CoordinationState, feasibility: Feasibility, now: number): CoordinationState {
  const current = tick(state, now);
  integer(feasibility.checkedAt);
  if (typeof feasibility.feasible !== 'boolean' || typeof feasibility.revisionHash !== 'string') throw new TypeError('Invalid feasibility report');
  if (current.status !== 'proposed') return current;
  if (!feasibility.feasible || feasibility.revisionHash !== state.proposal.revisionHash || feasibility.checkedAt > current.lastObservedAt || current.lastObservedAt - feasibility.checkedAt > 600000) return current;
  const ready = participants(current.proposal).every((party) => {
    const consent = current.evidence.find((e) => e.envelope.cid === current.consentCids[party]);
    const reservation = current.evidence.find((e) => e.envelope.cid === current.reservationCids[party]);
    if (!consent || !reservation) return false;
    const payload = object(reservation.envelope.payload);
    return typeof payload.expiresAt === 'string' && Date.parse(payload.expiresAt) > current.lastObservedAt;
  });
  return ready ? next(current, { status: 'committed', reason: null, committedLocallyAt: current.lastObservedAt, commitFeasibility: { ...feasibility } }) : current;
}
/** Only verified coordinator revisions can open a participant's local view. Persist atomically with local inventory checks. */
export async function openCoordination(input: unknown, localPrincipal: string, now: number): Promise<CoordinationState> {
  const envelope = await verifyEnvelope(input, { expectedType: PROPOSAL_TYPE, now });
  const proposal = await prepareProposal(envelope.payload, now);
  if (envelope.author !== proposal.snapshot.coordinatorId || !participants(proposal).includes(localPrincipal) || proposal.snapshot.revisionNo !== 1) throw new TypeError('FORBIDDEN_PROPOSAL');
  return { proposal, status: 'proposed', reason: null, evidence: [{ envelope, receivedAtLocal: now }], consentCids: {}, reservationCids: {}, lastObservedAt: now, committedLocallyAt: null, commitFeasibility: null };
}
/** A revision invalidates every previous consent/reservation. Forks freeze instead of choosing a winner. */
export async function reviseCoordination(state: CoordinationState, input: unknown, now: number): Promise<CoordinationState> {
  const current = tick(state, now);
  if (current.status !== 'proposed') throw new TypeError('MUTINY_CYCLE_FROZEN');
  const envelope = await verifyEnvelope(input, { expectedType: PROPOSAL_TYPE, expectedAuthor: current.proposal.snapshot.coordinatorId, now });
  const proposal = await prepareProposal(envelope.payload, now);
  if (proposal.snapshot.subjectId !== current.proposal.snapshot.subjectId || proposal.snapshot.coordinatorId !== current.proposal.snapshot.coordinatorId) throw new TypeError('FORBIDDEN_PROPOSAL');
  if (proposal.revisionHash === current.proposal.revisionHash) return current;
  if (proposal.snapshot.revisionNo < current.proposal.snapshot.revisionNo) throw new TypeError('MUTINY_REVISION_STALE');
  const evidence = [...current.evidence, { envelope, receivedAtLocal: now }];
  if (proposal.snapshot.previousHash !== current.proposal.revisionHash || proposal.snapshot.revisionNo !== current.proposal.snapshot.revisionNo + 1) return next(current, { status: 'frozen', reason: 'fork_detected', evidence });
  if (canonicalJson(participants(proposal).slice().sort()) !== canonicalJson(participants(current.proposal).slice().sort())) throw new TypeError('Participant changes require a new proposal');
  return next(current, { proposal, consentCids: {}, reservationCids: {}, evidence });
}
/** All imported statements are verified anew. The caller owns transactional persistence and local inventory reservation. */
export async function ingestCoordination(state: CoordinationState, input: unknown, now: number): Promise<CoordinationState> {
  const current = tick(state, now);
  if (terminal(current)) return current;
  const envelope = await verifyEnvelope(input, { now });
  if (!participants(current.proposal).includes(envelope.author)) throw new TypeError('FORBIDDEN_PARTICIPANT');
  if (current.evidence.some((e) => e.envelope.cid === envelope.cid)) return current;
  const p = object(envelope.payload);
  if (p.subjectId !== current.proposal.snapshot.subjectId || p.revisionHash !== current.proposal.revisionHash || (envelope.type !== RESERVATION_TYPE && p.revisionNo !== current.proposal.snapshot.revisionNo)) throw new TypeError('MUTINY_CONSENT_STALE_REVISION');
  if (envelope.type !== WITHDRAWAL_TYPE && Date.parse(envelope.createdAt) >= current.proposal.snapshot.consentDeadline) throw new TypeError('MUTINY_CONSENT_LATE');
  const evidence = [...current.evidence, { envelope, receivedAtLocal: now }];
  if (envelope.type === CONSENT_TYPE) {
    exact(p, ['subjectId', 'revisionHash', 'revisionNo']);
    return next(current, { evidence, consentCids: { ...current.consentCids, [envelope.author]: envelope.cid } });
  }
  if (envelope.type === RESERVATION_TYPE) {
    exact(p, ['subjectId', 'revisionHash', 'giverId', 'itemId', 'expiresAt', 'holdId']);
    text(p.holdId);
    const leg = current.proposal.snapshot.legs.find((entry) => entry.giverId === envelope.author)!;
    if (p.giverId !== envelope.author || p.itemId !== leg.inventoryItemId || typeof p.expiresAt !== 'string' || !Number.isFinite(Date.parse(p.expiresAt)) || new Date(p.expiresAt).toISOString() !== p.expiresAt || Date.parse(p.expiresAt) < current.proposal.snapshot.consentDeadline + current.proposal.snapshot.executionWindowMs || Date.parse(p.expiresAt) <= now) throw new TypeError('MUTINY_LOCK_STATEMENT_INVALID');
    return next(current, { evidence, reservationCids: { ...current.reservationCids, [envelope.author]: envelope.cid } });
  }
  if (envelope.type === WITHDRAWAL_TYPE) {
    exact(p, ['subjectId', 'revisionHash', 'revisionNo', 'reason']);
    if (p.reason !== 'decline' && p.reason !== 'dropout' && p.reason !== 'cancel') throw new TypeError('Invalid withdrawal');
    if (p.reason === 'cancel' && envelope.author !== current.proposal.snapshot.coordinatorId) throw new TypeError('FORBIDDEN_COORDINATOR');
    return next(current, { evidence, status: p.reason === 'decline' ? 'declined' : 'cancelled', reason: p.reason });
  }
  throw new TypeError('Unsupported coordination statement');
}
/** Compare only already verified reservation evidence. Caller freezes every affected subject atomically. */
export function conflictingSubjects(states: readonly CoordinationState[], now: number): readonly string[] {
  integer(now);
  const held = new Map<string, Set<string>>();
  for (const state of states) {
    if (terminal(tick(state, now))) continue;
    for (const [giver, cid] of Object.entries(state.reservationCids)) {
      const evidence = state.evidence.find((e) => e.envelope.cid === cid);
      if (!evidence) continue;
      const p = object(evidence.envelope.payload);
      if (typeof p.expiresAt !== 'string' || Date.parse(p.expiresAt) <= Math.max(now, state.lastObservedAt)) continue;
      const key = canonicalJson([giver, p.itemId]);
      const subjects = held.get(key) ?? new Set<string>();
      subjects.add(state.proposal.snapshot.subjectId); held.set(key, subjects);
    }
  }
  return [...new Set([...held.values()].filter((subjects) => subjects.size > 1).flatMap((subjects) => [...subjects]))].sort();
}
export function freezeConflict(state: CoordinationState): CoordinationState {
  return terminal(state) ? state : next(state, { status: 'frozen', reason: 'conflicting_promise' });
}
