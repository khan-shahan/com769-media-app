import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";

export default function Feed() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Feed"
        subtitle="Browse and search media content. The live feed will be connected to the Azure Functions API in the next steps."
      />

      <Card>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            placeholder="Search by title, caption, location, or people..."
            style={{
              flex: 1,
              minWidth: 260,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              outline: "none",
            }}
          />
          <button
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Search
          </button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 14 }}>
        <Card>
          <div style={{ height: 140, borderRadius: 12, background: "rgba(0,0,0,0.06)" }} />
          <h3 style={{ marginBottom: 6 }}>Sample Media Item</h3>
          <p style={{ marginTop: 0, opacity: 0.7, fontSize: 14 }}>
            Placeholder card – real data will load from GET /media.
          </p>
        </Card>

        <Card>
          <div style={{ height: 140, borderRadius: 12, background: "rgba(0,0,0,0.06)" }} />
          <h3 style={{ marginBottom: 6 }}>Sample Media Item</h3>
          <p style={{ marginTop: 0, opacity: 0.7, fontSize: 14 }}>
            Placeholder card – supports photos and videos.
          </p>
        </Card>
      </div>
    </div>
  );
}
