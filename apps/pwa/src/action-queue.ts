/** Serialize accepted user actions; a failed action must not drop later file imports. */
export function createActionQueue() {
  let tail: Promise<unknown> = Promise.resolve();
  return <T>(action: () => Promise<T>): Promise<T> => {
    const result = tail.then(action);
    tail = result.catch(() => undefined);
    return result;
  };
}
