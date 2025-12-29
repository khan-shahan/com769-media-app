import { Link } from "react-router-dom";

export default function MediaCard({ item }) {
  const isVideo = item?.mediaType === "video";
  const thumbUrl = item?.accessUrl || item?.blobUrl;

  return (
    <Link to={`/media/${item.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: 14,
          overflow: "hidden",
          background: "white",
          boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ height: 150, background: "rgba(0,0,0,0.04)", display: "grid", placeItems: "center" }}>
          {!thumbUrl ? (
            <div style={{ opacity: 0.7, fontWeight: 600 }}>{isVideo ? "Video" : "Photo"}</div>
          ) : isVideo ? (
            <video
              src={thumbUrl}
              muted
              playsInline
              preload="metadata"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <img
              src={thumbUrl}
              alt={item?.title || "media"}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          )}
        </div>

        <div style={{ padding: 12, display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 700, lineHeight: 1.2 }}>
            {item?.title || "(untitled)"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7, textTransform: "lowercase" }}>
            {item?.mediaType || "media"}
          </div>
        </div>
      </div>
    </Link>
  );
}
