import { prepareMatchingRequest, parseMatchingResponse, type MatchingInput, type MatchingOutcome } from './matching-worker-protocol.ts';

export interface MatchingWorkerPort {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(value: unknown): void;
  terminate(): void;
}
export const MATCH_WORKER_TIMEOUT_MS = 60_000;
export class MatchingWorkerError extends Error {
  readonly code: 'CANCELLED' | 'UNAVAILABLE' | 'TIMEOUT' | 'FAILED' | 'INVALID_INPUT';
  constructor(code: MatchingWorkerError['code']) {
    super({ CANCELLED: 'Matching was cancelled.', UNAVAILABLE: 'Background matching is unavailable in this browser. Reload the app or use a browser with module worker support.', TIMEOUT: 'Matching exceeded its time limit. Reduce retained records and retry.', FAILED: 'Matching failed. Review the signed records and retry.', INVALID_INPUT: 'Matching input exceeds its limits or has an invalid policy.' }[code]);
    this.name = 'MatchingWorkerError';
    this.code = code;
  }
}
export function createMatchingWorkerClient(factory: () => MatchingWorkerPort = () => new Worker(new URL('./matching-worker.js', import.meta.url), { type: 'module', name: 'classrup-barter-matching' })) {
  let disposed = false;
  let generation = 0;
  let cancelPending: (() => void) | undefined;
  const cancel = (): void => { generation++; cancelPending?.(); };
  return {
    cancel,
    dispose(): void { disposed = true; cancel(); },
    async run(input: MatchingInput): Promise<MatchingOutcome> {
      if (disposed) throw new MatchingWorkerError('CANCELLED');
      cancel();
      const id = generation;
      let request;
      try {
        request = await prepareMatchingRequest(input, id, () => {
          if (disposed || id !== generation) throw new MatchingWorkerError('CANCELLED');
        });
      } catch (error) {
        throw error instanceof MatchingWorkerError ? error : new MatchingWorkerError('INVALID_INPUT');
      }
      if (disposed || id !== generation) throw new MatchingWorkerError('CANCELLED');
      let worker: MatchingWorkerPort;
      try { worker = factory(); } catch { throw new MatchingWorkerError('UNAVAILABLE'); }
      return new Promise<MatchingOutcome>((resolve, reject) => {
        let settled = false;
        const finish = (outcome?: MatchingOutcome, code?: MatchingWorkerError['code']): void => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null;
          worker.terminate();
          if (cancelPending === cancelThis) cancelPending = undefined;
          if (code) reject(new MatchingWorkerError(code));
          else resolve(outcome!);
        };
        const cancelThis = (): void => finish(undefined, 'CANCELLED');
        const timeout = setTimeout(() => finish(undefined, 'TIMEOUT'), MATCH_WORKER_TIMEOUT_MS);
        cancelPending = cancelThis;
        worker.onmessage = event => {
          if (settled || disposed || id !== generation) return;
          try {
            const response = parseMatchingResponse(event.data);
            if (response.id !== id) { finish(undefined, 'FAILED'); return; }
            if (response.kind === 'error') finish(undefined, response.code === 'INVALID_INPUT' ? 'INVALID_INPUT' : 'FAILED');
            else finish(response.outcome);
          } catch { finish(undefined, 'FAILED'); }
        };
        worker.onerror = () => finish(undefined, 'FAILED');
        worker.onmessageerror = () => finish(undefined, 'FAILED');
        try { worker.postMessage(request); } catch { finish(undefined, 'FAILED'); }
      });
    },
  };
}
