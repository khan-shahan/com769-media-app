// frontend/src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login({ email, password });
      // On success, go to Scroll page (or Feed if you prefer)
      navigate("/scroll");
    } catch (err) {
      console.error(err);
      const msg =
        err?.message ||
        err?.error ||
        "Login failed. Please check your credentials.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 420,
        margin: "0 auto",
        background: "#ffffff",
        padding: 24,
        borderRadius: 16,
        boxShadow:
          "0 10px 30px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.06)",
      }}
    >
      <h1
        style={{
          marginTop: 0,
          marginBottom: 8,
          fontSize: 24,
        }}
      >
        Login
      </h1>
      <p
        style={{
          marginTop: 0,
          marginBottom: 16,
          fontSize: 14,
          opacity: 0.8,
        }}
      >
        Sign in to rate videos, post comments, and manage your uploads.
      </p>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          style={{
            marginTop: 4,
            padding: "10px 14px",
            borderRadius: 999,
            border: "none",
            background: "#111827",
            color: "#ffffff",
            fontSize: 14,
            cursor: "pointer",
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? "Signing in…" : "Login"}
        </button>
      </form>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        Don&apos;t have an account?{" "}
        <Link to="/signup" style={{ textDecoration: "underline" }}>
          Sign up
        </Link>
      </p>
    </div>
  );
}
