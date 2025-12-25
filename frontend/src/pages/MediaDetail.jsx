import { useParams, Link } from "react-router-dom";

export default function MediaDetail() {
  const { id } = useParams();
  return (
    <div>
      <h1>Media Detail</h1>
      <p style={{ opacity: 0.75 }}>Media ID: <b>{id}</b></p>
      <Link to="/feed">Back to Feed</Link>
    </div>
  );
}
