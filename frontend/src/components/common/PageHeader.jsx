export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 44, letterSpacing: -0.6 }}>{title}</h1>
          {subtitle ? (
            <p style={{ marginTop: 8, marginBottom: 0, opacity: 0.75, maxWidth: 780 }}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {actions ? <div style={{ display: "flex", gap: 10 }}>{actions}</div> : null}
      </div>
    </div>
  );
}
