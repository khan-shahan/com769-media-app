// frontend/src/services/authApi.js
import { http } from "./http";

/**
 * Check if a username is available.
 * Returns: { ok: boolean, available?: boolean, reason?: string, error?: string }
 */
export async function checkUsername(username) {
  return http("/auth/check-username", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
}

/**
 * Signup a new user.
 * Body: { username, email, password }
 * Returns: { token, user: { id, username, email } }
 */
export async function signup({ username, email, password }) {
  return http("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

/**
 * Login with email + password.
 * Returns: { token, user: { id, username, email } }
 */
export async function login({ email, password }) {
  return http("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
