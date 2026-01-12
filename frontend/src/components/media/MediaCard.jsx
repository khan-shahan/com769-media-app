// frontend/src/components/media/MediaCard.jsx
import { Link } from "react-router-dom";

export default function MediaCard({ item }) {
  if (!item) return null;

  const mediaUrl = item.accessUrl || item.blobUrl;
  const isVideo = item.mediaType === "video";

  return (
    <Link
      to={`/media/${item.id}`}
      style={{
        display: "block",
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        background: "#0f172a",
        textDecoration: "none",
        color: "inherit",
        boxShadow:
          "0 4px 12px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 180,          // Thumbnail height
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
        }}
      >
        {mediaUrl ? (
          isVideo ? (
            <video
              src={mediaUrl}
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",  // <<< FIX (no more zoom)
                backgroundColor: "#000",
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={item.title || "Media"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain", // <<< FIX (no cropping)
                backgroundColor: "#000",
                display: "block",
              }}
            />
          )
        ) : (
          <div
            style={{
              color: "#ffffffff",
              fontSize: 12,
              textAlign: "center",
              padding: 20,
            }}
          >
            No preview available
          </div>
        )}
      </div>

      <div style={{ padding: "8px 10px" }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 2,
          }}
        >
          {item.title || "(untitled)"}
        </div>
        <div
          style={{
            fontSize: 12,
            opacity: 0.7,
          }}
        >
          {item.mediaType}
        </div>
      </div>
    </Link>
  );
}
