/**
 * Wrapper for socket callbacks to ensure client side
 * is handled even when server fails to respond
 *
 * @param onSuccess callback that executes when server successfully responds
 * @param onTimeout callback that executes when server fails to respond
 */
const withTimeout = (onSuccess: Function, onTimeout: () => void) => {
  const ACKNOWLEDGMENT_TIMEOUT = 5000;
  let called = false;

  const timer = setTimeout(() => {
    if (called) return;
    called = true;
    onTimeout();
  }, ACKNOWLEDGMENT_TIMEOUT);

  return (...args: any[]) => {
    if (called) return;
    called = true;
    clearTimeout(timer);
    onSuccess.apply(this, args);
  }
}

export { withTimeout };