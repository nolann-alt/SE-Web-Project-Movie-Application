export function createLatestRequest() {
  let activeController = null;

  function start() {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;

    return {
      signal: controller.signal,
      isCurrent: () =>
        activeController === controller && !controller.signal.aborted,
    };
  }

  function cancel() {
    activeController?.abort();
    activeController = null;
  }

  return { start, cancel };
}
