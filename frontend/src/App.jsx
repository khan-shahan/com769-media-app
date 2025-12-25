import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell";

import Home from "./pages/Home";
import Feed from "./pages/Feed";
import MediaDetail from "./pages/MediaDetail";
import Upload from "./pages/creator/Upload";
import MyUploads from "./pages/creator/MyUploads";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/media/:id" element={<MediaDetail />} />
          <Route path="/creator/upload" element={<Upload />} />
          <Route path="/creator/my-uploads" element={<MyUploads />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
