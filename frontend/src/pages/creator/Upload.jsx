import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/Button";
import ErrorBanner from "../../components/common/ErrorBanner";

import { requestUploadSas, createMedia } from "../../services/mediaApi";

function getMediaTypeFromFile(file) {
  const t = (file?.type || "").toLowerCase();
  if (t.startsWith("image/")) return "photo";
  if (t.startsWith("video/")) return "video";
  return "unknown";
}

function parsePeople(input) {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Upload() {
  const nav = useNavigate();

  const [file, setFile] = useState(null);

  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState("");

  const [status, setStatus] = useState("idle"); // idle | sas | uploading | saving
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const mediaType = useMemo(() => getMediaTypeFromFile(file), [file]);

  const canSubmit = useMemo(() => {
    return (
      !!file &&
      title.trim().length > 0 &&
      (mediaType === "photo" || mediaType === "video") &&
      status === "idle"
    );
  }, [file, title, mediaType, status]);

  async function uploadToSasUrl(uploadUrl, fileToUpload) {
    await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": fileToUpload.type || "application/octet-stream",
      },
      body: fileToUpload,
    }).then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Blob upload failed: ${res.status} ${res.statusText} ${text}`);
      }
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!file) return setError(new Error("Please choose a file."));
    if (!title.trim()) return setError(new Error("Title is required."));
    if (mediaType !== "photo" && mediaType !== "video") return setError(new Error("File must be an image or a video."));

    try {
      setStatus("sas");
      setProgress(5);

      // 1) Request SAS (backend requires: fileName, contentType, mediaType)
      const sas = await requestUploadSas({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        mediaType,
      });

      const uploadUrl = sas.uploadUrl;
      const blobUrl = sas.blobUrl;
      const blobName = sas.blobName;

      if (!uploadUrl) throw new Error("SAS response missing uploadUrl.");
      if (!blobUrl) throw new Error("SAS response missing blobUrl.");

      // 2) Upload file to Blob via SAS
      setStatus("uploading");
      setProgress(20);

      await uploadToSasUrl(uploadUrl, file);
      setProgress(90);

      // 3) Save metadata in Cosmos via POST /api/media
      setStatus("saving");

      const payload = {
        title: title.trim(),
        mediaType,             // REQUIRED by backend
        blobUrl,               // REQUIRED by backend
        caption: caption.trim(),
        location: location.trim(),
        people: parsePeople(people),
        contentType: file.type || "application/octet-stream",
        fileName: file.name,
        size: file.size,
        blobName,              // optional but useful
      };

      const created = await createMedia(payload);

      // created should contain id
      const newId = created?.id;
      if (!newId) throw new Error("Upload completed but API did not return created.id");

      setProgress(100);
      setStatus("idle");

      // 4) Redirect to Media detail
      nav(`/media/${encodeURIComponent(newId)}`);
    } catch (err) {
      setStatus("idle");
      setProgress(0);
      setError(err);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Creator Upload"
        subtitle="Upload photos and videos securely using Azure Blob Storage SAS URLs. Metadata is saved in Cosmos DB."
      />

      <ErrorBanner error={error} />

      <Card>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontWeight: 700 }}>Media File (photo or video)</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ display: "block", marginTop: 8 }}
            />
            {file ? (
              <div style={{ marginTop: 6, opacity: 0.75, fontSize: 13 }}>
                Selected: <b>{file.name}</b> ({Math.round(file.size / 1024)} KB) –{" "}
                {file.type || "unknown type"} – <b>{mediaType}</b>
              </div>
            ) : null}
          </div>

          <div>
            <label style={{ fontWeight: 700 }}>Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Birmingham City Centre"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                marginTop: 6,
              }}
            />
          </div>

          <div>
            <label style={{ fontWeight: 700 }}>Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Short description..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.15)",
                outline: "none",
                marginTop: 6,
                resize: "vertical",
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontWeight: 700 }}>Location</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Birmingham"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: "none",
                  marginTop: 6,
                }}
              />
            </div>

            <div>
              <label style={{ fontWeight: 700 }}>People (comma-separated)</label>
              <input
                value={people}
                onChange={(e) => setPeople(e.target.value)}
                placeholder="e.g., Shahan, Ali"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  outline: "none",
                  marginTop: 6,
                }}
              />
            </div>
          </div>

          {status !== "idle" ? (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, opacity: 0.8 }}>
                <span>
                  Status:{" "}
                  <b>
                    {status === "sas"
                      ? "Requesting SAS..."
                      : status === "uploading"
                      ? "Uploading to Blob..."
                      : "Saving metadata..."}
                  </b>
                </span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "rgba(0,0,0,0.08)", overflow: "hidden", marginTop: 6 }}>
                <div style={{ width: `${progress}%`, height: "100%", background: "rgba(0,0,0,0.75)" }} />
              </div>
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10 }}>
            <Button type="submit" disabled={!canSubmit}>
              Upload
            </Button>

            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setTitle("");
                setCaption("");
                setLocation("");
                setPeople("");
                setError(null);
                setStatus("idle");
                setProgress(0);
              }}
              disabled={status !== "idle"}
            >
              Reset
            </Button>
          </div>

          {!canSubmit ? (
            <div style={{ fontSize: 13, opacity: 0.7 }}>
              Requirements: select a photo/video + provide a title.
            </div>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
