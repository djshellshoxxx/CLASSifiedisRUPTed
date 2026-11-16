// Explicit state machines (spec process 03): declared transitions only; others are CONFLICT_STATE.
import { appError, type AppError } from '../errors/app-error.ts';
import { err, ok, type Result } from '../errors/result.ts';

export interface Transition<S extends string, E extends string> {
  readonly from: S;
  readonly to: S;
  readonly on: E;
}

export interface MachineDef<S extends string, E extends string> {
  readonly initial: S;
  readonly terminal: readonly S[];
  readonly transitions: readonly Transition<S, E>[];
}

export interface Machine<S extends string, E extends string> {
  readonly initial: S;
  readonly terminal: readonly S[];
  readonly transitions: readonly Transition<S, E>[];
  readonly states: readonly S[];
  can(state: S, event: E): boolean;
  next(state: S, event: E): Result<S, AppError>;
  isTerminal(state: S): boolean;
  /** Transition table as "from -> to" rows, for comparison with module.spec.yaml. */
  edges(): string[];
}

function validate<S extends string, E extends string>(def: MachineDef<S, E>): Map<string, S> {
  const table = new Map<string, S>();
  const terminal = new Set<string>(def.terminal);
  for (const t of def.transitions) {
    if (terminal.has(t.from)) throw new Error(`defineMachine: terminal state ${t.from} has outgoing transition on ${t.on}`);
    const key = `${t.from}\u0000${t.on}`;
    const prior = table.get(key);
    if (prior !== undefined && prior !== t.to) throw new Error(`defineMachine: (${t.from}, ${t.on}) is ambiguous`);
    table.set(key, t.to);
  }
  const states = new Set<string>(def.transitions.flatMap((t) => [t.from, t.to]));
  if (!states.has(def.initial)) throw new Error(`defineMachine: initial ${def.initial} not in transitions`);
  for (const t of def.terminal) if (!states.has(t)) throw new Error(`defineMachine: terminal ${t} unreachable`);
  return table;
}

export function defineMachine<const S extends string, const E extends string>(def: MachineDef<S, E>): Machine<S, E> {
  const table = validate(def);
  const terminal = new Set<string>(def.terminal);
  const states = [...new Set(def.transitions.flatMap((t) => [t.from, t.to]))];
  const lookup = (state: S, event: E): S | undefined => table.get(`${state}\u0000${event}`);
  return Object.freeze({
    initial: def.initial,
    terminal: def.terminal,
    transitions: def.transitions,
    states,
    can: (state: S, event: E) => lookup(state, event) !== undefined,
    next: (state: S, event: E): Result<S, AppError> => {
      const to = lookup(state, event);
      return to === undefined ? err(appError('CONFLICT_STATE', { params: { state, event } })) : ok(to);
    },
    isTerminal: (state: S) => terminal.has(state),
    edges: () => def.transitions.map((t) => `${t.from} -> ${t.to}`),
  });
}
