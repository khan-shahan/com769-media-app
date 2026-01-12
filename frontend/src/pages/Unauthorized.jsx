import { Link } from "react-router-dom";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";

export default function Unauthorized() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="Access denied"
        subtitle="You do not have the required role to view this page. Creator routes are protected using Azure Static Web Apps role rules."
      />
      <Card>
        <Link to="/feed">← Go to Feed</Link>
      </Card>
    </div>
  );
}
