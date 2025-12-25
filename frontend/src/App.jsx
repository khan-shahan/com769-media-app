export default function App() {
  return (
    <div style={{ fontFamily: "system-ui", padding: "24px" }}>
      <h1>COM769 Media Management App</h1>
      <p style={{ opacity: 0.7 }}>
        Phase 4 – Frontend (React + Vite)
      </p>

      <h3>Planned Pages</h3>
      <ul>
        <li>/ (Home)</li>
        <li>/feed</li>
        <li>/media/:id</li>
        <li>/creator/upload</li>
        <li>/creator/my-uploads</li>
        <li>/unauthorized</li>
        <li>* (404)</li>
      </ul>
    </div>
  );
}
