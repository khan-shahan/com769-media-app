// frontend/src/pages/creator/MyUploads.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import ErrorBanner from "../../components/common/ErrorBanner";
import { getMedia, deleteMedia } from "../../services/mediaApi";
import { useAuth } from "../../context/AuthContext";

export default function MyUploads() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);

      // If not logged in, don't try to load
      if (!isAuthenticated || !user) {
        setItems([]);
        return;
      }

      const all = await getMedia();
      setItems(Array.isArray(all) ? all : []);
    } catch (e) {
      console.error(e);
      setErr(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user?.id]);

  // Only show media that belong to the current logged-in user
  const myItems = useMemo(() => {
    if (!user) return [];
    return items.filter((m) => m.ownerId === user.id);
  }, [items, user]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this media permanently?")) return;

    try {
      setDeletingId(id);
      await deleteMedia(id);
      setItems((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      console.error(e);
      alert("Could not delete media.");
    } finally {
      setDeletingId(null);
    }
  };

  // ---------- RENDER STATES ----------

  if (authLoading || loading) {
    return <div>Loading your uploads…</div>;
  }

  if (!isAuthenticated || !user) {
    return (
      <div
        style={{
          padding: 16,
          borderRadius: 12,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          fontSize: 14,
        }}
      >
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>My Uploads</h1>
        <p style={{ margin: 0 }}>Please sign in to view and manage your uploads.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>My Uploads</h1>
        <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>
          View and manage media items that you have uploaded with your account.
        </p>
      </div>

      <ErrorBanner error={err} />

      <div
        style={{
          padding: 10,
          fontSize: 12,
          borderRadius: 999,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
        }}
      >
        Showing only media where <code>ownerId = {user.id}</code>. Media that
        were uploaded before accounts were added (and have no ownerId) will not
        appear here.
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          type="button"
          onClick={load}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#111827",
            color: "#ffffff",
            fontSize: 13,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {myItems.length === 0 ? (
        <div
          style={{
            padding: 16,
            borderRadius: 12,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            fontSize: 14,
          }}
        >
          You don&apos;t have any uploads yet with this account. Try uploading a
          photo or video from the <strong>Creator Upload</strong> page.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {myItems.map((item) => {
            const isVideo = item.mediaType === "video";
            const thumbUrl = item.accessUrl || item.blobUrl;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                style={{
                  borderRadius: 16,
                  background: "#ffffff",
                  boxShadow:
                    "0 10px 30px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.06)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    height: 160,
                    background: "#020617",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {thumbUrl ? (
                    isVideo ? (
                      <video
                        src={thumbUrl}
                        muted
                        playsInline
                        controls={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          backgroundColor: "black",
                        }}
                      />
                    ) : (
                      <img
                        src={thumbUrl}
                        alt={item.title || "media"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                          backgroundColor: "black",
                        }}
                      />
                    )
                  ) : (
                    <div
                      style={{
                        color: "#e5e7eb",
                        fontSize: 13,
                        opacity: 0.8,
                      }}
                    >
                      No preview
                    </div>
                  )}
                </div>

                {/* Info + actions */}
                <div
                  style={{
                    padding: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      marginBottom: 2,
                    }}
                  >
                    {item.title || "(untitled)"}
                  </div>

                  {item.caption && (
                    <div style={{ opacity: 0.8 }}>{item.caption}</div>
                  )}

                  <div style={{ opacity: 0.7 }}>
                    <strong>Type:</strong> {item.mediaType}
                  </div>

                  {item.location && (
                    <div style={{ opacity: 0.7 }}>
                      <strong>Location:</strong> {item.location}
                    </div>
                  )}

                  <div style={{ opacity: 0.7 }}>
                    <strong>Uploaded:</strong>{" "}
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "unknown"}
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <Link
                      to={`/creator/edit/${item.id}`}
                      style={{
                        flex: 1,
                        textAlign: "center",
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "none",
                        backgroundColor: "#111827",
                        color: "#ffffff",
                        fontSize: 13,
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      Edit
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      style={{
                        flex: 1,
                        padding: "6px 10px",
                        borderRadius: 999,
                        border: "none",
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        fontSize: 13,
                        cursor: "pointer",
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
