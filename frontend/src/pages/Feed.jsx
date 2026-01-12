import { useEffect, useMemo, useState } from "react";

import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import ErrorBanner from "../components/common/ErrorBanner";
import Button from "../components/common/Button";

import MediaCard from "../components/media/MediaCard";
import { getMedia } from "../services/mediaApi";

export default function Feed() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  async function load() {
    try {
      setLoading(true);
      setErr(null);
      const data = await getMedia({ q: q.trim() || undefined });
      // backend might return an array; if not, normalize
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasResults = useMemo(() => items && items.length > 0, [items]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Feed"
        subtitle="Browse and search all uploaded photos and videos."
        actions={
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />

      <ErrorBanner error={err} />

      <Card>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by title (and more if your API supports it)…"
            style={{
              flex: 1,
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              outline: "none",
            }}
          />
          <Button
            onClick={() => load()}
            disabled={loading}
          >
            Search
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setQ("");
              // reload full feed
              setTimeout(load, 0);
            }}
            disabled={loading}
          >
            Clear
          </Button>
        </div>
      </Card>

      {loading ? (
        <Card>Loading media...</Card>
      ) : !hasResults ? (
        <Card>No media found.</Card>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {items.map((it) => (
            <MediaCard key={it.id} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}
