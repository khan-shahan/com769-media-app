import { Link } from "react-router-dom";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";

export default function NotFound() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <PageHeader
        title="404"
        subtitle="The page you requested does not exist."
      />
      <Card>
        <Link to="/feed">← Back to Feed</Link>
      </Card>
    </div>
  );
}
