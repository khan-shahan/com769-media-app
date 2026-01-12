export default function Button({ children, onClick, type = "button", variant = "primary", disabled }) {
  const base = {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontWeight: 600,
    opacity: disabled ? 0.6 : 1,
    userSelect: "none",
  };

  const styles =
    variant === "primary"
      ? { ...base, background: "rgba(0,0,0,0.9)", color: "white" }
      : { ...base, background: "white", color: "rgba(0,0,0,0.85)" };

  return (
    <button type={type} onClick={disabled ? undefined : onClick} style={styles} disabled={disabled}>
      {children}
    </button>
  );
}
