// frontend/src/pages/MediaDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";

import {
  getMediaById,
  getComments,
  postComment,
  getRatings,
  postRating,
} from "../services/mediaApi";

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").replace("Z", " UTC");
}

export default function MediaDetail() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState({
    mediaId: id,
    count: 0,
    average: 0,
    ratings: [],
  });

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // comment form
  const [commentAuthor, setCommentAuthor] = useState("Shahan");
  const [commentText, setCommentText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);

  // rating form
  const [ratingAuthor, setRatingAuthor] = useState("Shahan");
  const [stars, setStars] = useState(5);
  const [ratingBusy, setRatingBusy] = useState(false);

  const previewUrl = useMemo(() => {
    if (!item) return null;
    return item.accessUrl || item.blobUrl || null;
  }, [item]);

  async function loadAll() {
    try {
      setLoading(true);
      setErr(null);

      const [m, c, r] = await Promise.all([
        getMediaById(id),
        getComments(id).catch(() => []),
        getRatings(id).catch(() => ({
          mediaId: id,
          count: 0,
          average: 0,
          ratings: [],
        })),
      ]);

      setItem(m || null);
      setComments(Array.isArray(c) ? c : []);
      setRatings(r || { mediaId: id, count: 0, average: 0, ratings: [] });
    } catch (e) {
      setErr(e);
      setItem(null);
      setComments([]);
      setRatings({ mediaId: id, count: 0, average: 0, ratings: [] });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [id]);

  async function onPostComment() {
    try {
      setCommentBusy(true);
      setErr(null);
      await postComment(id, { author: commentAuthor, text: commentText });
      setCommentText("");
      setComments(await getComments(id));
    } catch (e) {
      setErr(e);
    } finally {
      setCommentBusy(false);
    }
  }

  async function onPostRating() {
    try {
      setRatingBusy(true);
      setErr(null);
      await postRating(id, { author: ratingAuthor, stars });
      setRatings(await getRatings(id));
    } catch (e) {
      setErr(e);
    } finally {
      setRatingBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Media Detail"
        subtitle="View a media item, its metadata, and user engagement (comments + ratings)."
        actions={
          <div style={{ display: "flex", gap: 10 }}>
            <Link to="/feed">
              <Button variant="secondary">← Back to Feed</Button>
            </Link>
            <Button onClick={loadAll} disabled={loading}>
              Refresh
            </Button>
          </div>
        }
      />

      <ErrorBanner error={err} />

      {loading ? (
        <Card>Loading media detail...</Card>
      ) : !item ? (
        <Card>Media not found.</Card>
      ) : (
        <>
          {/* Preview + metadata */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 14,
            }}
          >
            <Card>
              {item.mediaType === "video" ? (
                <video
                  src={previewUrl}
                  controls
                  style={{ width: "100%", background: "black" }}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={item.title}
                  style={{ width: "100%" }}
                />
              )}
            </Card>

            <Card>
              <h3>Metadata</h3>
              <div style={{ display: "grid", gap: 8, fontSize: 14 }}>
                <div><b>Media ID:</b> {item.id}</div>
                <div><b>Title:</b> {item.title || "-"}</div>
                <div><b>Type:</b> {item.mediaType}</div>
                <div><b>Location:</b> {item.location || "-"}</div>
                <div><b>People:</b> {item.people?.join(", ") || "-"}</div>
                <div><b>Created:</b> {formatDate(item.createdAt)}</div>
              </div>
            </Card>
          </div>

          {/* Comments + Ratings */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card>
              <h3>Comments</h3>

              <input
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                placeholder="Your name"
              />

              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
              />

              <Button onClick={onPostComment} disabled={commentBusy}>
                {commentBusy ? "Posting..." : "Post Comment"}
              </Button>

              {comments.length === 0 ? (
                <p>No comments yet.</p>
              ) : (
                comments.map((c, i) => (
                  <div key={i}>
                    <b>{c.author}</b> — {c.text}
                  </div>
                ))
              )}
            </Card>

            <Card>
              <h3>Ratings</h3>

              <p>
                <b>Average:</b> {ratings.average.toFixed(2)} / 5 ·{" "}
                <b>Count:</b> {ratings.count}
              </p>

              <input
                value={ratingAuthor}
                onChange={(e) => setRatingAuthor(e.target.value)}
                placeholder="Your name"
              />

              <select
                value={stars}
                onChange={(e) => setStars(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} star{s > 1 ? "s" : ""}
                  </option>
                ))}
              </select>

              <Button onClick={onPostRating} disabled={ratingBusy}>
                {ratingBusy ? "Submitting..." : "Submit Rating"}
              </Button>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
