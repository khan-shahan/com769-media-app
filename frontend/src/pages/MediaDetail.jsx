// frontend/src/pages/MediaDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";

import {
  getMediaById,
  getComments,
  getRatings,
  postComment,
  postRating,
} from "../services/mediaApi";

// 🔹 For now this is “the current user name”.
//    Change this later when you plug in real auth.
const DEFAULT_AUTHOR = "shahan";

// Compute rating stats where each author counts only once (latest rating wins)
function computeUniqueAuthorStats(ratingData) {
  const list = Array.isArray(ratingData?.ratings)
    ? ratingData.ratings
    : [];

  const byAuthor = new Map();

  for (const r of list) {
    const nameRaw = r.author || r.username || "anonymous";
    const name = String(nameRaw || "").trim() || "anonymous";

    const score = Number(
      r.score ??
        r.stars ??
        r.value ??
        r.rating ??
        r.scoreValue ??
        0
    );
    if (!Number.isFinite(score)) continue;

    // last rating from this author wins
    byAuthor.set(name, score);
  }

  const values = [...byAuthor.values()];
  const count = values.length;
  const avg =
    count === 0 ? 0 : values.reduce((sum, v) => sum + v, 0) / count;

  return { avg, count };
}

export default function MediaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [media, setMedia] = useState(null);
  const [comments, setComments] = useState([]);
  const [ratingStats, setRatingStats] = useState(null); // { avg, count }

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [commentDraft, setCommentDraft] = useState("");
  const [ratingDraft, setRatingDraft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function loadAll() {
    if (!id) {
      setErr(new Error("Missing media id"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErr(null);
      setMessage("");

      const [mediaData, commentData, ratingData] = await Promise.all([
        getMediaById(id),
        getComments(id),
        getRatings(id),
      ]);

      setMedia(mediaData || null);
      setComments(Array.isArray(commentData) ? commentData : []);

      const stats = computeUniqueAuthorStats(ratingData);
      setRatingStats(stats);
    } catch (e) {
      console.error(e);
      setErr(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmitRating = async () => {
    if (!ratingDraft) return;
    if (!id) return;

    const author = DEFAULT_AUTHOR; // 🔹 use current user name here

    try {
      setSubmitting(true);
      setMessage("");

      await postRating(id, { author, stars: ratingDraft });

      const ratingData = await getRatings(id);
      const stats = computeUniqueAuthorStats(ratingData);
      setRatingStats(stats);

      setMessage("Rating submitted ✅");
    } catch (e) {
      console.error(e);
      setMessage("Could not submit rating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitComment = async () => {
    const text = commentDraft.trim();
    if (!text) return;
    if (!id) return;

    const author = DEFAULT_AUTHOR; // 🔹 use current user name here

    try {
      setSubmitting(true);
      setMessage("");

      await postComment(id, { author, text });

      const newComments = await getComments(id);
      setComments(Array.isArray(newComments) ? newComments : []);

      setCommentDraft("");
      setMessage("Comment added 💬");
    } catch (e) {
      console.error(e);
      setMessage("Could not submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  const isVideo = media?.mediaType === "video";
  const mediaUrl = media?.accessUrl || media?.blobUrl;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Media Detail"
        subtitle="View a media item, its metadata, and user engagement (comments + ratings)."
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => navigate("/scroll")}>
              ← Back to Scroll
            </Button>
            <Button variant="secondary" onClick={loadAll} disabled={loading}>
              Refresh
            </Button>
          </div>
        }
      />

      <ErrorBanner error={err} />

      <Card>
        {loading && !media ? (
          <div>Loading media…</div>
        ) : !media ? (
          <div>Media not found.</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {/* Media preview */}
            <div
              style={{
                borderRadius: 16,
                overflow: "hidden",
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxHeight: "70vh",
              }}
            >
              {mediaUrl ? (
                isVideo ? (
                  <video
                    src={mediaUrl}
                    controls
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      backgroundColor: "black",
                    }}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={media.title || "Media"}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                )
              ) : (
                <div
                  style={{
                    color: "#e5e7eb",
                    fontSize: 14,
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  Media URL missing
                </div>
              )}
            </div>

            {/* Metadata */}
            <div>
              <h2
                style={{
                  margin: "0 0 4px",
                  fontSize: 22,
                }}
              >
                {media.title || "(untitled)"}
              </h2>
              <div
                style={{
                  fontSize: 13,
                  opacity: 0.7,
                  marginBottom: 8,
                }}
              >
                {media.mediaType || "media"}
              </div>
              {media.caption && (
                <p
                  style={{
                    margin: "0 0 6px",
                    fontSize: 14,
                  }}
                >
                  {media.caption}
                </p>
              )}
              {media.location && (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                  }}
                >
                  <strong>Location:</strong> {media.location}
                </div>
              )}
              {Array.isArray(media.people) && media.people.length > 0 && (
                <div
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                    marginTop: 4,
                  }}
                >
                  <strong>People:</strong> {media.people.join(", ")}
                </div>
              )}
            </div>

            {/* Ratings */}
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.06)",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  Ratings
                </span>
                <span
                  style={{
                    fontSize: 13,
                    opacity: 0.8,
                  }}
                >
                  {ratingStats
                    ? `Average: ${ratingStats.avg.toFixed(
                        1
                      )}★ (${ratingStats.count} rating${
                        ratingStats.count === 1 ? "" : "s"
                      })`
                    : "No ratings yet"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRatingDraft(value)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 999,
                      border:
                        ratingDraft === value
                          ? "1px solid #111827"
                          : "1px solid #d1d5db",
                      backgroundColor:
                        ratingDraft === value ? "#111827" : "#ffffff",
                      color:
                        ratingDraft === value ? "#ffffff" : "#111827",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                    disabled={submitting}
                  >
                    {value}★
                  </button>
                ))}

                <button
                  type="button"
                  onClick={handleSubmitRating}
                  style={{
                    marginLeft: 8,
                    padding: "4px 10px",
                    borderRadius: 999,
                    border: "none",
                    backgroundColor: "#111827",
                    color: "#ffffff",
                    fontSize: 13,
                    cursor: "pointer",
                    opacity: ratingDraft ? 1 : 0.5,
                  }}
                  disabled={submitting || !ratingDraft}
                >
                  {submitting ? "Saving…" : "Submit"}
                </button>
              </div>
            </div>

            {/* Comments */}
            <div
              style={{
                borderTop: "1px solid rgba(0,0,0,0.06)",
                paddingTop: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Comments
              </span>

              <div
                style={{
                  maxHeight: 220,
                  overflowY: "auto",
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  padding: 8,
                  backgroundColor: "#f9fafb",
                  fontSize: 13,
                }}
              >
                {comments.length === 0 ? (
                  <div style={{ opacity: 0.7 }}>No comments yet.</div>
                ) : (
                  comments.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginBottom: 6,
                        paddingBottom: 6,
                        borderBottom:
                          idx === comments.length - 1
                            ? "none"
                            : "1px solid #e5e7eb",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 12,
                          opacity: 0.85,
                          marginBottom: 2,
                        }}
                      >
                        {c.author || c.username || "User"}
                      </div>
                      <div>{c.text || c.comment}</div>
                    </div>
                  ))
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <textarea
                  rows={3}
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  placeholder="Write a comment…"
                  style={{
                    resize: "vertical",
                    minHeight: 60,
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    padding: 8,
                    fontSize: 13,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                  disabled={submitting}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleSubmitComment}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "none",
                      backgroundColor: "#111827",
                      color: "#ffffff",
                      fontSize: 13,
                      cursor: "pointer",
                      opacity: commentDraft.trim() ? 1 : 0.5,
                    }}
                    disabled={submitting || !commentDraft.trim()}
                  >
                    {submitting ? "Posting…" : "Post comment"}
                  </button>

                  {message && (
                    <span
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      {message}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
