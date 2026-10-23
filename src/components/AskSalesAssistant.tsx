import React, { useState } from 'react';
import { Sparkles, Send, MessageSquare, CornerDownLeft, Loader2 } from 'lucide-react';

interface AskSalesAssistantProps {
  onAskQuestion: (question: string) => Promise<string>;
}

export const AskSalesAssistant: React.FC<AskSalesAssistantProps> = ({ onAskQuestion }) => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState('');

  const quickPrompts = [
    'Which regions are performing best and why?',
    'Which sales persons are falling behind quota?',
    'Which products drive the most revenue?',
    'What is our discount exposure on lost deals?',
    'Prepare 1-on-1 coaching focus for David Miller',
  ];

  const handleSubmit = async (qToSubmit?: string) => {
    const targetQ = qToSubmit || question;
    if (!targetQ.trim() || loading) return;

    setLoading(true);
    setLastQuestion(targetQ);
    try {
      const res = await onAskQuestion(targetQ);
      setAnswer(res);
      setQuestion('');
    } catch (err: any) {
      setAnswer(`Error answering query: ${err.message || 'Please check your connection and try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ask-ai" className="mb-10 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <span>Sales Operations Analyst Q&A</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
              Gemini 3.8 Flash
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Ask any specific question during your monthly review meeting to get instant, data-backed answers.
          </p>
        </div>
      </div>

      {/* Suggested Quick Questions */}
      <div className="my-3 flex flex-wrap gap-1.5">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(p)}
            disabled={loading}
            className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-md transition-colors cursor-pointer text-left"
          >
            "{p}"
          </button>
        ))}
      </div>

      {/* Input box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSubmit();
        }}
        className="relative mt-3"
      >
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="e.g. Which product in Europe has the highest win rate, and how can we scale it to Asia?"
          disabled={loading}
          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 pr-24"
        />
        <button
          type="submit"
          disabled={!question.trim() || loading}
          className="absolute right-2 top-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <>
              <span>Ask</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Answer Output */}
      {answer && (
        <div className="mt-4 p-4 bg-slate-950/80 border border-indigo-500/20 rounded-xl">
          <div className="text-xs font-semibold text-indigo-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analysis for: "{lastQuestion}"</span>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
            {answer}
          </div>
        </div>
      )}
    </section>
  );
};
