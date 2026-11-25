import assert from "node:assert/strict";
import test from "node:test";
import { getPasswordValidationError, MIN_PASSWORD_LENGTH } from "./passwordPolicy.js";

test("rejects passwords shorter than the minimum", () => {
  const expectedError = "Password must be at least 12 characters.";

  assert.equal(getPasswordValidationError("123456"), expectedError);
  assert.equal(
    getPasswordValidationError("x".repeat(MIN_PASSWORD_LENGTH - 1)),
    expectedError,
  );
});

test("requires uppercase, lowercase, number, and symbol characters", () => {
  assert.equal(
    getPasswordValidationError("password1234!"),
    "Password must include at least one uppercase letter.",
  );
  assert.equal(
    getPasswordValidationError("PASSWORD1234!"),
    "Password must include at least one lowercase letter.",
  );
  assert.equal(
    getPasswordValidationError("PasswordAbc!"),
    "Password must include at least one number.",
  );
  assert.equal(
    getPasswordValidationError("Password1234"),
    "Password must include at least one symbol.",
  );
});

test("accepts a password meeting every requirement", () => {
  assert.equal(getPasswordValidationError("Password1234!"), null);
});

test("rejects non-string password values", () => {
  assert.equal(
    getPasswordValidationError(null),
    "Password must be at least 12 characters.",
  );
});
