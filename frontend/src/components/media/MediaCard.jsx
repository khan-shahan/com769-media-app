import { Link } from "react-router-dom";
import Card from "../common/Card";

export default function MediaCard({ item }) {
  const isVideo = item.mediaType === "video";
  const previewUrl = item.accessUrl || item.blobUrl;

  return (
    <Link
      to={`/media/${encodeURIComponent(item.id)}`}
      style={{ textDecoration: "none", color: "inherit" }}
    >
      <Card>
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(0,0,0,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isVideo ? (
              <div style={{ fontWeight: 700, opacity: 0.75 }}>Video</div>
            ) : (
              <img
                src={previewUrl}
                alt={item.title}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                loading="lazy"
              />
            )}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "flex-end",
            }}
          >
            <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{item.title}</div>
            <div style={{ fontSize: 12, opacity: 0.7, whiteSpace: "nowrap" }}>
              {item.mediaType}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
