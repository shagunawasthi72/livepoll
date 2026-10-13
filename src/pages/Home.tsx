import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPollByCode } from "../lib/api";
import { useAuth } from "../lib/auth";

export default function Home() {
  const navigate = useNavigate();
  const { session, signIn, signUp, signOut } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  useEffect(() => {
    document.title = "LivePoll — Real-time Q&A and Polling";
  }, []);

  function openAuth(mode: "signin" | "signup") {
    setAuthMode(mode);
    setAuthOpen(true);
    setAuthError("");
    setAuthMessage("");
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError("");
    setAuthMessage("");
    const result: { error?: string; message?: string } = authMode === "signin"
      ? await signIn(authEmail, authPassword)
      : await signUp(authEmail, authPassword);
    if (result.error) {
      setAuthError(result.error);
    } else if (result.message) {
      setAuthMessage(result.message);
      if (authMode === "signin") setAuthOpen(false);
    } else {
      setAuthOpen(false);
    }
    setAuthLoading(false);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setError("Enter a poll code to join.");
      return;
    }
    setLoading(true);
    setError("");
    const poll = await getPollByCode(code);
    if (!poll) {
      setError("No poll found with that code. Double-check and try again.");
      setLoading(false);
      return;
    }
    navigate(`/vote/${poll.code}`);
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl animate-fade-in">
        <div className="flex justify-end mb-8">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-ink-200 max-w-[180px] truncate">{session.user.email}</span>
              <button onClick={() => void signOut()} className="btn-ghost text-sm">Sign out</button>
            </div>
          ) : (
            <button onClick={() => openAuth("signin")} className="btn-secondary text-sm">Sign in</button>
          )}
        </div>

        {/* Logo */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center glow-brand">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">
              Live<span className="gradient-text">Poll</span>
            </h1>
          </div>
          <p className="text-ink-200 text-lg max-w-md mx-auto">
            Create live polls and Q&A sessions. Share a code, collect votes,
            and watch results update in real-time.
          </p>
        </div>

        {/* Action cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Link
            to="/create"
            className="card p-8 group hover:border-brand-500/50 transition-all duration-300 hover:glow-brand animate-slide-up"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-6 h-6 text-brand-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-1">Create a Poll</h2>
            <p className="text-ink-200 text-sm">
              Set up a question with answer choices and share the join code.
            </p>
          </Link>

          <form
            onSubmit={handleJoin}
            className="card p-8 group hover:border-accent-500/50 transition-all duration-300 hover:glow-accent animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-12 h-12 rounded-xl bg-accent-500/10 flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-accent-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-1">Join a Poll</h2>
            <p className="text-ink-200 text-sm mb-4">
              Enter the 6-character code to participate.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                className="input-field font-mono text-center text-lg tracking-widest uppercase"
                maxLength={6}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary whitespace-nowrap"
              >
                {loading ? "..." : "Join"}
              </button>
            </div>
            {error && (
              <p className="text-danger-400 text-sm mt-3 animate-slide-down">
                {error}
              </p>
            )}
          </form>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-3 mt-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          {[
            { icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", label: "Real-time" },
            { icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "No sign-up" },
            { icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z", label: "Anonymous" },
          ].map((f, i) => (
            <div key={i} className="card p-4 flex flex-col items-center text-center gap-2">
              <svg
                className="w-5 h-5 text-ink-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
              </svg>
              <span className="text-xs text-ink-200 font-medium">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {authOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-6 animate-fade-in">
          <div className="card w-full max-w-md p-7 animate-scale-in relative">
            <button
              onClick={() => setAuthOpen(false)}
              className="absolute top-4 right-4 btn-ghost px-2 py-1"
              aria-label="Close sign in"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <p className="text-xs uppercase tracking-wider text-brand-400 font-medium mb-2">LivePoll account</p>
            <h2 className="text-2xl font-bold mb-2">
              {authMode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-ink-200 text-sm mb-6">
              {authMode === "signin" ? "Sign in to keep your sessions connected." : "Create an account to get started."}
            </p>
            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="email"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="input-field"
              />
              <input
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                placeholder="Password (6+ characters)"
                autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
                className="input-field"
              />
              {authError && <p className="text-danger-400 text-sm">{authError}</p>}
              {authMessage && <p className="text-success-400 text-sm">{authMessage}</p>}
              <button type="submit" disabled={authLoading} className="btn-primary w-full">
                {authLoading ? "Please wait..." : authMode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>
            <button
              onClick={() => {
                setAuthMode(authMode === "signin" ? "signup" : "signin");
                setAuthError("");
                setAuthMessage("");
              }}
              className="w-full text-sm text-ink-200 hover:text-brand-400 transition-colors mt-5"
            >
              {authMode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
