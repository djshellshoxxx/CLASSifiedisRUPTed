import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { defineMachine } from './machine.ts';

const offer = defineMachine({
  initial: 'made',
  terminal: ['accepted', 'rejected', 'withdrawn', 'expired'],
  transitions: [
    { from: 'made', to: 'accepted', on: 'accept' },
    { from: 'made', to: 'rejected', on: 'reject' },
    { from: 'made', to: 'withdrawn', on: 'withdraw' },
    { from: 'made', to: 'expired', on: 'expire' },
  ],
});

describe('state machines', () => {
  it('TEST-PS-117-09.T07 definitions are validated; next returns the target or CONFLICT_STATE; the table is exported', () => {
    expect(() => defineMachine({ initial: 'a', terminal: ['b'], transitions: [{ from: 'a', to: 'b', on: 'x' }, { from: 'b', to: 'a', on: 'y' }] })).toThrow('terminal');
    expect(() => defineMachine({ initial: 'a', terminal: ['c'], transitions: [{ from: 'a', to: 'b', on: 'x' }, { from: 'a', to: 'c', on: 'x' }] })).toThrow('ambiguous');
    expect(() => defineMachine({ initial: 'z', terminal: ['b'], transitions: [{ from: 'a', to: 'b', on: 'x' }] })).toThrow('initial');
    expect(offer.next('made', 'accept')).toEqual({ ok: true, value: 'accepted' });
    const bad = offer.next('accepted', 'withdraw');
    expect(!bad.ok && bad.error).toMatchObject({ code: 'CONFLICT_STATE', status: 409, params: { state: 'accepted', event: 'withdraw' } });
    expect(offer.edges()).toEqual(['made -> accepted', 'made -> rejected', 'made -> withdrawn', 'made -> expired']);
    expect(offer.states).toEqual(['made', 'accepted', 'rejected', 'withdrawn', 'expired']);
    expect(offer.isTerminal('expired')).toBe(true);
  });

  it('TEST-PS-117-09.T08 property: random event sequences succeed only through declared transitions; terminal states absorb nothing', () => {
    const events = ['accept', 'reject', 'withdraw', 'expire'] as const;
    fc.assert(
      fc.property(fc.array(fc.constantFrom(...events), { maxLength: 20 }), (seq) => {
        let state: (typeof offer.states)[number] = offer.initial;
        let moves = 0;
        for (const e of seq) {
          const r = offer.next(state, e);
          expect(r.ok).toBe(offer.can(state, e));
          if (r.ok) {
            state = r.value;
            moves += 1;
          } else expect(r.error.code).toBe('CONFLICT_STATE');
        }
        expect(moves).toBeLessThanOrEqual(1);
        if (moves === 1) expect(offer.isTerminal(state)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});
