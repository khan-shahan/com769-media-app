// frontend/src/pages/creator/EditMedia.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import ErrorBanner from "../../components/common/ErrorBanner";
import Button from "../../components/common/Button";
import { getMediaById, updateMedia } from "../../services/mediaApi";

// same demo user id
const CURRENT_USER_ID = "9a13f2fc-ceb6-41b0-9b11-827b97db9ad4";

export default function EditMedia() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [media, setMedia] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    if (!id) {
      setErr(new Error("Missing media id"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErr(null);
      setMessage("");

      const data = await getMediaById(id);
      setMedia(data || null);

      if (data) {
        setTitle(data.title || "");
        setCaption(data.caption || "");
        setLocation(data.location || "");
        setPeople(
          Array.isArray(data.people) ? data.people.join(", ") : ""
        );
      }
    } catch (e) {
      console.error(e);
      setErr(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSave = async () => {
    if (!id) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      alert("Title is required.");
      return;
    }

    const peopleArr = people
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      setMessage("");

      await updateMedia(id, {
        title: trimmedTitle,
        caption: caption.trim(),
        location: location.trim(),
        people: peopleArr,
      });

      setMessage("Changes saved ✅");
      // after a short moment go back to My Uploads
      setTimeout(() => navigate("/creator/my-uploads"), 600);
    } catch (e) {
      console.error(e);
      setMessage("Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const isOwner =
    media && media.ownerId && media.ownerId === CURRENT_USER_ID;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Edit Media"
        subtitle="Update the title, caption, location, and people for your uploaded media."
        actions={
          <Button
            variant="secondary"
            onClick={() => navigate("/creator/my-uploads")}
          >
            ← Back to My Uploads
          </Button>
        }
      />

      <ErrorBanner error={err} />

      <Card>
        {loading ? (
          <div>Loading media…</div>
        ) : !media ? (
          <div>Media not found.</div>
        ) : !isOwner ? (
          <div style={{ color: "red", fontSize: 14 }}>
            You are not the owner of this media, so it cannot be edited from
            your account.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 2fr) minmax(0, 3fr)",
              gap: 24,
            }}
          >
            {/* Preview */}
            <div>
              <div
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  background: "#0f172a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxHeight: "60vh",
                }}
              >
                {media.accessUrl || media.blobUrl ? (
                  media.mediaType === "video" ? (
                    <video
                      src={media.accessUrl || media.blobUrl}
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
                      src={media.accessUrl || media.blobUrl}
                      alt={media.title || "media"}
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
                      padding: 20,
                      textAlign: "center",
                    }}
                  >
                    Media URL missing
                  </div>
                )}
              </div>
            </div>

            {/* Form */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                fontSize: 14,
              }}
            >
              <label style={{ fontSize: 13, fontWeight: 600 }}>Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />

              <label style={{ fontSize: 13, fontWeight: 600 }}>Caption</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  resize: "vertical",
                }}
              />

              <label style={{ fontSize: 13, fontWeight: 600 }}>Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />

              <label style={{ fontSize: 13, fontWeight: 600 }}>
                People (comma-separated)
              </label>
              <input
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder="e.g., Shahan, Ali"
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                }}
              />

              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>

                {message && (
                  <span style={{ fontSize: 12, opacity: 0.8 }}>{message}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
