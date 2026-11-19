const USERS_STORAGE_KEY = "filmsphere-users";
const CURRENT_USER_STORAGE_KEY = "filmsphere-current-user";

function readUsers() {
  try {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    const users = storedUsers ? JSON.parse(storedUsers) : [];
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function registerUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return { success: false, error: "An account with this email already exists." };
  }

  const user = { email: normalizedEmail, password };
  saveUsers([...users, user]);
  localStorage.setItem(CURRENT_USER_STORAGE_KEY, normalizedEmail);

  return { success: true };
}

export function loginUser(email, password) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = readUsers().find(
    (storedUser) =>
      storedUser.email === normalizedEmail && storedUser.password === password,
  );

  if (!user) {
    return { success: false, error: "The email or password is incorrect." };
  }

  localStorage.setItem(CURRENT_USER_STORAGE_KEY, user.email);
  return { success: true };
}

export function getCurrentUser() {
  return localStorage.getItem(CURRENT_USER_STORAGE_KEY);
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
}
