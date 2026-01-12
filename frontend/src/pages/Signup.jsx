// frontend/src/pages/Signup.jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkUsername } from "../services/authApi";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState("idle"); // idle | checking | available | taken | invalid | error
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Debounced username availability check
  useEffect(() => {
    if (!username || username.trim().length < 3) {
      if (username.trim().length === 0) {
        setUsernameStatus("idle");
      } else {
        setUsernameStatus("invalid");
      }
      return;
    }

    let cancelled = false;
    setUsernameStatus("checking");

    const handle = setTimeout(async () => {
      try {
        const res = await checkUsername(username.trim());
        if (cancelled) return;

        if (res.ok && typeof res.available === "boolean") {
          setUsernameStatus(res.available ? "available" : "taken");
        } else {
          setUsernameStatus("error");
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setUsernameStatus("error");
      }
    }, 400); // 400ms debounce

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [username]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username || username.trim().length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (usernameStatus === "taken") {
      setError("This username is already taken. Please choose another.");
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      // On success, send user to Scroll page
      navigate("/scroll");
    } catch (err) {
      console.error(err);
      const msg =
        err?.error ||
        err?.message ||
        "Signup failed. Please check your details and try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function renderUsernameHelp() {
    if (!username) return <span>Pick a unique name you like.</span>;

    switch (usernameStatus) {
      case "invalid":
        return <span style={{ color: "#b91c1c" }}>Min 3 characters.</span>;
      case "checking":
        return <span>Checking availability…</span>;
      case "available":
        return <span style={{ color: "#15803d" }}>Username is available ✅</span>;
      case "taken":
        return <span style={{ color: "#b91c1c" }}>Already taken. Try another.</span>;
      case "error":
        return <span style={{ color: "#b91c1c" }}>Could not check username.</span>;
      default:
        return <span>Pick a unique name you like.</span>;
    }
  }

  return (
    <div
      style={{
        maxWidth: 480,
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
        Sign up
      </h1>
      <p
        style={{
          marginTop: 0,
          marginBottom: 16,
          fontSize: 14,
          opacity: 0.8,
        }}
      >
        Create an account to upload media, rate videos, and leave comments with your
        username.
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
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. shahan"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
          <span style={{ fontSize: 12, opacity: 0.85 }}>
            {renderUsernameHelp()}
          </span>
        </label>

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
            placeholder="Min 6 characters"
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #d1d5db",
              fontSize: 14,
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 4, fontSize: 14 }}>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat your password"
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
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p
        style={{
          marginTop: 16,
          fontSize: 13,
          opacity: 0.85,
        }}
      >
        Already have an account?{" "}
        <Link to="/login" style={{ textDecoration: "underline" }}>
          Login
        </Link>
      </p>
    </div>
  );
}
