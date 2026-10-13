import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase, type Poll } from "../lib/supabase";
import {
  getPollWithOptions,
  castVote,
  hasVoted,
  getVotedOptionId,
  type PollWithOptionsAndVotes,
} from "../lib/api";

export default function VoteView() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [poll, setPoll] = useState<PollWithOptionsAndVotes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [voted, setVoted] = useState(false);
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [voteError, setVoteError] = useState("");

  const loadPoll = useCallback(async () => {
    if (!code) return;
    const { data: pollData } = await supabase
      .from("polls")
      .select("*")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (!pollData) {
      setError("Poll not found. Check the code and try again.");
      setLoading(false);
      return;
    }

    const fullPoll = await getPollWithOptions(pollData as Poll);
    setPoll(fullPoll);
    setLoading(false);

    const alreadyVoted = await hasVoted(fullPoll.id);
    setVoted(alreadyVoted);
    if (alreadyVoted) {
      const optId = await getVotedOptionId(fullPoll.id);
      setVotedOptionId(optId);
    }
  }, [code]);

  useEffect(() => {
    loadPoll();
  }, [loadPoll]);

  useEffect(() => {
    if (!poll) return;

    const channel = supabase
      .channel(`vote-${poll.id}`)
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

  async function handleVote(optionId: string) {
    if (!poll || voted || poll.status === "closed") return;
    setSubmitting(optionId);
    setVoteError("");

    const result = await castVote(poll.id, optionId);
    if (result.error) {
      setVoteError(result.error);
      setSubmitting(null);
      return;
    }

    setVoted(true);
    setVotedOptionId(optionId);
    setSubmitting(null);
    await loadPoll();
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
          <div className="w-16 h-16 rounded-full bg-danger-500/10 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-danger-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <p className="text-ink-100 text-lg mb-2">{error || "Poll not found."}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => navigate("/")} className="btn-primary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pollClosed = poll.status === "closed";
  const showResults = voted || pollClosed;
  const maxVotes = Math.max(...poll.options.map((o) => o.vote_count), 1);

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center px-6 py-8 relative">
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-accent-500/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 animate-slide-down">
          <button onClick={() => navigate("/")} className="btn-ghost flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Exit
          </button>
          {pollClosed && (
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-ink-700 text-ink-200">
              <span className="w-2 h-2 rounded-full bg-ink-400" />
              Poll Closed
            </span>
          )}
        </div>

        {/* Question */}
        <div className="card p-8 mb-6 animate-slide-up">
          <p className="text-xs text-ink-300 uppercase tracking-wider font-medium mb-2">
            Question
          </p>
          <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
            {poll.title}
          </h1>
          {!voted && !pollClosed && (
            <p className="text-ink-200 text-sm">
              Select your answer below. You can only vote once.
            </p>
          )}
          {voted && !pollClosed && (
            <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-success-500/10 text-success-400 animate-bounce-in">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Your vote has been recorded!</span>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {poll.options.map((opt, index) => {
            const pct = poll.total_votes > 0 ? (opt.vote_count / poll.total_votes) * 100 : 0;
            const isMyVote = votedOptionId === opt.id;
            const barWidth = showResults ? `${(opt.vote_count / maxVotes) * 100}%` : "0%";

            if (!showResults) {
              return (
                <button
                  key={opt.id}
                  onClick={() => handleVote(opt.id)}
                  disabled={submitting !== null}
                  className="card w-full p-5 text-left group hover:border-brand-500/50 transition-all duration-200 hover:glow-brand active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed animate-slide-up flex items-center gap-4"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="w-10 h-10 rounded-xl bg-ink-700 group-hover:bg-brand-500/20 flex items-center justify-center text-sm font-mono font-bold text-ink-200 group-hover:text-brand-400 transition-all duration-200 shrink-0">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-base font-medium flex-1">{opt.text}</span>
                  {submitting === opt.id && (
                    <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin shrink-0" />
                  )}
                </button>
              );
            }

            return (
              <div
                key={opt.id}
                className={`card p-5 animate-slide-up overflow-hidden relative ${
                  isMyVote ? "border-accent-500/50 glow-accent" : ""
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Bar background */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-all duration-700 ease-out ${
                    isMyVote
                      ? "bg-gradient-to-r from-accent-500/15 to-accent-500/5"
                      : "bg-gradient-to-r from-brand-500/10 to-brand-500/5"
                  }`}
                  style={{ width: barWidth }}
                />
                <div className="relative flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-mono font-bold shrink-0 ${
                      isMyVote
                        ? "bg-accent-500/20 text-accent-400"
                        : "bg-ink-700 text-ink-200"
                    }`}
                  >
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-base font-medium flex-1">{opt.text}</span>
                  {isMyVote && (
                    <span className="text-xs text-accent-400 font-medium bg-accent-500/15 px-2 py-1 rounded-md">
                      Your vote
                    </span>
                  )}
                  <span className="text-sm font-mono text-ink-100 tabular-nums shrink-0">
                    {opt.vote_count} ({pct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {voteError && (
          <div className="card p-4 border-danger-500/30 bg-danger-500/5 animate-slide-down mb-6">
            <p className="text-danger-400 text-sm">{voteError}</p>
          </div>
        )}

        {/* Results summary */}
        {showResults && (
          <div className="card p-6 animate-slide-up text-center" style={{ animationDelay: "0.2s" }}>
            <p className="text-sm text-ink-200">
              <span className="text-white font-bold text-xl">{poll.total_votes}</span>{" "}
              {poll.total_votes === 1 ? "vote" : "votes"} total
              {voted && !pollClosed && " · Thanks for participating!"}
            </p>
            {pollClosed && (
              <p className="text-xs text-ink-300 mt-2">This poll has been closed by the host.</p>
            )}
          </div>
        )}

        <div className="text-center mt-6">
          <Link to="/" className="btn-ghost text-sm">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
