export const MIN_PASSWORD_LENGTH = 12;

const SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{};':\"|<>?,./`~\\";

export function getPasswordValidationError(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must include at least one number.";
  }

  if (![...SPECIAL_CHARACTERS].some((character) => password.includes(character))) {
    return "Password must include at least one symbol.";
  }

  return null;
}
