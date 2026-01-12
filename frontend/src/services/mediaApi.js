// frontend/src/services/mediaApi.js
import { http } from "./http";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.value)) return data.value;
  return [];
}

/* -------------------- MEDIA LIST + DETAIL -------------------- */

export async function getMedia({ q } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);

  const path = params.toString() ? `/media?${params.toString()}` : `/media`;
  const data = await http(path);
  return normalizeList(data);
}

export async function getMediaById(id) {
  if (!id) throw new Error("Missing media id");
  return http(`/media/${encodeURIComponent(id)}`);
}

// Update metadata (title, caption, location, people)
export async function updateMedia(id, { title, caption, location, people }) {
  if (!id) throw new Error("Missing media id");
  return http(`/media/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      title,
      caption,
      location,
      people: Array.isArray(people) ? people : undefined,
    }),
  });
}

// Delete media (soft delete on backend)
export async function deleteMedia(id) {
  if (!id) throw new Error("Missing media id");
  return http(`/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

/* -------------------- CREATOR UPLOAD HELPERS -------------------- */

export async function requestUploadSas({ fileName, contentType, mediaType }) {
  return getUploadSas({ fileName, contentType, mediaType });
}

export async function getUploadSas({ fileName, contentType, mediaType }) {
  if (!fileName) throw new Error("fileName is required");
  if (!contentType) throw new Error("contentType is required");
  if (!mediaType) throw new Error("mediaType is required");

  return http(`/uploads/sas`, {
    method: "POST",
    body: JSON.stringify({ fileName, contentType, mediaType }),
  });
}

export async function createMedia({
  title,
  mediaType,
  blobUrl,
  caption,
  location,
  people,
  ownerId,
  ownerUsername,
}) {
  if (!title?.trim()) throw new Error("title is required");
  if (!mediaType?.trim()) throw new Error("mediaType is required");
  if (!blobUrl?.trim()) throw new Error("blobUrl is required");

  return http(`/media`, {
    method: "POST",
    body: JSON.stringify({
      title: title.trim(),
      mediaType: mediaType.trim(),
      blobUrl: blobUrl.trim(),
      caption: caption || "",
      location: location || "",
      people: Array.isArray(people) ? people : [],
      ownerId: ownerId || null,
      ownerUsername: ownerUsername || null,
    }),
  });
}

/* -------------------- COMMENTS -------------------- */

export async function getComments(id) {
  const data = await http(`/media/${encodeURIComponent(id)}/comments`);
  return normalizeList(data);
}

export async function postComment(id, { author, text }) {
  if (!author?.trim()) throw new Error("Author is required");
  if (!text?.trim()) throw new Error("Comment text is required");

  return http(`/media/${encodeURIComponent(id)}/comments`, {
    method: "POST",
    body: JSON.stringify({
      author: author.trim(),
      text: text.trim(),
    }),
  });
}

/* -------------------- RATINGS -------------------- */

export async function getRatings(id) {
  const data = await http(`/media/${encodeURIComponent(id)}/ratings`);
  return data || { mediaId: id, count: 0, average: 0, ratings: [] };
}

export async function postRating(id, { author, stars }) {
  if (!author?.trim()) throw new Error("Author is required");

  const score = Number(stars);
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    throw new Error("Stars must be 1..5");
  }

  return http(`/media/${encodeURIComponent(id)}/ratings`, {
    method: "POST",
    body: JSON.stringify({
      author: author.trim(),
      score, // backend expects "score"
    }),
  });
}
