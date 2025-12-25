import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div>
      <h1>404</h1>
      <p style={{ opacity: 0.75 }}>Page not found.</p>
      <Link to="/feed">Back to Feed</Link>
    </div>
  );
}
