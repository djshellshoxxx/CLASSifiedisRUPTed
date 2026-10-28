import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DAY, ManualClock, MINUTE } from '@classrup/kernel';
import type { IncidentRecord } from '../src/index';
import {
  CONTROL_PATH_RE, INCIDENT_TRANSITIONS, PLAYBOOKS, RESPONSE_TARGETS, riskScore, SEVERITIES, slaStatus, STRIDE_CATEGORIES, summarizeThreats, THREAT_ASSETS,
  THREAT_REF_RE, THREATS,
} from '../src/index';
import { admin, anonymous, errorCode, eventTypes, expectDeclaredEvents, harness, member, moderator, support, system } from './helpers';

describe('threat register', () => {
  it('has at least 25 uniquely referenced entries covering every asset and STRIDE category', () => {
    expect(THREATS.length).toBeGreaterThanOrEqual(25);
    expect(new Set(THREATS.map((t) => t.ref)).size).toBe(THREATS.length);
    expect(THREATS.every((t) => THREAT_REF_RE.test(t.ref))).toBe(true);
    for (const a of THREAT_ASSETS) expect(THREATS.some((t) => t.asset === a), a).toBe(true);
    for (const s of STRIDE_CATEGORIES) expect(THREATS.some((t) => t.stride === s), s).toBe(true);
  });

  it('covers the required threat topics', () => {
    const text = THREATS.map((t) => `${t.title} ${t.scenario}`.toLowerCase()).join('\n');
    for (const topic of ['address', 'deanonymization', 'sybil', 'relay compromise', 'federation metadata', 'fake payment proof', 'replay', 'xss', 'supply chain']) {
      expect(text, topic).toContain(topic);
    }
  });

  it('is internally consistent: scores, control path format and honest statuses', () => {
    for (const t of THREATS) {
      expect(t.likelihood >= 1 && t.likelihood <= 5 && t.impact >= 1 && t.impact <= 5).toBe(true);
      expect(riskScore(t)).toBe(t.likelihood * t.impact);
      expect(t.mitigation.length).toBeGreaterThan(20);
      for (const c of t.controls) expect(CONTROL_PATH_RE.test(c) && !c.includes('..'), c).toBe(true);
      if (t.status === 'mitigated') expect(t.controls.length, t.ref).toBeGreaterThan(0);
      if (t.controls.length === 0) expect(t.status, t.ref).toBe('open');
    }
  });

  it('summarizes by status, asset and stride and ranks open risks', () => {
    const s = summarizeThreats(THREATS);
    expect(s.total).toBe(THREATS.length);
    expect(Object.values(s.byStatus).reduce((a, b) => a + b, 0)).toBe(THREATS.length);
    expect(Object.values(s.byAsset).reduce((a, b) => a + b, 0)).toBe(THREATS.length);
    const scores = s.topOpenRisks.map((ref) => riskScore(THREATS.find((t) => t.ref === ref) as (typeof THREATS)[number]));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    const allMitigated = summarizeThreats(THREATS, () => 'mitigated');
    expect(allMitigated.topOpenRisks).toEqual([]);
  });

  it('lists with filters, records reviews and refuses to mark control-less threats mitigated', () => {
    const h = harness();
    const open = THREATS.find((t) => t.controls.length === 0) as (typeof THREATS)[number];
    const solid = THREATS.find((t) => t.status === 'partial') as (typeof THREATS)[number];
    const all = h.call('platform.threat.list', admin(), {}) as { threats: { ref: string; status: string }[]; summary: { total: number } };
    expect(all.threats).toHaveLength(THREATS.length);
    const filtered = h.call('platform.threat.list', admin(), { asset: 'locations', minScore: 15 }) as { threats: { asset: string; score: number }[] };
    expect(filtered.threats.length).toBeGreaterThan(0);
    expect(filtered.threats.every((t) => t.asset === 'locations' && t.score >= 15)).toBe(true);

    expect(errorCode(() => h.call('platform.threat.review', admin(), { threatRef: open.ref, status: 'mitigated', note: 'looks fine to me' }))).toBe('THREAT.NO_CONTROLS');
    expect(errorCode(() => h.call('platform.threat.review', admin(), { threatRef: 'T-999', status: 'partial', note: 'unknown threat' }))).toBe('THREAT.NOT_FOUND');
    const first = h.call('platform.threat.review', admin(), { threatRef: solid.ref, status: 'mitigated', note: 'verified in integration run' }, 'key-threat-0001') as { version: number };
    expect(first.version).toBe(1);
    expect(h.call('platform.threat.review', admin(), { threatRef: solid.ref, status: 'mitigated', note: 'verified in integration run' }, 'key-threat-0001')).toEqual(first);
    h.call('platform.threat.review', admin(), { threatRef: solid.ref, status: 'accepted', note: 'risk accepted by owner', expectedVersion: 1 });
    expect(errorCode(() => h.call('platform.threat.review', admin(), { threatRef: solid.ref, status: 'open', note: 'reopened for retest', expectedVersion: 1 }))).toBe('STORE.VERSION_CONFLICT');
    const after = h.call('platform.threat.list', admin(), {}) as { threats: { ref: string; status: string }[] };
    expect(after.threats.find((t) => t.ref === solid.ref)?.status).toBe('accepted');
    expect(eventTypes(h.deps)).toEqual(['platform.threat.reviewed', 'platform.threat.reviewed']);
    expectDeclaredEvents(h.deps);
  });

  it('is admin-only and reviews are per tenant', () => {
    const h = harness();
    expect(errorCode(() => h.call('platform.threat.list', member(), {}))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.threat.list', support(), {}))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.threat.review', support(), { threatRef: 'T-001', status: 'partial', note: 'not allowed' }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.threat.list', anonymous(), {}))).toBe('AUTH.REQUIRED');
    h.call('platform.threat.review', admin(), { threatRef: 'T-001', status: 'partial', note: 'downgraded after audit' });
    const other = h.call('platform.threat.list', admin('tnt_other'), {}) as { threats: { ref: string; status: string }[] };
    expect(other.threats.find((t) => t.ref === 'T-001')?.status).toBe('mitigated');
  });
});

describe('playbooks', () => {
  it('cover the required response types with concrete, unique steps', () => {
    expect(PLAYBOOKS.map((p) => p.key).sort()).toEqual(['data_exposure', 'fraud_wave', 'key_compromise', 'relay_compromise']);
    for (const p of PLAYBOOKS) expect(new Set(p.steps.map((s) => s.id)).size).toBe(p.steps.length);
    const keyComp = PLAYBOOKS.find((p) => p.key === 'key_compromise')?.steps.map((s) => s.title.toLowerCase()).join('|') ?? '';
    expect(keyComp).toContain('rotate the relay signing key');
    expect(keyComp).toContain('revoke sessions');
    expect(keyComp).toContain('notify federation peers');
  });
});

describe('incidents', () => {
  const report = (h: ReturnType<typeof harness>, extra: Record<string, unknown> = {}, key?: string) =>
    h.call('platform.incident.report', support(), { title: 'Relay key leaked', summary: 'Signing key found in a public paste', severity: 'SEV1', category: 'key_compromise', ...extra }, key) as {
      id: string;
      version: number;
      status: string;
      timeline: { seq: number; kind: string }[];
    };

  const advance = (h: ReturnType<typeof harness>, id: string, to: string, version: number, extra: Record<string, unknown> = {}, actor = admin()) =>
    h.call('platform.incident.advance', actor, { incidentId: id, to, expectedVersion: version, ...extra }) as { version: number; status: string };

  const postmortem = { summary: 'Key was committed to a public paste by mistake and rotated within the hour.', rootCause: 'Missing secret scanning on the ops repo', actionItems: ['Enable secret scanning'] };

  it('walks the full lifecycle with an append-only timeline and phase timestamps', () => {
    const h = harness();
    const clock = h.deps.clock as ManualClock;
    const inc = report(h, {}, 'key-incident-01');
    expect(inc).toMatchObject({ status: 'detected', version: 1 });
    expect(report(h, {}, 'key-incident-01')).toEqual(inc);
    let v = inc.version;
    for (const to of ['triaged', 'contained', 'eradicated', 'recovered'] as const) {
      clock.advance(5 * MINUTE);
      v = advance(h, inc.id, to, v, { note: `moved to ${to}` }, to === 'triaged' ? support() : admin()).version;
    }
    clock.advance(DAY);
    const done = advance(h, inc.id, 'postmortem_done', v, { postmortem }) as unknown as { status: string; timeline: { seq: number; kind: string; at: number }[]; closedAt: number; postmortem: { recordedBy: string } };
    expect(done.status).toBe('postmortem_done');
    expect(done.postmortem.recordedBy).toBe('acct_admin');
    expect(done.timeline.map((t) => t.seq)).toEqual(done.timeline.map((_, i) => i + 1));
    expect(done.timeline.map((t) => t.kind)).toEqual(['reported', 'status_changed', 'status_changed', 'status_changed', 'status_changed', 'status_changed', 'postmortem_recorded']);
    const times = done.timeline.map((t) => t.at);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(eventTypes(h.deps).filter((t) => t === 'platform.incident.status_changed')).toHaveLength(5);
    expectDeclaredEvents(h.deps);
  });

  it('only allows forward transitions and requires a postmortem or dismissal reason', () => {
    const h = harness();
    const inc = report(h);
    expect(errorCode(() => advance(h, inc.id, 'contained', 1))).toBe('INCIDENT.INVALID_TRANSITION');
    expect(errorCode(() => advance(h, inc.id, 'postmortem_done', 1, { postmortem }))).toBe('INCIDENT.INVALID_TRANSITION');
    expect(errorCode(() => advance(h, inc.id, 'dismissed', 1))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => advance(h, inc.id, 'triaged', 1, { postmortem }))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => advance(h, inc.id, 'postmortem_done', 1))).toBe('VALIDATION.INVALID_INPUT');
    expect(errorCode(() => advance(h, inc.id, 'triaged', 9))).toBe('STORE.VERSION_CONFLICT');
    const dismissed = advance(h, inc.id, 'dismissed', 1, { note: 'duplicate of another report' });
    expect(dismissed.status).toBe('dismissed');
    expect(errorCode(() => advance(h, inc.id, 'triaged', 2))).toBe('INCIDENT.INVALID_TRANSITION');
    expect(errorCode(() => h.call('platform.incident.add_note', admin(), { incidentId: inc.id, text: 'late note here' }))).toBe('INCIDENT.CLOSED');
    for (const from of Object.keys(INCIDENT_TRANSITIONS)) expect(INCIDENT_TRANSITIONS[from as keyof typeof INCIDENT_TRANSITIONS]).not.toContain('detected');
  });

  it('separates support (report, triage, annotate) from admin (containment and beyond)', () => {
    const h = harness();
    const inc = report(h);
    expect(errorCode(() => h.call('platform.incident.report', member(), { title: 'abc', summary: 'a longer summary', severity: 'SEV4', category: 'other' }))).toBe('AUTHZ.FORBIDDEN');
    expect(h.call('platform.incident.report', moderator(), { title: 'Fraud ring spotted', summary: 'Cluster of accounts with fake proofs', severity: 'SEV3', category: 'fraud_wave' })).toMatchObject({ status: 'detected' });
    advance(h, inc.id, 'triaged', 1, {}, support());
    expect(errorCode(() => advance(h, inc.id, 'contained', 2, {}, support()))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.incident.start_playbook', support(), { incidentId: inc.id, playbookKey: 'key_compromise' }))).toBe('AUTHZ.FORBIDDEN');
    h.call('platform.incident.add_note', support(), { incidentId: inc.id, text: 'Contacted peer operators' });
    expect(errorCode(() => h.call('platform.incident.get', member(), { incidentId: inc.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.incident.get', admin('tnt_other'), { incidentId: inc.id }))).toBe('AUTHZ.FORBIDDEN');
    expect(errorCode(() => h.call('platform.incident.list', anonymous(), {}))).toBe('AUTH.REQUIRED');
    expect(errorCode(() => h.call('platform.incident.escalate_due', admin(), {}))).toBe('AUTHZ.FORBIDDEN');
  });

  it('keeps note text and other free text out of events', () => {
    const h = harness();
    const inc = report(h, { summary: 'Contact jane@example.com at 12 Elm Street about the leak' });
    h.call('platform.incident.add_note', support(), { incidentId: inc.id, text: 'secret detail 12 Elm Street' });
    h.call('platform.incident.set_severity', support(), { incidentId: inc.id, severity: 'SEV2', reason: 'lower impact than feared' });
    const serialized = JSON.stringify(h.deps.store.events.read());
    expect(serialized).not.toContain('Elm Street');
    expect(serialized).not.toContain('example.com');
    expect(eventTypes(h.deps)).toEqual(['platform.incident.reported', 'platform.incident.note_added', 'platform.incident.severity_changed']);
    expect(errorCode(() => h.call('platform.incident.set_severity', support(), { incidentId: inc.id, severity: 'SEV2', reason: 'same severity again' }))).toBe('INCIDENT.SEVERITY_UNCHANGED');
  });

  it('flags missed response targets once per kind and tightens with severity', () => {
    const h = harness();
    const clock = h.deps.clock as ManualClock;
    const inc = report(h);
    expect(h.call('platform.incident.escalate_due', system(), {})).toEqual({ flagged: [] });
    clock.advance(16 * MINUTE);
    expect(h.call('platform.incident.escalate_due', system(), {})).toEqual({ flagged: [{ id: inc.id, kind: 'acknowledge' }] });
    expect(h.call('platform.incident.escalate_due', system(), {})).toEqual({ flagged: [] });
    advance(h, inc.id, 'triaged', 2, {}, support());
    clock.advance(2 * 60 * MINUTE);
    expect((h.call('platform.incident.escalate_due', system(), {}) as { flagged: { kind: string }[] }).flagged.map((f) => f.kind)).toEqual(['contain']);
    const detail = h.call('platform.incident.get', admin(), { incidentId: inc.id }) as { sla: { kind: string; state: string }[]; timeline: { kind: string }[] };
    expect(detail.sla.map((s) => `${s.kind}:${s.state}`)).toEqual(['acknowledge:late', 'contain:breached', 'resolve:pending']);
    expect(detail.timeline.filter((t) => t.kind === 'sla_breached')).toHaveLength(2);
    expect(eventTypes(h.deps).filter((t) => t === 'platform.incident.sla_breached')).toHaveLength(2);
    const list = h.call('platform.incident.list', support(), { openOnly: true }) as { breached: string[] }[];
    expect(list[0]?.breached).toEqual(['contain']);
  });

  it('property: response targets get looser with lower severity and SLA state follows timestamps', () => {
    for (const kind of ['acknowledge', 'contain', 'resolve'] as const) {
      const minutes = SEVERITIES.map((s) => RESPONSE_TARGETS[s][kind]);
      expect(minutes).toEqual([...minutes].sort((a, b) => a - b));
    }
    const base: IncidentRecord = {
      id: 'inc_x', version: 1, tenantId: 't', title: 't', summary: 's', severity: 'SEV2', category: 'other', status: 'triaged', reportedBy: 'a', detectedAt: 0,
      timeline: [], playbookRuns: [], breaches: [], updatedAt: 0,
    };
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 3 * 24 * 60 }), fc.option(fc.integer({ min: 0, max: 3 * 24 * 60 }), { nil: undefined }), (nowMin, ackMin) => {
        const [entry] = slaStatus({ ...base, ...(ackMin !== undefined ? { triagedAt: ackMin * MINUTE } : {}) }, nowMin * MINUTE);
        const due = RESPONSE_TARGETS.SEV2.acknowledge;
        const expected = ackMin !== undefined ? (ackMin <= due ? 'met' : 'late') : nowMin > due ? 'breached' : 'pending';
        return entry?.state === expected;
      }),
    );
    expect(slaStatus({ ...base, status: 'dismissed' }, 10 ** 12)).toEqual([]);
  });
});

describe('playbook execution tracking', () => {
  const open = () => {
    const h = harness();
    const inc = h.call('platform.incident.report', support(), { title: 'Relay key leaked', summary: 'Signing key found in a public paste', severity: 'SEV1', category: 'key_compromise' }) as { id: string };
    return { h, id: inc.id };
  };
  const stepIds = PLAYBOOKS.find((p) => p.key === 'key_compromise')?.steps.map((s) => s.id) ?? [];
  type Detail = { version: number; playbookRuns: { runId: string; completedAt?: number; steps: { status: string }[] }[]; timeline: { kind: string; seq: number }[] };

  it('tracks a run to completion and records who did what', () => {
    const { h, id } = open();
    const started = h.call('platform.incident.start_playbook', admin(), { incidentId: id, playbookKey: 'key_compromise' }) as Detail;
    expect(started.playbookRuns[0]?.steps).toHaveLength(stepIds.length);
    expect(errorCode(() => h.call('platform.incident.start_playbook', admin(), { incidentId: id, playbookKey: 'key_compromise' }))).toBe('PLAYBOOK.ALREADY_RUNNING');
    expect(errorCode(() => h.call('platform.incident.start_playbook', admin(), { incidentId: id, playbookKey: 'nope' }))).toBe('PLAYBOOK.NOT_FOUND');
    let last = started;
    for (const [n, stepId] of stepIds.entries()) {
      const skip = n === 1;
      last = h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-1', stepId, status: skip ? 'skipped' : 'done', ...(skip ? { note: 'key already rotated earlier' } : {}) }) as Detail;
    }
    expect(last.playbookRuns[0]?.completedAt).toBeDefined();
    expect(last.timeline.at(-1)?.kind).toBe('playbook_completed');
    expect(last.timeline.map((t) => t.seq)).toEqual(last.timeline.map((_, i) => i + 1));
    expect(eventTypes(h.deps).filter((t) => t === 'platform.incident.playbook_step_completed')).toHaveLength(stepIds.length);
    expect(eventTypes(h.deps)).toContain('platform.incident.playbook_completed');
    expectDeclaredEvents(h.deps);
  });

  it('validates step completion: unknown, repeated and unexplained skips', () => {
    const { h, id } = open();
    h.call('platform.incident.start_playbook', admin(), { incidentId: id, playbookKey: 'key_compromise' });
    const first = stepIds[0] as string;
    expect(errorCode(() => h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-1', stepId: 'nope', status: 'done' }))).toBe('PLAYBOOK.STEP_NOT_FOUND');
    expect(errorCode(() => h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-2', stepId: first, status: 'done' }))).toBe('PLAYBOOK.STEP_NOT_FOUND');
    expect(errorCode(() => h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-1', stepId: first, status: 'skipped' }))).toBe('PLAYBOOK.SKIP_NEEDS_NOTE');
    h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-1', stepId: first, status: 'done' }, 'key-step-00001');
    expect(errorCode(() => h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-1', stepId: first, status: 'done' }))).toBe('PLAYBOOK.STEP_RESOLVED');
    expect(errorCode(() => h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-1', stepId: stepIds[1], status: 'done', expectedVersion: 1 }))).toBe('STORE.VERSION_CONFLICT');
  });

  it('blocks recovery while a started playbook has pending steps', () => {
    const { h, id } = open();
    let v = 1;
    const adv = (to: string) => (v = (h.call('platform.incident.advance', admin(), { incidentId: id, to, expectedVersion: v }) as { version: number }).version);
    h.call('platform.incident.start_playbook', admin(), { incidentId: id, playbookKey: 'key_compromise' });
    v = 2;
    adv('triaged');
    adv('contained');
    adv('eradicated');
    expect(errorCode(() => h.call('platform.incident.advance', admin(), { incidentId: id, to: 'recovered', expectedVersion: v }))).toBe('INCIDENT.PLAYBOOK_INCOMPLETE');
    for (const stepId of stepIds) h.call('platform.incident.complete_step', admin(), { incidentId: id, runId: 'run-1', stepId, status: 'done' });
    v += stepIds.length;
    expect(adv('recovered')).toBeGreaterThan(v - 1);
  });

  it('lists playbooks for staff only', () => {
    const { h } = open();
    expect(h.call('platform.playbook.list', support())).toHaveLength(4);
    expect(errorCode(() => h.call('platform.playbook.list', member()))).toBe('AUTHZ.FORBIDDEN');
  });
});
