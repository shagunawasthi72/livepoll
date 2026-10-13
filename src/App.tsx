import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import CreatePoll from "./pages/CreatePoll";
import HostView from "./pages/HostView";
import VoteView from "./pages/VoteView";
import { AuthProvider } from "./lib/auth";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreatePoll />} />
        <Route path="/host/:code" element={<HostView />} />
        <Route path="/vote/:code" element={<VoteView />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
