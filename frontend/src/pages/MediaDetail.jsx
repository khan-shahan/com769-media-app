import { useParams, Link } from "react-router-dom";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";

export default function MediaDetail() {
  const { id } = useParams();

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Media Detail"
        subtitle="View a media item, its metadata, and user engagement (comments + ratings)."
      />

      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
        <Card>
          <div style={{ height: 320, borderRadius: 12, background: "rgba(0,0,0,0.06)" }} />
          <p style={{ marginBottom: 0, opacity: 0.75 }}>
            Placeholder preview area (photo/video player will be added in Step 4.9).
          </p>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Metadata</h3>
          <p style={{ margin: "6px 0", opacity: 0.8 }}>
            <b>Media ID:</b> {id}
          </p>
          <p style={{ margin: "6px 0", opacity: 0.8 }}>
            <b>Title:</b> (coming soon)
          </p>
          <p style={{ margin: "6px 0", opacity: 0.8 }}>
            <b>Location:</b> (coming soon)
          </p>
          <p style={{ margin: "6px 0", opacity: 0.8 }}>
            <b>People:</b> (coming soon)
          </p>
          <Link to="/feed">← Back to Feed</Link>
        </Card>
      </div>

      <Card>
        <h3 style={{ marginTop: 0 }}>Comments & Ratings</h3>
        <p style={{ marginBottom: 0, opacity: 0.75 }}>
          Placeholder – will be connected to POST /media/:id/comments and POST /media/:id/ratings in Step 4.9.
        </p>
      </Card>
    </div>
  );
}
