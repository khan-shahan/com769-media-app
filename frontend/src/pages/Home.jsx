import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div>
      <h1>Home</h1>
      <p style={{ opacity: 0.75 }}>Welcome to the COM769 Media App.</p>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/feed">Go to Feed</Link>
        <Link to="/creator/upload">Creator Upload</Link>
      </div>
    </div>
  );
}
