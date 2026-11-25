import { getSupabaseClient, supabase } from "./supabaseClient";

let currentSessionUser = null;

function notifyAuthUpdated() {
  window.dispatchEvent(new Event("filmsphere-auth-updated"));
  window.dispatchEvent(new Event("filmsphere-library-updated"));
}

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    currentSessionUser = session?.user ?? null;
    notifyAuthUpdated();
  });
}

export async function registerUser(email, password) {
  try {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return { success: false, error: error.message };
    return { success: true, needsEmailConfirmation: !data.session };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to create your account.",
    };
  }
}

export async function loginUser(email, password) {
  try {
    const { error } = await getSupabaseClient().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to log in.",
    };
  }
}

export function getCurrentUser() {
  return currentSessionUser?.email ?? null;
}

export function getCurrentUserId() {
  return currentSessionUser?.id ?? null;
}

export async function logoutUser() {
  try {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to log out.",
    };
  }
}
