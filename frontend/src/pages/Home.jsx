import { useEffect, useState } from "react";
import ErrorBanner from "../components/common/ErrorBanner";
import { http } from "../services/http";
import { Link } from "react-router-dom";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import Button from "../components/common/Button";

export default function Home() {
  const [apiStatus, setApiStatus] = useState("Checking API...");
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await http("/health"); // becomes /api/health via http.js
        if (typeof data === "string") {
          setApiStatus(data);
        } else {
          setApiStatus(data?.status || "API reachable");
        }
      } catch (e) {
        setApiError(e);
        setApiStatus("API not reachable (local is ok for now)");
      }
    })();
  }, []);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Media Management App"
        subtitle="A cloud-native media distribution platform (photos + videos) built for COM769 Coursework 2 using Azure Static Web Apps, Azure Functions, Blob Storage, and Cosmos DB."
        actions={
          <>
            <Link to="/feed" style={{ textDecoration: "none" }}>
              <Button>Open Feed</Button>
            </Link>
            <Link to="/creator/upload" style={{ textDecoration: "none" }}>
              <Button variant="secondary">Creator Upload</Button>
            </Link>
          </>
        }
      />

      <ErrorBanner error={apiError} />
      <div style={{ opacity: 0.7, fontSize: 13 }}>API: {apiStatus}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <Card>
          <h3 style={{ marginTop: 0 }}>Secure Uploads (SAS)</h3>
          <p style={{ marginBottom: 0, opacity: 0.75 }}>
            Creators upload directly to Azure Blob Storage using short-lived SAS URLs. Metadata is saved in Cosmos DB.
          </p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Discovery & Search</h3>
          <p style={{ marginBottom: 0, opacity: 0.75 }}>
            Consumers browse the feed and search media by title, caption, location, and tags (people).
          </p>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Engagement</h3>
          <p style={{ marginBottom: 0, opacity: 0.75 }}>
            Media items support comments and ratings to evaluate content quality and usability.
          </p>
        </Card>
      </div>
    </div>
  );
}
