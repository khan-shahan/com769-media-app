import { http } from "./http";

// Media
export function getMedia({ q } = {}) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : "";
  return http(`/media${qs}`);
}

export function createMedia(payload) {
  // POST /api/media
  return http(`/media`, { method: "POST", body: payload });
}

// SAS upload
export function requestUploadSas({ fileName, contentType, mediaType }) {
  // POST /api/uploads/sas
  return http(`/uploads/sas`, {
    method: "POST",
    body: { fileName, contentType, mediaType },
  });
}

// Comments
export function addComment(mediaId, { name, text }) {
  return http(`/media/${encodeURIComponent(mediaId)}/comments`, {
    method: "POST",
    body: { name, text },
  });
}

export function listComments(mediaId) {
  return http(`/media/${encodeURIComponent(mediaId)}/comments`);
}

// Ratings
export function addRating(mediaId, { name, rating }) {
  return http(`/media/${encodeURIComponent(mediaId)}/ratings`, {
    method: "POST",
    body: { name, rating },
  });
}

export function getRatingSummary(mediaId) {
  return http(`/media/${encodeURIComponent(mediaId)}/ratings`);
}

export async function getMediaByIdFallback(id) {
  const items = await getMedia();
  const found = (Array.isArray(items) ? items : []).find((x) => x.id === id);
  return found || null;
}
