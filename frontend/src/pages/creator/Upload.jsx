import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";

export default function Upload() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Creator Upload"
        subtitle="Upload photos and videos securely using Azure Blob Storage SAS URLs."
      />

      <Card>
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontWeight: 600 }}>Media File</label>
            <input type="file" style={{ display: "block", marginTop: 6 }} />
          </div>

          <div>
            <label style={{ fontWeight: 600 }}>Title</label>
            <input
              placeholder="e.g., Birmingham City Centre"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                marginTop: 6,
              }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 600 }}>Caption</label>
            <textarea
              placeholder="Short description..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                marginTop: 6,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 600 }}>Location</label>
              <input
                placeholder="e.g., Birmingham"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: "none",
                  marginTop: 6,
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 600 }}>People (comma-separated)</label>
              <input
                placeholder="e.g., Shahan, Ali"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: "none",
                  marginTop: 6,
                }}
              />
            </div>
          </div>

          <button
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "rgba(0,0,0,0.9)",
              color: "white",
              cursor: "pointer",
              fontWeight: 700,
              marginTop: 4,
              width: "fit-content",
            }}
          >
            Upload (Coming Soon)
          </button>
        </div>
      </Card>
    </div>
  );
}
