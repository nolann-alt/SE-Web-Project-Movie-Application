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

export async function registerUser(email, password, username) {
  const normalizedUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(normalizedUsername)) {
    return {
      success: false,
      error: "Username must be 3 to 20 letters, numbers, or underscores.",
    };
  }

  try {
    const { data, error } = await getSupabaseClient().auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { username: normalizedUsername } },
    });

    if (error) {
      const errorMessage = error.message.toLowerCase();
      const message = errorMessage.includes("username is already taken")
        || errorMessage.includes("profiles_username_lower_uidx")
        ? "That username is already taken. Please choose another."
        : errorMessage.includes("database error saving new user")
          ? "Unable to create the account. The email may already be registered or the username may be taken."
          : error.message;
      return { success: false, error: message };
    }
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
