// frontend/src/pages/Scroll.jsx
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getMedia,
  getComments,
  getRatings,
  postComment,
  postRating,
} from "../services/mediaApi";
import { useAuth } from "../context/AuthContext"; // ✅ useAuth

export default function Scroll() {
  const { user, isAuthenticated } = useAuth(); // ✅ current logged-in user

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentIndex, setCurrentIndex] = useState(0);

  // Per-video drafts/state
  const [ratingDrafts, setRatingDrafts] = useState({});
  const [commentDrafts, setCommentDrafts] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [successMsg, setSuccessMsg] = useState({});

  const [commentsByMedia, setCommentsByMedia] = useState({});
  const [ratingStats, setRatingStats] = useState({}); // { [id]: { avg, count } }

  const sectionRefs = useRef([]);
  const videoRefs = useRef([]);

  /* -------------------- LOAD VIDEO LIST -------------------- */

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const list = await getMedia();
        const onlyVideos = list.filter((item) => {
          const isVideo = item?.mediaType === "video";
          const mediaUrl = item?.accessUrl || item?.blobUrl;
          return isVideo && !!mediaUrl;
        });
        setItems(onlyVideos);
        setCurrentIndex(0);
      } catch (err) {
        setError(err.message || "Something went wrong loading videos");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* -------------------- HELPERS: LOAD META -------------------- */

  // compute avg/count where each author counts once (latest rating wins)
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
      count === 0
        ? 0
        : values.reduce((sum, v) => sum + v, 0) / count;

    return { avg, count };
  }

  const ensureMetaLoaded = async (mediaId) => {
    const needComments = !commentsByMedia[mediaId];
    const needRatings = !ratingStats[mediaId];

    try {
      if (needComments) {
        const comments = await getComments(mediaId);
        setCommentsByMedia((prev) => ({
          ...prev,
          [mediaId]: comments,
        }));
      }

      if (needRatings) {
        const ratingData = await getRatings(mediaId);
        const { avg, count } = computeUniqueAuthorStats(ratingData);
        setRatingStats((prev) => ({
          ...prev,
          [mediaId]: { avg, count },
        }));
      }
    } catch (err) {
      console.error("Failed to load comments/ratings for", mediaId, err);
    }
  };

  /* -------------------- INTERSECTION OBSERVER -------------------- */

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = currentIndex;
        let bestRatio = 0;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            const idx = Number(entry.target.dataset.index);
            bestIndex = idx;
            bestRatio = entry.intersectionRatio;
          }
        });

        if (bestRatio > 0 && bestIndex !== currentIndex) {
          setCurrentIndex(bestIndex);
        }
      },
      { threshold: 0.6 }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  /* -------------------- PLAY/PAUSE + META WHEN CURRENT CHANGES -------------------- */

  useEffect(() => {
    if (!items.length) return;

    // play/pause videos
    videoRefs.current.forEach((vid, idx) => {
      if (!vid) return;
      try {
        if (idx === currentIndex) {
          vid.play().catch(() => {
            // ignore autoplay errors
          });
        } else {
          vid.pause();
        }
      } catch {
        // ignore
      }
    });

    // load comments + ratings for current video
    const current = items[currentIndex];
    if (!current) return;
    const mediaId = current.id;
    void ensureMetaLoaded(mediaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, items]);

  /* -------------------- HANDLERS: RATING -------------------- */

  const handleRatingChange = (mediaId, value) => {
    setRatingDrafts((prev) => ({
      ...prev,
      [mediaId]: value,
    }));
  };

  const handleSubmitRating = async (mediaId) => {
    const rating = ratingDrafts[mediaId];
    if (!rating) return;

    if (!isAuthenticated) {
      setSuccessMsg((prev) => ({
        ...prev,
        [mediaId]: "Please login to rate this video.",
      }));
      return;
    }

    const author = user?.username || "Anonymous"; // ✅ use username

    try {
      setSubmitting((prev) => ({ ...prev, [mediaId]: true }));
      setSuccessMsg((prev) => ({ ...prev, [mediaId]: "" }));

      await postRating(mediaId, { author, stars: rating });

      // Reload ratings and recompute unique author stats
      const ratingData = await getRatings(mediaId);
      const { avg, count } = computeUniqueAuthorStats(ratingData);
      setRatingStats((prev) => ({
        ...prev,
        [mediaId]: { avg, count },
      }));

      setSuccessMsg((prev) => ({
        ...prev,
        [mediaId]: "Rating submitted ✅",
      }));
    } catch (err) {
      console.error(err);
      setSuccessMsg((prev) => ({
        ...prev,
        [mediaId]: "Could not submit rating",
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [mediaId]: false }));
    }
  };

  /* -------------------- HANDLERS: COMMENTS -------------------- */

  const handleCommentChange = (mediaId, value) => {
    setCommentDrafts((prev) => ({
      ...prev,
      [mediaId]: value,
    }));
  };

  const handleSubmitComment = async (mediaId) => {
    const text = (commentDrafts[mediaId] || "").trim();
    if (!text) return;

    if (!isAuthenticated) {
      setSuccessMsg((prev) => ({
        ...prev,
        [mediaId]: "Please login to post a comment.",
      }));
      return;
    }

    const author = user?.username || "Anonymous"; // ✅ use username

    const optimisticComment = {
      author,
      text,
      createdAt: new Date().toISOString(),
    };

    setCommentsByMedia((prev) => {
      const existing = prev[mediaId] || [];
      return {
        ...prev,
        [mediaId]: [optimisticComment, ...existing],
      };
    });

    setCommentDrafts((prev) => ({
      ...prev,
      [mediaId]: "",
    }));

    try {
      setSubmitting((prev) => ({ ...prev, [mediaId]: true }));
      setSuccessMsg((prev) => ({ ...prev, [mediaId]: "" }));

      await postComment(mediaId, { author, text });

      const newComments = await getComments(mediaId);
      setCommentsByMedia((prev) => ({
        ...prev,
        [mediaId]: newComments,
      }));

      setSuccessMsg((prev) => ({
        ...prev,
        [mediaId]: "Comment added 💬",
      }));
    } catch (err) {
      console.error(err);
      setSuccessMsg((prev) => ({
        ...prev,
        [mediaId]: "Could not submit comment",
      }));
    } finally {
      setSubmitting((prev) => ({ ...prev, [mediaId]: false }));
    }
  };

  /* -------------------- AUTO-SCROLL ON VIDEO END -------------------- */

  const handleVideoEnded = (index) => {
    const next = index + 1;
    if (next < items.length) {
      const nextSection = sectionRefs.current[next];
      if (nextSection) {
        nextSection.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  /* -------------------- RENDER -------------------- */

  if (loading) {
    return <div>Loading videos…</div>;
  }

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  if (!items.length) {
    return <div>No videos found.</div>;
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 900,
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          paddingBottom: 16,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            margin: "0 0 8px",
          }}
        >
          Scroll
        </h1>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            opacity: 0.8,
          }}
        >
          Scroll up or down to move between videos. 
        </p>
        {!isAuthenticated && (
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              opacity: 0.85,
              color: "#b45309",
            }}
          >
            Login or sign up to rate videos and post comments.
          </p>
        )}
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollSnapType: "y mandatory",
        }}
      >
        {items.map((item, index) => {
          const mediaId = item.id;
          const mediaUrl = item.accessUrl || item.blobUrl;

          const ratingDraft = ratingDrafts[mediaId] || 0;
          const isBusy = !!submitting[mediaId];
          const message = successMsg[mediaId];
          const comments = commentsByMedia[mediaId] || [];
          const stats = ratingStats[mediaId] || null;

          const title = item.title || item.filename || "Untitled";
          const description = item.description || "";

          return (
            <section
              key={mediaId}
              ref={(el) => {
                sectionRefs.current[index] = el;
              }}
              data-index={index}
              style={{
                scrollSnapAlign: "start",
                minHeight: "100vh",
                boxSizing: "border-box",
                padding: "16px 0 32px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderRadius: 16,
                  background: "#ffffff",
                  boxShadow:
                    "0 10px 30px rgba(15, 23, 42, 0.06), 0 1px 3px rgba(15, 23, 42, 0.06)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  width: "100%",
                  maxHeight: "100%",
                }}
              >
                {/* Video */}
                <div
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    background: "#0f172a",
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {mediaUrl ? (
                    <video
                      ref={(el) => {
                        videoRefs.current[index] = el;
                      }}
                      src={mediaUrl}
                      controls
                      muted
                      playsInline
                      onEnded={() => handleVideoEnded(index)}
                      style={{
                        width: "100%",
                        maxHeight: "60vh",
                        objectFit: "contain",
                        backgroundColor: "black",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        color: "#e5e7eb",
                        fontSize: 14,
                        padding: 16,
                        textAlign: "center",
                      }}
                    >
                      Video URL missing
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      alignItems: "center",
                      marginTop: 8,
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 18,
                        margin: 0,
                      }}
                    >
                      {title}
                    </h2>

                    <Link
                      to={`/media/${mediaId}`}
                      style={{
                        fontSize: 12,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid #111827",
                        color: "#111827",
                        textDecoration: "none",
                      }}
                    >
                      Open details
                    </Link>
                  </div>

                  {description && (
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        opacity: 0.8,
                      }}
                    >
                      {description}
                    </p>
                  )}
                </div>

                {/* Rating */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    marginTop: 8,
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
                    <span
                      style={{
                        fontSize: 13,
                        opacity: 0.9,
                      }}
                    >
                      Rate this video:
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        opacity: 0.8,
                      }}
                    >
                      {stats
                        ? `Average: ${stats.avg.toFixed(
                            1
                          )}★ (${stats.count} rating${
                            stats.count === 1 ? "" : "s"
                          })`
                        : "No ratings yet"}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() =>
                          handleRatingChange(mediaId, value)
                        }
                        style={{
                          padding: "4px 8px",
                          borderRadius: 999,
                          border:
                            ratingDraft === value
                              ? "1px solid #111827"
                              : "1px solid #d1d5db",
                          backgroundColor:
                            ratingDraft === value
                              ? "#111827"
                              : "#ffffff",
                          color:
                            ratingDraft === value
                              ? "#ffffff"
                              : "#111827",
                          fontSize: 13,
                          cursor: isAuthenticated ? "pointer" : "not-allowed",
                          opacity: isAuthenticated ? 1 : 0.4,
                        }}
                        disabled={isBusy || !isAuthenticated}
                      >
                        {value}★
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleSubmitRating(mediaId)}
                      style={{
                        marginLeft: 8,
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "none",
                        backgroundColor: "#111827",
                        color: "#ffffff",
                        fontSize: 13,
                        cursor:
                          isAuthenticated && ratingDraft
                            ? "pointer"
                            : "not-allowed",
                        opacity:
                          isAuthenticated && ratingDraft ? 1 : 0.4,
                      }}
                      disabled={
                        isBusy || !ratingDraft || !isAuthenticated
                      }
                    >
                      {isBusy ? "Saving…" : "Submit"}
                    </button>
                  </div>
                </div>

                {/* Comments */}
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      opacity: 0.9,
                    }}
                  >
                    Comments:
                  </span>

                  <div
                    style={{
                      maxHeight: 150,
                      overflowY: "auto",
                      borderRadius: 8,
                      border: "1px solid #e5e7eb",
                      padding: 8,
                      backgroundColor: "#f9fafb",
                      fontSize: 13,
                    }}
                  >
                    {comments.length === 0 ? (
                      <div style={{ opacity: 0.7 }}>
                        No comments yet.
                      </div>
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
                      rows={2}
                      value={commentDrafts[mediaId] || ""}
                      onChange={(e) =>
                        handleCommentChange(mediaId, e.target.value)
                      }
                      placeholder={
                        isAuthenticated
                          ? "Write a comment while watching…"
                          : "Login to write a comment…"
                      }
                      style={{
                        resize: "vertical",
                        minHeight: 48,
                        maxHeight: 120,
                        borderRadius: 8,
                        border: "1px solid #d1d5db",
                        padding: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                        opacity: isAuthenticated ? 1 : 0.5,
                      }}
                      disabled={isBusy || !isAuthenticated}
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
                        onClick={() =>
                          handleSubmitComment(mediaId)
                        }
                        style={{
                          padding: "6px 12px",
                          borderRadius: 999,
                          border: "none",
                          backgroundColor: "#111827",
                          color: "#ffffff",
                          fontSize: 13,
                          cursor:
                            isAuthenticated &&
                            (commentDrafts[mediaId] || "").trim()
                              ? "pointer"
                              : "not-allowed",
                          opacity:
                            isAuthenticated &&
                            (commentDrafts[mediaId] || "").trim()
                              ? 1
                              : 0.4,
                        }}
                        disabled={
                          isBusy ||
                          !isAuthenticated ||
                          !(commentDrafts[mediaId] || "").trim()
                        }
                      >
                        {isBusy ? "Posting…" : "Post comment"}
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

                {/* Index indicator */}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 12,
                    opacity: 0.6,
                    textAlign: "right",
                  }}
                >
                  Video {index + 1} of {items.length}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
