import { Link } from "react-router-dom";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";

export default function MyUploads() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="My Uploads"
        subtitle="A creator-only view of uploaded media. This will load from the API in Step 4.8."
        actions={
          <Link to="/creator/upload" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Upload New
            </button>
          </Link>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        <Card>
          <div style={{ height: 140, borderRadius: 12, background: "rgba(0,0,0,0.06)" }} />
          <h3 style={{ marginBottom: 6 }}>Sample Upload</h3>
          <p style={{ marginTop: 0, opacity: 0.7, fontSize: 14 }}>
            Placeholder card – will be replaced with creator uploads.
          </p>
        </Card>
      </div>
    </div>
  );
}
