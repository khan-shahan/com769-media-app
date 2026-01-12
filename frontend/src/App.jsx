// frontend/src/App.jsx
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import Scroll from "./pages/Scroll";
import Feed from "./pages/Feed";
import Upload from "./pages/creator/Upload";
import MyUploads from "./pages/creator/MyUploads";
import EditMedia from "./pages/creator/EditMedia";
import MediaDetail from "./pages/MediaDetail";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAuth } from "./context/AuthContext";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: "6px 10px",
        borderRadius: 999,
        textDecoration: "none",
        fontSize: 14,
        color: isActive ? "#fff" : "#111827",
        background: isActive ? "#111827" : "transparent",
      })}
    >
      {children}
    </NavLink>
  );
}

function AppShell() {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    // optional: redirect using window.location if you want:
    // window.location.href = "/feed";
  };

  return (
    // Full-height shell
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f5",
      }}
    >
      {/* Top navigation */}
      <header
        style={{
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 0.2,
            }}
          >
            COM769 Media App
          </div>

          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <NavItem to="/feed">Feed</NavItem>
            <NavItem to="/scroll">Scroll</NavItem>
            <NavItem to="/creator/upload">Creator Upload</NavItem>
            <NavItem to="/creator/my-uploads">My Uploads</NavItem>

            {/* Auth section */}
            {isAuthenticated ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginLeft: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    opacity: 0.7,
                  }}
                >
                  Hi, {user?.username || user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid #111827",
                    background: "transparent",
                    color: "#111827",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginLeft: 12,
                }}
              >
                <NavItem to="/login">Login</NavItem>
                <NavItem to="/signup">Sign up</NavItem>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
        }}
      >
        <div
          style={{
            flex: 1,
            width: "100%",
            padding: "24px 24px 40px",
            boxSizing: "border-box",
          }}
        >
          <Routes>
            {/* Feed as root & /feed */}
            <Route path="/" element={<Feed />} />
            <Route path="/feed" element={<Feed />} />

            {/* Scroll page */}
            <Route path="/scroll" element={<Scroll />} />

            {/* Auth pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Media detail (view from Feed / Scroll) */}
            <Route path="/media/:id" element={<MediaDetail />} />

            {/* Creator routes */}
            <Route path="/creator/upload" element={<Upload />} />
            <Route path="/creator/my-uploads" element={<MyUploads />} />
            <Route path="/creator/edit/:id" element={<EditMedia />} />

            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
