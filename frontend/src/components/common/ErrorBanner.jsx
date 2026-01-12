export default function ErrorBanner({ error }) {
  if (!error) return null;

  return (
    <div
      style={{
        background: "rgba(255,0,0,0.06)",
        border: "1px solid rgba(255,0,0,0.15)",
        color: "rgba(0,0,0,0.85)",
        borderRadius: 14,
        padding: 12,
      }}
    >
      <b>Something went wrong:</b>
      <div style={{ marginTop: 6, opacity: 0.8 }}>
        {error.message || String(error)}
      </div>
    </div>
  );
}
