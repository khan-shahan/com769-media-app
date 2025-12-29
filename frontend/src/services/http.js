const API_BASE = import.meta.env.VITE_API_BASE || "/api";

export async function http(path, options = {}) {
  const clean = path.startsWith("/") ? path : `/${path}`;
  const url = path.startsWith("http") ? path : `${API_BASE}${clean}`;

  const res = await fetch(url, {
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(text || `Request failed: ${res.status} ${res.statusText}`);
  }

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}
