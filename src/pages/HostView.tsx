import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase, type Poll, type Option } from "../lib/supabase";
import {
  getPollWithOptions,
  closePoll,
  reopenPoll,
  type PollWithOptionsAndVotes,
} from "../lib/api";

export default function HostView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<PollWithOptionsAndVotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const loadPoll = useCallback(async () => {
    if (!code) return;
    const { data: pollData } = await supabase
      .from("polls")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (!pollData) {
      setError("Poll not found.");
      setLoading(false);
      return;
    }

    const data = await getPollWithOptions(pollData as Poll).catch(() => null);

    if (!data) {
      setError("Poll not found.");
      setLoading(false);
      return;
    }
    setPoll(data);
    setLoading(false);
  }, [code]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  useEffect(() => {
    if (!poll) return;

    const channel = supabase
      .channel(`host-${poll.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votes", filter: `poll_id=eq.${poll.id}` },
        () => loadPoll()
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "votes", filter: `poll_id=eq.${poll.id}` },
        () => loadPoll()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "polls", filter: `id=eq.${poll.id}` },
        () => loadPoll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [poll?.id, loadPoll]);

  async function copyLink() {
    const url = `${window.location.origin}/vote/${poll!.code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(poll!.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function toggleStatus() {
    if (!poll) return;
    if (poll.status === "active") {
      await closePoll(poll.id);
    } else {
      await reopenPoll(poll.id);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !poll) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="card p-8 text-center max-w-md animate-scale-in">
          <p className="text-danger-400 text-lg mb-4">{error || "Poll not found."}</p>
          <Link to="/" className="btn-primary">Back to Home</Link>
        </div>
      </div>
    );
  }

  const maxVotes = Math.max(...poll.options.map((o) => o.vote_count), 1);
  const sortedOptions = [...poll.options].sort((a, b) => b.vote_count - a.vote_count);
  const leadingOption = sortedOptions[0];

  return (
    <div className="min-h-screen grid-bg relative">
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-slide-down">
          <button
            onClick={() => navigate("/")}
            className="btn-ghost flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Exit
          </button>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                poll.status === "active"
                  ? "bg-success-500/15 text-success-400"
                  : "bg-ink-700 text-ink-200"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  poll.status === "active" ? "bg-success-400 animate-pulse" : "bg-ink-400"
                }`}
              />
              {poll.status === "active" ? "Live" : "Closed"}
            </span>
          </div>
        </div>

        {/* Question + Join Code */}
        <div className="card p-8 mb-6 animate-slide-up">
          <p className="text-xs text-ink-300 uppercase tracking-wider font-medium mb-2">
            Question
          </p>
          <h1 className="text-2xl md:text-3xl font-bold mb-6 leading-tight">
            {poll.title}
          </h1>

          {/* Join code box */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="flex-1 glass rounded-xl p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-ink-300 mb-1">Join code</p>
                <p className="font-mono text-3xl font-bold tracking-[0.3em] text-brand-400">
                  {poll.code}
                </p>
              </div>
              <button
                onClick={copyCode}
                className="btn-ghost px-3 py-2"
                title="Copy code"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-success-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 5.625l-4.5-4.5m4.5 4.5V8.25" />
                  </svg>
                )}
              </button>
            </div>
            <button
              onClick={copyLink}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              {copied ? "Copied!" : "Share Link"}
              {!copied && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              )}
            </button>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-ink-700/50 text-center">
            <p className="text-sm text-ink-200">
              Participants can join at{" "}
              <span className="text-brand-400 font-medium">
                {window.location.origin}/vote/{poll.code}
              </span>
            </p>
          </div>
        </div>

        {/* Live Results */}
        <div className="card p-6 mb-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success-400 animate-pulse" />
              Live Results
            </h2>
            <span className="text-sm text-ink-200">
              <span className="text-white font-bold text-lg">{poll.total_votes}</span>{" "}
              {poll.total_votes === 1 ? "vote" : "votes"}
            </span>
          </div>

          {poll.total_votes === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-ink-700/50 mx-auto mb-4 flex items-center justify-center animate-pulse-ring">
                <svg className="w-8 h-8 text-ink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-ink-200 text-sm">
                Waiting for votes... Share the code with your audience!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {poll.options.map((opt, index) => {
                const pct = poll.total_votes > 0 ? (opt.vote_count / poll.total_votes) * 100 : 0;
                const isLeading = leadingOption && opt.id === leadingOption.id && opt.vote_count > 0;
                const barWidth = `${(opt.vote_count / maxVotes) * 100}%`;

                return (
                  <div key={opt.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-ink-300 w-5">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="text-sm font-medium">{opt.text}</span>
                        {isLeading && (
                          <span className="text-xs text-accent-400 font-medium ml-1">
                            Leading
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-mono text-ink-100 tabular-nums">
                        {opt.vote_count} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-ink-700/50 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isLeading
                            ? "bg-gradient-to-r from-accent-500 to-accent-400"
                            : "bg-gradient-to-r from-brand-600 to-brand-400"
                        }`}
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <button
            onClick={toggleStatus}
            className={poll.status === "active" ? "btn-secondary flex-1" : "btn-primary flex-1"}
          >
            {poll.status === "active" ? "Close Poll" : "Reopen Poll"}
          </button>
          <Link to="/" className="btn-ghost">Home</Link>
        </div>
      </div>
    </div>
  );
}
