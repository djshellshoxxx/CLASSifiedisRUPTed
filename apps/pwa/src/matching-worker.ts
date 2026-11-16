import { executeMatchingRequest } from './matching-worker-protocol.ts';

// Dedicated one-run worker: the client terminates it after success, error, timeout or session end.
const scope = globalThis as unknown as {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(value: unknown): void;
};
let started = false;
scope.onmessage = event => {
  if (started) return;
  started = true;
  void executeMatchingRequest(event.data).then(response => scope.postMessage(response));
};
