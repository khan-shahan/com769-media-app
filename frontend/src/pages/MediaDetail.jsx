import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import ErrorBanner from "../components/common/ErrorBanner";

import {
  getMediaByIdFallback,
  listComments,
  addComment,
  getRatingSummary,
  addRating,
} from "../services/mediaApi";

export default function MediaDetail() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loadingItem, setLoadingItem] = useState(true);
  const [err, setErr] = useState(null);

  const [comments, setComments] = useState([]);
  const [ratingSummary, setRatingSummary] = useState(null);
  const [loadingEngagement, setLoadingEngagement] = useState(true);

  const [name, setName] = useState("Shahan");
  const [text, setText] = useState("");
  const [rating, setRating] = useState(5);

  async function loadAll() {
    try {
      setErr(null);
      setLoadingItem(true);
      setLoadingEngagement(true);

      const media = await getMediaByIdFallback(id);
      setItem(media);

      const [c, r] = await Promise.all([
        listComments(id).catch(() => []),
        getRatingSummary(id).catch(() => null),
      ]);

      setComments(Array.isArray(c) ? c : []);
      setRatingSummary(r);
    } catch (e) {
      setErr(e);
    } finally {
      setLoadingItem(false);
      setLoadingEngagement(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function submitComment(e) {
    e.preventDefault();
    try {
      setErr(null);
      if (!text.trim()) return;

      await addComment(id, {
        name: name.trim() || "Anonymous",
        text: text.trim(),
      });

      setText("");
      const c = await listComments(id);
      setComments(Array.isArray(c) ? c : []);
    } catch (e) {
      setErr(e);
    }
  }

  async function submitRating(e) {
    e.preventDefault();
    try {
      setErr(null);
      await addRating(id, {
        name: name.trim() || "Anonymous",
        rating: Number(rating),
      });

      const r = await getRatingSummary(id);
      setRatingSummary(r);
    } catch (e) {
      setErr(e);
    }
  }

  const mediaUrl = item?.accessUrl || item?.blobUrl;
  const isVideo = item?.mediaType === "video";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Media Detail"
        subtitle="View a media item, its metadata, and user engagement (comments + ratings)."
        actions={
          <Link to="/feed" style={{ textDecoration: "none" }}>
            ← Back to Feed
          </Link>
        }
      />

      <ErrorBanner error={err} />

      {loadingItem ? (
        <Card>Loading media...</Card>
      ) : !item ? (
        <Card>Media not found (it may have been deleted).</Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
          <Card>
            {mediaUrl ? (
              isVideo ? (
                <video
                  src={mediaUrl}
                  controls
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.06)",
                  }}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={item.title || "media"}
                  style={{
                    width: "100%",
                    borderRadius: 14,
                    display: "block",
                  }}
                />
              )
            ) : (
              <div style={{ opacity: 0.7 }}>No media URL available for preview.</div>
            )}
          </Card>

          <Card>
            <h3 style={{ marginTop: 0 }}>Metadata</h3>
            <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
              <div>
                <b>Media ID:</b> {item.id}
              </div>
              <div>
                <b>Title:</b> {item.title || "-"}
              </div>
              <div>
                <b>Type:</b> {item.mediaType || "-"}
              </div>
              <div>
                <b>Location:</b> {item.location || "-"}
              </div>
              <div>
                <b>People:</b> {item.people?.length ? item.people.join(", ") : "-"}
              </div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                <b>Created:</b> {item.createdAt || "-"}
              </div>
            </div>
          </Card>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Comments</h3>

          <form onSubmit={submitComment} style={{ display: "grid", gap: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
              }}
            />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                resize: "vertical",
              }}
            />
            <button type="submit" style={{ padding: "10px 12px", borderRadius: 12 }}>
              Post Comment
            </button>
          </form>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {loadingEngagement ? (
              <div style={{ opacity: 0.7 }}>Loading comments…</div>
            ) : comments.length === 0 ? (
              <div style={{ opacity: 0.7 }}>No comments yet.</div>
            ) : (
              comments.map((c, idx) => (
                <div
                  key={idx}
                  style={{
                    borderTop: "1px solid rgba(0,0,0,0.08)",
                    paddingTop: 10,
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{c.name || "Anonymous"}</div>
                  <div style={{ opacity: 0.85 }}>{c.text}</div>
                  {c.createdAt ? (
                    <div style={{ opacity: 0.6, fontSize: 12 }}>{c.createdAt}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Ratings</h3>

          <form onSubmit={submitRating} style={{ display: "grid", gap: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
              }}
            />

            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} star{n > 1 ? "s" : ""}
                </option>
              ))}
            </select>

            <button type="submit" style={{ padding: "10px 12px", borderRadius: 12 }}>
              Submit Rating
            </button>
          </form>

          <div style={{ marginTop: 12, opacity: 0.8 }}>
            {loadingEngagement ? (
              "Loading rating summary…"
            ) : ratingSummary ? (
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                {JSON.stringify(ratingSummary, null, 2)}
              </pre>
            ) : (
              "No ratings yet."
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
