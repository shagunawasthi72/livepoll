import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPoll } from "../lib/api";

type OptionInput = { id: string; text: string };

export default function CreatePoll() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([
    { id: crypto.randomUUID(), text: "" },
    { id: crypto.randomUUID(), text: "" },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "Create a Poll — LivePoll";
    titleRef.current?.focus();
  }, []);

  function addOption() {
    if (options.length >= 8) return;
    setOptions([...options, { id: crypto.randomUUID(), text: "" }]);
  }

  function removeOption(id: string) {
    if (options.length <= 2) return;
    setOptions(options.filter((o) => o.id !== id));
  }

  function updateOption(id: string, text: string) {
    setOptions(options.map((o) => (o.id === id ? { ...o, text } : o)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const result = await createPoll(
      title,
      options.map((o) => o.text)
    );

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    navigate(`/host/${result.poll.code}`);
  }

  return (
    <div className="min-h-screen grid-bg flex flex-col items-center px-6 py-12 relative">
      <div className="absolute top-0 left-1/2 w-96 h-96 bg-brand-500/8 rounded-full blur-3xl pointer-events-none -translate-x-1/2" />

      <div className="relative z-10 w-full max-w-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="btn-ghost flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold">Create a Poll</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Question */}
          <div className="card p-6 animate-slide-up">
            <label className="block text-sm font-medium text-ink-100 mb-2">
              Your Question
            </label>
            <input
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the best programming language?"
              maxLength={200}
              className="input-field text-lg"
            />
            <p className="text-xs text-ink-300 mt-2">
              {title.length}/200 characters
            </p>
          </div>

          {/* Options */}
          <div className="card p-6 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <label className="block text-sm font-medium text-ink-100 mb-3">
              Answer Choices
            </label>
            <div className="space-y-3">
              {options.map((opt, index) => (
                <div key={opt.id} className="flex gap-2 items-center animate-scale-in">
                  <div className="w-8 h-8 rounded-lg bg-ink-700 flex items-center justify-center text-sm font-mono text-ink-200 shrink-0">
                    {String.fromCharCode(65 + index)}
                  </div>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    maxLength={100}
                    className="input-field"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.id)}
                      className="w-9 h-9 rounded-lg text-ink-300 hover:text-danger-400 hover:bg-danger-500/10 transition-all duration-200 flex items-center justify-center shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 8 && (
              <button
                type="button"
                onClick={addOption}
                className="mt-4 flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors duration-200 font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add option
              </button>
            )}
          </div>

          {error && (
            <div className="card p-4 border-danger-500/30 bg-danger-500/5 animate-slide-down">
              <p className="text-danger-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-lg py-4 animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            {submitting ? "Creating..." : "Launch Poll"}
          </button>
        </form>
      </div>
    </div>
  );
}
