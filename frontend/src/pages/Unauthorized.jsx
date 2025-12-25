import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div>
      <h1>Unauthorized</h1>
      <p style={{ opacity: 0.75 }}>You don’t have permission to view this page.</p>
      <Link to="/feed">Back to Feed</Link>
    </div>
  );
}
