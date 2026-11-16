/** Serialize accepted user actions; a failed action must not drop later file imports. */
export function createActionQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(action: () => Promise<T>): Promise<T> => {
    const result = tail.then(action);
    tail = result.catch(() => undefined);
    return result;
  };
}

/** A queued workspace action belongs only to the exact unlocked session that accepted it. */
export function bindActionsToSession<T>(enqueue: (action: () => Promise<void>) => Promise<void>, current: () => T | undefined) {
  return (action: () => Promise<void>): Promise<void> => {
    const session = current();
    if (session === undefined) return Promise.resolve();
    return enqueue(async () => { if (current() === session) await action(); });
  };
}
