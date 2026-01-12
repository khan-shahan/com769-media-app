// frontend/src/pages/creator/Upload.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import ErrorBanner from "../../components/common/ErrorBanner";
import Button from "../../components/common/Button";

import {
  requestUploadSas,
  createMedia,
} from "../../services/mediaApi";
import { useAuth } from "../../context/AuthContext";

export default function Upload() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [peopleInput, setPeopleInput] = useState("");

  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState(null);
  const [message, setMessage] = useState("");

  function getMediaTypeFromFile(f) {
    if (!f?.type) return "photo";
    if (f.type.startsWith("video/")) return "video";
    if (f.type.startsWith("image/")) return "photo";
    return "photo";
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFile(f || null);
  };

  const handleReset = () => {
    setFile(null);
    setTitle("");
    setCaption("");
    setLocation("");
    setPeopleInput("");
    setErr(null);
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setMessage("");

    if (!isAuthenticated) {
      setErr(new Error("You must be logged in to upload media."));
      return;
    }

    if (!file) {
      setErr(new Error("Please choose a file to upload."));
      return;
    }

    if (!title.trim()) {
      setErr(new Error("Please enter a title for this media."));
      return;
    }

    try {
      setUploading(true);

      const contentType = file.type || "application/octet-stream";
      const mediaType = getMediaTypeFromFile(file);

      // 1) Get SAS for upload
      const sas = await requestUploadSas({
        fileName: file.name,
        contentType,
        mediaType,
      });

      const uploadUrl = sas.uploadUrl || sas.url || sas.uploadUri;
      const blobUrl = sas.blobUrl || sas.resourceUrl;

      if (!uploadUrl || !blobUrl) {
        throw new Error(
          "Upload SAS response missing uploadUrl / blobUrl."
        );
      }

      // 2) PUT file to blob storage
      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "x-ms-blob-type": "BlockBlob",
          "Content-Type": contentType,
        },
        body: file,
      });

      // 3) Save metadata in Cosmos including owner info
      const people =
        peopleInput
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean) || [];

      const created = await createMedia({
        title,
        mediaType,
        blobUrl,
        caption,
        location,
        people,
        ownerId: user?.id || null,
        ownerUsername: user?.username || null,
      });

      setMessage("Media uploaded successfully ✅");

      // optional: clear the form
      handleReset();

      // 4) Redirect to My Uploads so user sees their item
      navigate("/creator/my-uploads");
    } catch (error) {
      console.error(error);
      setErr(
        new Error(
          error?.message || "Failed to upload media. Please try again."
        )
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Creator Upload"
        subtitle="Upload photos and videos securely "
      />

      <ErrorBanner error={err} />

      <Card>
        {!isAuthenticated && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              background: "#fef3c7",
              color: "#92400e",
              fontSize: 13,
            }}
          >
            You must <strong>login or sign up</strong> before you can
            upload media. Your uploads will be linked to your account
            and shown under <strong>My Uploads</strong>.
          </div>
        )}

        {message && (
          <div
            style={{
              marginBottom: 12,
              padding: 10,
              borderRadius: 8,
              background: "#ecfdf5",
              color: "#166534",
              fontSize: 13,
            }}
          >
            {message}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "grid", gap: 12 }}
        >
          <label
            style={{
              display: "grid",
              gap: 4,
              fontSize: 14,
            }}
          >
            Media File (photo or video)
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              disabled={uploading || !isAuthenticated}
            />
            {file && (
              <div
                style={{
                  fontSize: 12,
                  opacity: 0.8,
                  marginTop: 4,
                }}
              >
                Selected: {file.name} ({file.type || "unknown"}) –
                {` `}
                {getMediaTypeFromFile(file)}
              </div>
            )}
          </label>

          <label
            style={{
              display: "grid",
              gap: 4,
              fontSize: 14,
            }}
          >
            Title *
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your media..."
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              disabled={uploading || !isAuthenticated}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 4,
              fontSize: 14,
            }}
          >
            Caption
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Short description or notes…"
              style={{
                resize: "vertical",
                minHeight: 48,
                borderRadius: 8,
                border: "1px solid #d1d5db",
                padding: 8,
                fontSize: 13,
                fontFamily: "inherit",
              }}
              disabled={uploading || !isAuthenticated}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 4,
              fontSize: 14,
            }}
          >
            Location
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Birmingham"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              disabled={uploading || !isAuthenticated}
            />
          </label>

          <label
            style={{
              display: "grid",
              gap: 4,
              fontSize: 14,
            }}
          >
            People (comma-separated)
            <input
              type="text"
              value={peopleInput}
              onChange={(e) => setPeopleInput(e.target.value)}
              placeholder="e.g., Shahan, Ali"
              style={{
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 14,
              }}
              disabled={uploading || !isAuthenticated}
            />
          </label>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Button
              type="submit"
              disabled={uploading || !isAuthenticated}
            >
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={uploading}
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
