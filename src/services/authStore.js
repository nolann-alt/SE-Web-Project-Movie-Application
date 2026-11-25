export function createAuthStore(supabaseClient) {
  let snapshot = {
    user: null,
    isLoading: Boolean(supabaseClient),
    error: null,
  };
  let authEventVersion = 0;
  const listeners = new Set();

  function getSnapshot() {
    return snapshot;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function publish(user, isLoading = false, error = null) {
    snapshot = { user, isLoading, error };
    listeners.forEach((listener) => listener());
  }

  function notifyLegacyListeners() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event("filmsphere-auth-updated"));
    window.dispatchEvent(new Event("filmsphere-library-updated"));
  }

  function start() {
    if (!supabaseClient) {
      publish(null, false);
      return () => {};
    }

    publish(snapshot.user, true);
    const initialAuthEventVersion = authEventVersion;
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      (_event, session) => {
        authEventVersion += 1;
        publish(session?.user ?? null);
        notifyLegacyListeners();
      },
    );

    let isActive = true;
    supabaseClient.auth.getSession()
      .then(({ data, error }) => {
        if (!isActive || authEventVersion !== initialAuthEventVersion) return;
        if (error) {
          publish(null, false, error.message || "Unable to restore your session.");
          return;
        }
        publish(data.session?.user ?? null);
        notifyLegacyListeners();
      })
      .catch((error) => {
        if (!isActive || authEventVersion !== initialAuthEventVersion) return;
        publish(
          null,
          false,
          error instanceof Error ? error.message : "Unable to restore your session.",
        );
      });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }

  return { getSnapshot, subscribe, start };
}
