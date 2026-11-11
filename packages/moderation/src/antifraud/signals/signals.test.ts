import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { createRoleTableAuthz, defineCommand, defineQuery, ok, z, type Actor, type EventEnvelope } from '@classrup/kernel';
import { createTestKernel } from '@classrup/kernel/testing';
import {
  CONSUMED_EVENT_TYPES, KIND_DEFAULTS, SIGNALS_ROLES, SIGNAL_KINDS, decayedWeight, deleteSubjectSignals, exportSignals, expiryOf, importSignals, purgeExpiredSignals, readRollup,
  signalRecordedEvent, signalRepo, signalsDefinitions, summarizeSignals, type Signal, type SignalsOptions,
} from './index.ts';

const DAY = 86_400_000;
const START = '2026-11-04T10:00:00.000Z';
const NOW = Date.parse(START);
const B = 'did:key:z6MkSubjectB';
const OTHER = 'did:key:z6MkSubjectOther';
const MOD = 'did:key:z6MkModerator';

let seq = 0;
function envelope(tenantId: string, type: string, payload: unknown, over: Partial<EventEnvelope> = {}): EventEnvelope {
  seq += 1;
  return {
    eventId: `0192f400-0000-7000-8000-${String(seq).padStart(12, '0')}`, type, version: 1, tenantId, aggregate: { type: 'test', id: 'x' }, revision: 1,
    actor: { kind: 'system', id: 'test' }, occurredAt: '2020-01-01T00:00:00.000Z', correlationId: 'c1', causationId: 'c0', privacy: 'P2', payload, provenance: { origin: 'vault:test', sig: null }, ...over,
  };
}

function relay(extra: Partial<SignalsOptions> = {}) {
  const cases = new Set<string>();
  const defs = signalsDefinitions({ mode: 'relay', hasOpenCase: (m, s) => cases.has(`${m}|${s}`), resolveSubjectKey: (h) => (h === 'k_b' ? B : undefined), ...extra });
  const k = createTestKernel({ definitions: defs.all, authz: createRoleTableAuthz(SIGNALS_ROLES), start: START });
  const moderator: Actor = { kind: 'user', id: MOD, roles: ['moderator'] };
  const operator: Actor = { kind: 'operator', id: 'did:key:z6MkOperator', roles: ['operator'] };
  cases.add(`${MOD}|${B}`);
  cases.add(`${MOD}|${OTHER}`);
  return { k, defs, cases, moderator, operator, ...helpers(k) };
}

function vault(extra: Partial<SignalsOptions> = {}) {
  const probe = createTestKernel({ start: START });
  const principal = probe.actor;
  if (principal.kind !== 'user') throw new Error('unexpected actor');
  const defs = signalsDefinitions({ mode: 'vault', principalKey: principal.id, resolveSubjectKey: (h) => (h === 'k_b' ? B : undefined), ...extra });
  probe.registry.add(...defs.all);
  return { k: probe, defs, principal, ...helpers(probe) };
}

function helpers(k: ReturnType<typeof createTestKernel>) {
  const deliver = (slug: string, type: string, payload: unknown, over: Partial<EventEnvelope> = {}) => k.outbox.deliver(`moderation.signals_${slug}`, envelope(k.tenantId, type, payload, over));
  const rows = async () => (await k.storage.read((tx) => tx.records.query<Signal>({ tenant: k.tenantId, type: signalRepo.type, filters: [], orderSlot: 0, dir: 'asc', limit: 500 })));
  const recorded = () => k.events.filter((e) => e.type === 'moderation.signal.recorded');
  return { deliver, rows, recorded };
}
const manual = (over: object = {}) => ({ subjectKey: B, kind: 'manual_concern', weight: 8, reason: 'Asked to move the payment outside the app twice.', ...over });
const code = (r: { ok: boolean; error?: { code: string } }): string => (r.ok ? 'ok' : (r.error?.code ?? '?'));

describe('manual signals', () => {
  it('TEST-PS-101-09.T01 records valid manual signals with expiry = observedAt + 5 half-lives and refuses invalid weight and kind', async () => {
    const { k, moderator, recorded, rows } = relay();
    const done = await k.cmd('moderation.signal.record_manual', manual({ halfLifeDays: 16 }), { actor: moderator });
    expect(done.ok).toBe(true);
    if (!done.ok) return;
    const out = done.value.value as { signalId: string; expiresAt: string };
    expect(out.expiresAt).toBe(new Date(NOW + 5 * 16 * DAY).toISOString());
    expect(out.expiresAt).toBe(expiryOf(NOW, 16));
    const stored = (await rows())[0];
    expect(stored?.data).toMatchObject({ subjectKey: B, kind: 'manual_concern', weight: 8, halfLifeDays: 16, sourceModule: 'manual', authorKey: MOD, observedAt: START });
    expect(stored?.revision).toBe(1);
    expect(recorded()).toHaveLength(1);
    expect(recorded()[0]?.payload).toMatchObject({ signalId: out.signalId, subjectKey: B, kind: 'manual_concern', weight: 8, halfLifeDays: 16, sourceModule: 'manual', observedAt: START });
    // lifetime never exceeds 365 days
    const long = await k.cmd('moderation.signal.record_manual', manual({ weight: -5, kind: 'manual_positive', halfLifeDays: 180 }), { actor: moderator });
    expect(long.ok && (long.value.value as { expiresAt: string }).expiresAt).toBe(new Date(NOW + 365 * DAY).toISOString());
    // invalid input stores nothing
    const before = (await rows()).length;
    const bad: [object, string][] = [
      [manual({ weight: 101 }), 'VALIDATION_FAILED'], [manual({ weight: -101, kind: 'manual_positive' }), 'VALIDATION_FAILED'], [manual({ weight: 1.5 }), 'VALIDATION_FAILED'],
      [manual({ kind: 'dispute_lost' }), 'VALIDATION_FAILED'], [manual({ halfLifeDays: 6 }), 'VALIDATION_FAILED'], [manual({ halfLifeDays: 181 }), 'VALIDATION_FAILED'],
      [manual({ reason: 'too short' }), 'VALIDATION_FAILED'], [manual({ reason: 'x'.repeat(501) }), 'VALIDATION_FAILED'], [manual({ extra: 1 }), 'VALIDATION_FAILED'],
      [manual({ weight: -3 }), 'VALIDATION_FAILED'], [manual({ kind: 'manual_positive', weight: 3 }), 'VALIDATION_FAILED'], [manual({ supersedesSignalId: 'abc' }), 'VALIDATION_FAILED'],
      [manual({ kind: 'compensation', weight: -8 }), 'VALIDATION_FAILED'], [manual({ subjectKey: MOD }), 'FORBIDDEN'],
    ];
    for (const [input, expected] of bad) expect(code(await k.cmd('moderation.signal.record_manual', input, { actor: moderator }))).toBe(expected);
    expect((await rows()).length).toBe(before);
  });

  it('TEST-PS-101-09.T03 a compensation referencing a missing signal, another subject or a compensation is NOT_FOUND', async () => {
    const { k, moderator, rows } = relay();
    const first = await k.cmd('moderation.signal.record_manual', manual(), { actor: moderator });
    const other = await k.cmd('moderation.signal.record_manual', manual({ subjectKey: OTHER }), { actor: moderator });
    expect(first.ok && other.ok).toBe(true);
    const id = (first.ok ? (first.value.value as { signalId: string }).signalId : '');
    const otherId = (other.ok ? (other.value.value as { signalId: string }).signalId : '');
    const comp = (supersedesSignalId: string, weight = -8) => k.cmd('moderation.signal.record_manual', manual({ kind: 'compensation', weight, supersedesSignalId }), { actor: moderator });
    expect(code(await comp('0192f400-0000-7000-8000-00000000dead'))).toBe('NOT_FOUND');
    expect(code(await comp(otherId))).toBe('NOT_FOUND');
    const ok1 = await comp(id);
    expect(ok1.ok).toBe(true);
    const compId = ok1.ok ? (ok1.value.value as { signalId: string }).signalId : '';
    expect(code(await comp(compId, 8))).toBe('NOT_FOUND');
    // a signal is compensated once, and the compensation weight must be exactly minus the original
    expect(code(await comp(id))).toBe('SIGNALS_DUPLICATE_SOURCE');
    const third = await k.cmd('moderation.signal.record_manual', manual({ weight: 3 }), { actor: moderator });
    const thirdId = third.ok ? (third.value.value as { signalId: string }).signalId : '';
    expect(code(await comp(thirdId, -2))).toBe('VALIDATION_FAILED');
    expect((await rows()).length).toBe(4);
  });

  it('a compensation cancels the original at every instant, both stay visible, and replays by Idempotency-Key', async () => {
    const { k, moderator, operator } = relay();
    const first = await k.cmd('moderation.signal.record_manual', manual({ weight: 12, halfLifeDays: 30 }), { actor: moderator });
    const id = first.ok ? (first.value.value as { signalId: string }).signalId : '';
    k.clock.advance(20 * DAY);
    const key = k.ids.next();
    const input = manual({ kind: 'compensation', weight: -12, supersedesSignalId: id, reason: 'The report was a misunderstanding.' });
    const comp = await k.cmd('moderation.signal.record_manual', input, { actor: moderator, idempotencyKey: key });
    const replay = await k.cmd('moderation.signal.record_manual', input, { actor: moderator, idempotencyKey: key });
    expect(comp.ok && replay.ok && replay.value.replayed).toBe(true);
    for (const days of [0, 5, 40, 100]) {
      k.clock.advance(days * DAY);
      const s = await k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: operator });
      expect(Math.abs((s.ok ? (s.value.value as { totalDecayedWeight: number }).totalDecayedWeight : 1))).toBeLessThan(1e-9);
    }
    const list = await k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: moderator });
    expect(list.ok && (list.value.value as { items: unknown[] }).items).toHaveLength(2);
  });

  it('TEST-PS-101-09.T07 the fourth signal from one source in 30 days is ignored for scoring and manual weight above the cap is refused', async () => {
    const { k, moderator, operator, deliver, rows } = relay();
    for (let i = 0; i < 4; i++) {
      expect(await deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: `m${i}`, targetDid: B, reportedByDid: OTHER, claim: true, origin: 'local' })).toBe('delivered');
    }
    const stored = await rows();
    expect(stored).toHaveLength(4);
    expect(stored.filter((r) => r.data.capped)).toHaveLength(1);
    const summary = await k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: operator });
    expect(summary.ok && (summary.value.value as { byKind: Record<string, { count: number }> }).byKind['no_show']?.count).toBe(3);
    // a different reporter is counted separately
    await deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm9', targetDid: B, reportedByDid: 'did:key:z6MkSomeoneElse' });
    expect((await rows()).filter((r) => r.data.capped)).toHaveLength(1);
    // manual cap: 15 then 10 would exceed 20 in absolute value
    const a = await k.cmd('moderation.signal.record_manual', manual({ subjectKey: OTHER, weight: 15 }), { actor: moderator });
    expect(a.ok).toBe(true);
    expect(code(await k.cmd('moderation.signal.record_manual', manual({ subjectKey: OTHER, weight: 10 }), { actor: moderator }))).toBe('SIGNALS_MANUAL_CAP');
    expect((await k.cmd('moderation.signal.record_manual', manual({ subjectKey: OTHER, weight: 5 }), { actor: moderator })).ok).toBe(true);
    expect(code(await k.cmd('moderation.signal.record_manual', manual({ subjectKey: OTHER, weight: 1 }), { actor: moderator }))).toBe('SIGNALS_MANUAL_CAP');
    // the cap is a 30-day window
    k.clock.advance(31 * DAY);
    expect((await k.cmd('moderation.signal.record_manual', manual({ subjectKey: OTHER, weight: 10 }), { actor: moderator })).ok).toBe(true);
  });

  it('limits one author to ten manual signals per day', async () => {
    const { k, moderator, cases } = relay();
    for (let i = 0; i < 10; i++) {
      const subject = `did:key:z6MkTarget${i}`;
      cases.add(`${MOD}|${subject}`);
      expect((await k.cmd('moderation.signal.record_manual', manual({ subjectKey: subject, weight: 2 }), { actor: moderator })).ok).toBe(true);
    }
    cases.add(`${MOD}|did:key:z6MkTarget10`);
    const eleventh = await k.cmd('moderation.signal.record_manual', manual({ subjectKey: 'did:key:z6MkTarget10', weight: 2 }), { actor: moderator });
    expect(code(eleventh)).toBe('RATE_LIMITED');
    k.clock.advance(DAY + 1);
    expect((await k.cmd('moderation.signal.record_manual', manual({ subjectKey: 'did:key:z6MkTarget10', weight: 2 }), { actor: moderator })).ok).toBe(true);
  });
});

describe('decay math', () => {
  it('TEST-PS-101-09.T02 decayed weight equals w x 0.5^(age/h) and totals do not depend on ingestion order', () => {
    const sig = fc.record({
      weight: fc.integer({ min: -100, max: 100 }), halfLifeDays: fc.integer({ min: 7, max: 180 }), ageDays: fc.double({ min: 0, max: 400, noNaN: true }), kind: fc.constantFrom(...SIGNAL_KINDS),
    });
    fc.assert(fc.property(fc.array(sig, { minLength: 1, maxLength: 40 }), fc.integer({ min: 0, max: 1000 }), (items, shuffleSeed) => {
      const signals: Signal[] = items.map((i, n) => {
        const observed = NOW - Math.floor(i.ageDays * DAY);
        return { subjectKey: B, kind: i.kind, weight: i.weight, halfLifeDays: i.halfLifeDays, sourceModule: 'test', sourceEventId: `e${n}`, observedAt: new Date(observed).toISOString(), expiresAt: new Date(NOW + 400 * DAY).toISOString() };
      });
      const total = summarizeSignals(signals, NOW).totalDecayedWeight;
      const closed = signals.reduce((s, x) => s + x.weight * 0.5 ** ((NOW - Date.parse(x.observedAt)) / (x.halfLifeDays * DAY)), 0);
      expect(Math.abs(total - closed)).toBeLessThan(1e-9);
      const shuffled = [...signals].sort((a, b) => ((Date.parse(a.observedAt) * 31 + shuffleSeed) % 97) - ((Date.parse(b.observedAt) * 31 + shuffleSeed) % 97));
      expect(Math.abs(summarizeSignals(shuffled, NOW).totalDecayedWeight - total)).toBeLessThan(1e-9);
      for (const s of signals) expect(Math.abs(decayedWeight(s, NOW) - s.weight * 0.5 ** ((NOW - Date.parse(s.observedAt)) / (s.halfLifeDays * DAY)))).toBeLessThan(1e-12);
    }), { numRuns: 200 });
    // half-life example of the fixtures: weight 10 with half-life 60 days halves after 60 days
    expect(decayedWeight({ weight: 10, halfLifeDays: 60, observedAt: START }, NOW + 60 * DAY)).toBeCloseTo(5, 12);
  });

  it('ignores expired and future signals in summaries and answers asOf in the past', () => {
    const base = { subjectKey: B, kind: 'no_show', weight: 10, halfLifeDays: 60, sourceModule: 'x' } as const;
    const live: Signal = { ...base, observedAt: START, expiresAt: new Date(NOW + 300 * DAY).toISOString() };
    const expired: Signal = { ...base, observedAt: new Date(NOW - 400 * DAY).toISOString(), expiresAt: new Date(NOW - DAY).toISOString() };
    expect(summarizeSignals([live, expired], NOW).byKind['no_show']?.count).toBe(1);
    expect(summarizeSignals([live], NOW - DAY).totalDecayedWeight).toBe(0);
  });
});

describe('consumed events', () => {
  it('TEST-PS-101-09.T04 every consumed event delivered twice yields exactly one signal per source event with the documented weight', async () => {
    const { k, deliver, rows, recorded } = relay();
    const A = 'did:key:z6MkOpener';
    const cases: [string, string, unknown, string, number, number][] = [
      ['spam_detected', 'moderation.spam.detected', { subjectKeyHash: 'k_b', score: 72, heuristics: ['velocity'] }, 'spam_detected', 11, 14],
      ['shill_suspected', 'auctions.shill.suspected', { checkId: 'chk1', auctionId: 'a1', subjectId: B, score: 80, reasons: [], triggerBidSeq: 4 }, 'shill_suspected', 40, 90],
      ['auction_voided', 'auctions.result.voided', { auctionId: 'a1', resultId: 'r1', partyId: B, reason: 'void' }, 'auction_voided', 25, 90],
      ['dispute_opened', 'commerce.dispute.opened', { caseId: 'case1', contextRef: { type: 'offer', id: 'o' }, openerId: A, respondentIds: [B], reason: 'item' }, 'dispute_opened', 10, 60],
      ['payment_disputed', 'commerce.payment.disputed', { claimId: 'cl1', dealId: 'd1', payeeId: B, reason: 'x' }, 'payment_claim_disputed', 15, 60],
      ['payment_expired', 'commerce.payment.expired', { claimId: 'cl2', dealId: 'd1', payeeId: B, lastStatus: 'open' }, 'payment_claim_expired', 6, 30],
      ['deal_completed', 'commerce.deal.completed', { dealId: 'd9', contextRef: { type: 'offer', id: 'o' }, parties: [{ did: B, role: 'seller' }] }, 'deal_completed', -4, 120],
      ['meetup_no_show', 'comms.meetup.no_show', { meetupId: 'mt1', targetDid: B, reportedByDid: A, claim: true, origin: 'local' }, 'no_show', 10, 60],
      ['cycle_dropout', 'mutiny.cycle.participant_dropped', { cycleId: 'cy1', participantId: B, publicReason: 'r', phase: 'after_handover', outcome: 'cancelled' }, 'cycle_dropout', 12, 60],
      ['damage_claimed', 'rentals.damage.claimed', { claimId: 'dm1', reservationId: 'rv', ownerId: A, renterId: B, kind: 'x' }, 'damage_claimed', 8, 90],
      ['action_applied', 'moderation.action.applied', { actionId: 'act1', caseId: 'c', kind: 'suspend_relay_access', subjectKey: B }, 'report_actioned', 40, 180],
    ];
    for (const [slug, type, payload, kind, weight, halfLife] of cases) {
      const env = envelope(k.tenantId, type, payload);
      expect(await k.outbox.deliver(`moderation.signals_${slug}`, env)).toBe('delivered');
      expect(await k.outbox.deliver(`moderation.signals_${slug}`, env)).toBe('duplicate');
      // a second delivery of the same source under another event id is a no-op as well for events with natural source ids
      const stored = (await rows()).filter((r) => r.data.kind === kind);
      expect(stored, slug).toHaveLength(1);
      expect(stored[0]?.data, slug).toMatchObject({ subjectKey: B, weight, halfLifeDays: halfLife, sourceModule: expect.any(String) });
      expect(stored[0]?.data.observedAt).toBe(START);
      expect(stored[0]?.data.claimedAt).toBe('2020-01-01T00:00:00.000Z');
    }
    expect(recorded()).toHaveLength(cases.length);
    // a re-published dispute opened event (new event id, same case) still counts once
    expect(await deliver('dispute_opened', 'commerce.dispute.opened', { caseId: 'case1', openerId: A, respondentIds: [B] })).toBe('delivered');
    expect((await rows()).filter((r) => r.data.kind === 'dispute_opened')).toHaveLength(1);
    // dispute resolution: opener prevailed marks the respondent, respondent prevailed compensates the opened signal
    expect(await deliver('dispute_resolved', 'commerce.dispute.resolved', { caseId: 'case1', resolution: 'refund_claimed' })).toBe('delivered');
    expect((await rows()).find((r) => r.data.kind === 'dispute_lost')?.data).toMatchObject({ subjectKey: B, weight: 20 });
    expect(await deliver('dispute_opened', 'commerce.dispute.opened', { caseId: 'case2', openerId: A, respondentIds: [B] })).toBe('delivered');
    const resolved = { caseId: 'case2', resolution: 'no_fault_close' };
    expect(await deliver('dispute_resolved', 'commerce.dispute.resolved', resolved)).toBe('delivered');
    expect(await deliver('dispute_resolved', 'commerce.dispute.resolved', resolved)).toBe('delivered');
    const comps = (await rows()).filter((r) => r.data.kind === 'compensation');
    expect(comps).toHaveLength(1);
    const opened2 = (await rows()).find((r) => r.data.evidenceRef === 'case2');
    expect(comps[0]?.data).toMatchObject({ weight: -10, supersedesSignalId: opened2?.id });
    // no signal about the respondent keeps a net weight from case2
    const asOf = k.clock.now();
    const case2Net = (await rows()).filter((r) => r.id === opened2?.id || r.data.supersedesSignalId === opened2?.id).reduce((s, r) => s + decayedWeight(r.data, asOf), 0);
    expect(Math.abs(case2Net)).toBeLessThan(1e-9);
    // resolutions that decide nothing are ignored
    const count = (await rows()).length;
    expect(await deliver('dispute_resolved', 'commerce.dispute.resolved', { caseId: 'case1', resolution: 'enforcement_referral' })).toBe('delivered');
    expect((await rows()).length).toBe(count);
  });

  it('applies the mapping rules: score threshold, both deal parties, before_commit drops, unresolved subjects and malformed payloads are ignored', async () => {
    const { k, deliver, rows } = relay();
    await deliver('spam_detected', 'moderation.spam.detected', { subjectKeyHash: 'k_b', score: 49 });
    await deliver('spam_detected', 'moderation.spam.detected', { subjectKeyHash: 'k_unknown', score: 90 });
    await deliver('spam_detected', 'moderation.spam.detected', { subjectKeyHash: 'k_b', score: 100 });
    await deliver('cycle_dropout', 'mutiny.cycle.participant_dropped', { cycleId: 'c', participantId: B, phase: 'before_commit' });
    await deliver('deal_completed', 'commerce.deal.completed', { dealId: 'd', parties: [{ did: B, role: 'buyer' }, { did: OTHER, role: 'seller' }, { did: 'bad', role: 'x' }] });
    await deliver('payment_expired', 'commerce.payment.expired', { claimId: 'c', dealId: 'd', lastStatus: 'x' });
    await deliver('shill_suspected', 'auctions.shill.suspected', 'not an object');
    await deliver('action_applied', 'moderation.action.applied', { actionId: 'a', kind: 'remove_from_index', subjectKey: B });
    const kinds = (await rows()).map((r) => `${r.data.kind}:${r.data.weight}:${r.data.subjectKey === B ? 'B' : 'O'}`).sort();
    expect(kinds).toEqual(['deal_completed:-4:B', 'deal_completed:-4:O', 'spam_detected:25:B']);
    expect(k.events.filter((e) => e.type === 'moderation.signal.recorded')).toHaveLength(3);
  });

  it('in a vault, relay-only actions and unsigned federated events are ignored while local events count', async () => {
    const v = vault();
    await v.deliver('action_applied', 'moderation.action.applied', { actionId: 'a', kind: 'warn', subjectKey: B });
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm1', targetDid: B, reportedByDid: OTHER }, { actor: { kind: 'federated', id: 'peer' } });
    expect(await v.rows()).toHaveLength(0);
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm2', targetDid: B, reportedByDid: OTHER }, { actor: { kind: 'federated', id: 'peer' }, provenance: { origin: 'vault:test', sig: 'ed25519:abc' } });
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm3', targetDid: B, reportedByDid: OTHER });
    expect(await v.rows()).toHaveLength(2);
  });

  it('observedAt uses the store clock; the claimed time is stored as advisory and does not affect decay', async () => {
    const { k, deliver, rows, operator } = relay();
    await deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm1', targetDid: B }, { occurredAt: '1999-01-01T00:00:00.000Z' });
    const r = (await rows())[0];
    expect(r?.data.observedAt).toBe(START);
    expect(r?.data.claimedAt).toBe('1999-01-01T00:00:00.000Z');
    const s = await k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: operator });
    expect(s.ok && (s.value.value as { totalDecayedWeight: number }).totalDecayedWeight).toBeCloseTo(10, 12);
  });

  it('TEST-PS-101-09.T05 definitions carry spec names, capabilities and module, outputs and the event validate, and every consumed event has a subscriber', async () => {
    const { k, defs, moderator, operator, recorded } = relay();
    expect([defs.recordManual.name, defs.listForSubject.name, defs.summarize.name, defs.categoriesOwn.name]).toEqual([
      'moderation.signal.record_manual', 'moderation.signal.list_for_subject', 'moderation.signal.summarize', 'moderation.signal.categories_own',
    ]);
    expect([defs.recordManual.capability, defs.listForSubject.capability, defs.summarize.capability, defs.categoriesOwn.capability]).toEqual([
      'moderation.signal.record_manual', 'moderation.signal.read_as_reviewer', 'moderation.signal.read_summary', 'moderation.signal.read_categories',
    ]);
    for (const d of defs.all) expect(d.module).toBe('F12.S03.M02');
    expect(defs.recordManual.idempotent).toBe(true);
    const types = new Set(defs.subscribers.flatMap((s) => s.types).concat(defs.onDisputeResolved.types));
    expect(new Set(CONSUMED_EVENT_TYPES)).toEqual(types);
    expect(CONSUMED_EVENT_TYPES).toHaveLength(12);
    const rec = await k.cmd('moderation.signal.record_manual', manual(), { actor: moderator });
    expect(rec.ok && Object.keys(rec.value.value as object).sort()).toEqual(['expiresAt', 'signalId']);
    expect(signalRecordedEvent.payload.safeParse(recorded()[0]?.payload).success).toBe(true);
    expect(signalRecordedEvent.payload.safeParse({ ...(recorded()[0]?.payload as object), text: 'message body' }).success).toBe(false);
    const list = await k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: moderator });
    expect(list.ok && (list.value.value as { items: { decayedWeight: number; signalId: string }[] }).items[0]).toMatchObject({ signalId: expect.any(String), decayedWeight: 8, kind: 'manual_concern' });
    const sum = await k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: operator });
    expect(sum.ok && sum.value.value).toEqual({ totalDecayedWeight: 8, byKind: { manual_concern: { count: 1, decayedWeight: 8 } }, computedAt: START });
    const cats = await k.ask('moderation.signal.categories_own', { subjectKey: B, windowDays: 91 }, { actor: { kind: 'user', id: B, roles: ['member'] } });
    expect(code(cats)).toBe('VALIDATION_FAILED');
    expect(KIND_DEFAULTS.deal_completed.weight).toBe(-4);
  });
});

describe('access control and privacy', () => {
  it('TEST-PS-101-09.T06 another member gets NOT_FOUND, a moderator without a case FORBIDDEN, and the subject reads own category counts only', async () => {
    const v = vault();
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm1', targetDid: B, reportedByDid: OTHER });
    const stranger = v.k.user(['member']);
    expect(code(await v.k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: stranger }))).toBe('NOT_FOUND');
    expect(code(await v.k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: stranger }))).toBe('NOT_FOUND');
    expect(code(await v.k.ask('moderation.signal.categories_own', { subjectKey: B }, { actor: stranger }))).toBe('NOT_FOUND');
    const own = await v.k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: v.principal });
    expect(own.ok).toBe(true);
    // a principal-shaped actor that is not the unlocked principal is refused at the second layer
    const impostor: Actor = { kind: 'user', id: 'did:key:z6MkImpostor', roles: ['principal'] };
    expect(code(await v.k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: impostor }))).toBe('NOT_FOUND');

    const r = relay();
    await r.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm1', targetDid: 'did:key:z6MkNoCase' });
    await r.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm2', targetDid: B });
    const noCase: Actor = { kind: 'user', id: 'did:key:z6MkModNoCase', roles: ['moderator'] };
    expect(code(await r.k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: noCase }))).toBe('FORBIDDEN');
    expect(code(await r.k.cmd('moderation.signal.record_manual', manual(), { actor: noCase }))).toBe('FORBIDDEN');
    expect(code(await r.k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: r.k.user(['member']) }))).toBe('NOT_FOUND');
    const subject: Actor = { kind: 'user', id: B, roles: ['member'] };
    const cats = await r.k.ask('moderation.signal.categories_own', { subjectKey: B, windowDays: 30 }, { actor: subject });
    expect(cats.ok && cats.value.value).toEqual({ byKind: { no_show: 1 } });
    expect(code(await r.k.ask('moderation.signal.categories_own', { subjectKey: 'did:key:z6MkNoCase' }, { actor: subject }))).toBe('FORBIDDEN');
    expect(code(await r.k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: subject }))).toBe('NOT_FOUND');
    expect(code(await r.k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: r.operator }))).toBe('ok');
    expect(code(await r.k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: r.operator }))).toBe('NOT_FOUND');
    expect(code(await r.k.ask('moderation.signal.list_for_subject', { subjectKey: B }, { actor: r.moderator }))).toBe('ok');
  });

  it('signals hold ids and categories only: no free text from events is stored', async () => {
    const { deliver, rows } = relay();
    await deliver('dispute_opened', 'commerce.dispute.opened', { caseId: 'case1', openerId: OTHER, respondentIds: [B], reason: 'You sold me a broken bike at 12 Elm Street for 150 EUR' });
    await deliver('payment_disputed', 'commerce.payment.disputed', { claimId: 'cl', dealId: 'd', payeeId: B, reason: 'message text here', amount: '15000' });
    const dump = JSON.stringify(await rows());
    for (const forbidden of ['broken bike', 'Elm Street', 'EUR', 'message text', '15000']) expect(dump).not.toContain(forbidden);
  });

  it('lists with since, kind and cursor, and follows rotation links only when the root supplies them', async () => {
    const { k, deliver, moderator, operator } = relay({ linkedKeys: (s) => (s === B ? ['did:key:z6MkOldKeyOfB'] : []) });
    for (let i = 0; i < 5; i++) { await deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: `m${i}`, targetDid: B, reportedByDid: `did:key:z6MkRep${i}` }); k.clock.advance(1000); }
    await deliver('payment_expired', 'commerce.payment.expired', { claimId: 'c', payeeId: B });
    await deliver('deal_completed', 'commerce.deal.completed', { dealId: 'x', parties: [{ did: 'did:key:z6MkOldKeyOfB' }] });
    const page1 = await k.ask('moderation.signal.list_for_subject', { subjectKey: B, limit: 4 }, { actor: moderator });
    expect(page1.ok).toBe(true);
    const v1 = page1.ok ? (page1.value.value as { items: unknown[]; nextCursor?: string }) : { items: [] };
    expect(v1.items).toHaveLength(4);
    const page2 = await k.ask('moderation.signal.list_for_subject', { subjectKey: B, limit: 4, cursor: (v1 as { nextCursor?: string }).nextCursor }, { actor: moderator });
    expect(page2.ok && (page2.value.value as { items: unknown[] }).items).toHaveLength(2);
    const kind = await k.ask('moderation.signal.list_for_subject', { subjectKey: B, kind: 'payment_claim_expired' }, { actor: moderator });
    expect(kind.ok && (kind.value.value as { items: unknown[] }).items).toHaveLength(1);
    const since = await k.ask('moderation.signal.list_for_subject', { subjectKey: B, since: new Date(NOW + 3000).toISOString() }, { actor: moderator });
    expect(since.ok && (since.value.value as { items: unknown[] }).items).toHaveLength(3);
    const sum = await k.ask('moderation.signal.summarize', { subjectKey: B }, { actor: operator });
    expect(sum.ok && (sum.value.value as { byKind: Record<string, { count: number }> }).byKind['deal_completed']?.count).toBe(1);
  });
});

describe('purge, deletion, export and import', () => {
  it('TEST-PS-101-09.T08 the purge removes expired rows and keeps counts per kind, expired rollups go after 365 days, and vault deletion removes signals immediately', async () => {
    const v = vault();
    const maintenance = defineCommand({
      name: 'signals.maintenance.run', module: 'F12.S03.M02', capability: 'signals.maintenance.run', idempotent: false,
      input: z.strictObject({ what: z.enum(['purge', 'delete']) }),
      handler: (ctx, input) => {
        if (input.what === 'delete') return ok({ purged: 0, rollupsDropped: 0, removed: deleteSubjectSignals(ctx.tx, B) });
        const r = purgeExpiredSignals(ctx);
        return r.ok ? ok({ ...r.value, removed: 0 }) : r;
      },
    });
    const probe = defineQuery({
      name: 'signals.rollup.read', module: 'F12.S03.M02', capability: 'signals.maintenance.run', input: z.strictObject({}),
      handler: (ctx) => ok(readRollup(ctx.tx, B)),
    });
    v.k.registry.add(maintenance, probe);
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm1', targetDid: B, reportedByDid: OTHER }); // half-life 60 days: expires after 300
    await v.deliver('deal_completed', 'commerce.deal.completed', { dealId: 'd', parties: [{ did: B }] }); // half-life 120 days: capped at 365
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm2', targetDid: B, reportedByDid: 'did:key:z6MkR2' });
    const run = (what: 'purge' | 'delete') => v.k.cmd('signals.maintenance.run', { what }, { actor: v.principal });
    v.k.clock.advance(299 * DAY);
    expect((await run('purge')).ok && true).toBe(true);
    expect(await v.rows()).toHaveLength(3);
    v.k.clock.advance(2 * DAY);
    const purged = await run('purge');
    expect(purged.ok && purged.value.value).toEqual({ purged: 2, rollupsDropped: 0, removed: 0 });
    const left = await v.rows();
    expect(left).toHaveLength(1);
    expect(left[0]?.data.kind).toBe('deal_completed');
    const rollup = await v.k.ask('signals.rollup.read', {}, { actor: v.principal });
    expect(rollup.ok && rollup.value.value).toEqual({ no_show: 2 });
    // rollups are kept 365 days and dropped afterwards
    v.k.clock.advance(366 * DAY);
    const later = await run('purge');
    expect(later.ok && later.value.value).toEqual({ purged: 1, rollupsDropped: 1, removed: 0 });
    // deletion of the subject removes vault signals immediately
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm3', targetDid: B });
    await v.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm4', targetDid: OTHER });
    const del = await run('delete');
    expect(del.ok && del.value.value).toMatchObject({ removed: 1 });
    const remaining = await v.rows();
    expect(remaining.map((r) => r.data.subjectKey)).toEqual([OTHER]);
  });

  it('exports unexpired signals with manual reasons and imports them into a fresh vault capped at +-20 with the original observedAt', async () => {
    const src = vault();
    const rec = await src.k.cmd('moderation.signal.record_manual', manual({ weight: 15 }), { actor: src.principal });
    expect(rec.ok).toBe(true);
    await src.deliver('shill_suspected', 'auctions.shill.suspected', { checkId: 'c1', subjectId: B });
    src.k.clock.advance(10 * DAY);
    await src.deliver('meetup_no_show', 'comms.meetup.no_show', { meetupId: 'm1', targetDid: B });
    const exporter = defineQuery({ name: 'signals.export.run', module: 'F12.S03.M02', capability: 'signals.maintenance.run', input: z.strictObject({}), handler: (ctx) => ok(exportSignals(ctx.tx, [B], ctx.clock.now())) });
    src.k.registry.add(exporter);
    const exp = await src.k.ask('signals.export.run', {}, { actor: src.principal });
    const exported = (exp.ok ? exp.value.value : []) as ReturnType<typeof exportSignals>;
    expect(exported).toHaveLength(3);
    expect(exported.find((e) => e.kind === 'manual_concern')?.reason).toContain('payment outside the app');
    const fresh = vault();
    fresh.k.clock.set(src.k.clock.now());
    const importer = defineCommand({
      name: 'signals.import.run', module: 'F12.S03.M02', capability: 'signals.import.run', idempotent: false, input: z.strictObject({ rows: z.array(z.unknown()) }),
      handler: (ctx, input) => { const r = importSignals(ctx, input.rows); return r.ok ? ok(r.value) : r; },
    });
    fresh.k.registry.add(importer);
    const rows = [...exported, { ...exported[0], signalId: 'sig-future', sourceEventId: undefined, kind: 'future_kind_v9', weight: 99 }, { ...exported[0], expiresAt: new Date(NOW - DAY).toISOString() }, { nonsense: true }];
    const res = await fresh.k.cmd('signals.import.run', { rows }, { actor: fresh.principal });
    expect(res.ok && res.value.value).toEqual({ imported: 4, skipped: 2 });
    const stored = await fresh.rows();
    expect(stored.every((r) => r.data.sourceModule === 'import')).toBe(true);
    expect(stored.every((r) => Math.abs(r.data.weight) <= 20)).toBe(true);
    expect(stored.find((r) => r.data.kind === 'shill_suspected')?.data).toMatchObject({ weight: 20, observedAt: START });
    expect(stored.find((r) => r.data.kind === 'manual_concern' && r.data.weight === 0)).toBeDefined();
    // a second import skips duplicates
    const again = await fresh.k.cmd('signals.import.run', { rows: exported }, { actor: fresh.principal });
    expect(again.ok && (again.value.value as { imported: number }).imported).toBe(0);
  });
});
