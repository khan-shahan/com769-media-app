import { NavLink, Outlet } from "react-router-dom";

export default function AppShell() {
  const linkStyle = ({ isActive }) => ({
    textDecoration: "none",
    padding: "8px 10px",
    borderRadius: 8,
    color: "inherit",
    background: isActive ? "rgba(0,0,0,0.06)" : "transparent",
  });

  return (
   <div style={{ fontFamily: "system-ui", background: "rgba(0,0,0,0.03)", minHeight: "100vh" }}>
      <header style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "14px 16px", display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontWeight: 700 }}>COM769 Media App</div>
          <nav style={{ display: "flex", gap: 8 }}>
            <NavLink to="/" style={linkStyle} end>Home</NavLink>
            <NavLink to="/feed" style={linkStyle}>Feed</NavLink>
            <NavLink to="/creator/upload" style={linkStyle}>Creator Upload</NavLink>
            <NavLink to="/creator/my-uploads" style={linkStyle}>My Uploads</NavLink>
            <a href="/.auth/login/aad" style={{ textDecoration: "none", padding: "8px 10px", borderRadius: 8 }}>
  Login
</a>
<a href="/.auth/logout" style={{ textDecoration: "none", padding: "8px 10px", borderRadius: 8 }}>
  Logout
</a>

          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "26px 16px" }}>
        <Outlet />
      </main>
    </div>
  );
}
