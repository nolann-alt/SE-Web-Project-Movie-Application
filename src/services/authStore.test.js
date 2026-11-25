import assert from "node:assert/strict";
import test from "node:test";
import { createAuthStore } from "./authStore.js";

function createMockSupabase(sessionPromise = Promise.resolve({
  data: { session: null },
  error: null,
})) {
  const listeners = new Set();
  let unsubscribed = false;

  return {
    auth: {
      getSession: () => sessionPromise,
      onAuthStateChange: (listener) => {
        listeners.add(listener);
        return {
          data: {
            subscription: {
              unsubscribe() {
                unsubscribed = true;
                listeners.delete(listener);
              },
            },
          },
        };
      },
    },
    emit(event, session) {
      listeners.forEach((listener) => listener(event, session));
    },
    get unsubscribed() {
      return unsubscribed;
    },
  };
}

test("restores a saved session before finishing initialization", async () => {
  const user = { id: "user-1", email: "movie@example.com" };
  const supabase = createMockSupabase(Promise.resolve({
    data: { session: { user } },
    error: null,
  }));
  const store = createAuthStore(supabase);
  const stop = store.start();

  assert.equal(store.getSnapshot().isLoading, true);
  await Promise.resolve();
  assert.deepEqual(store.getSnapshot(), { user, isLoading: false, error: null });

  stop();
  assert.equal(supabase.unsubscribed, true);
});

test("publishes sign-in and sign-out changes and ignores stale session restoration", async () => {
  let resolveSession;
  const sessionPromise = new Promise((resolve) => {
    resolveSession = resolve;
  });
  const supabase = createMockSupabase(sessionPromise);
  const store = createAuthStore(supabase);
  const stop = store.start();
  const signedInUser = { id: "user-2", email: "new@example.com" };

  supabase.emit("SIGNED_IN", { user: signedInUser });
  assert.deepEqual(store.getSnapshot(), {
    user: signedInUser,
    isLoading: false,
    error: null,
  });

  resolveSession({
    data: { session: { user: { id: "old-user", email: "old@example.com" } } },
    error: null,
  });
  await Promise.resolve();
  assert.equal(store.getSnapshot().user.id, signedInUser.id);

  supabase.emit("SIGNED_OUT", null);
  assert.deepEqual(store.getSnapshot(), { user: null, isLoading: false, error: null });

  stop();
  assert.equal(supabase.unsubscribed, true);
});
