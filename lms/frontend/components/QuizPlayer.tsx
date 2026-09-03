"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle } from "lucide-react";

type Question = {
  question: string;
  options: string[];
  correct_index: number;
  topic: string;
};

export default function QuizPlayer({ quizId, questions }: { quizId: string; questions: Question[] }) {
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; weak_topics_json: any[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function choose(qIndex: number, optIndex: number) {
    if (submitted) return;
    setSelected((s) => ({ ...s, [qIndex]: optIndex }));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const answers = questions.map((_, i) => ({ q_index: i, selected_index: selected[i] ?? -1 }));
      const res = await api.post("/quiz/submit", { quiz_id: quizId, answers });
      setResult(res.data);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {result && (
        <div className="card p-6 bg-brand-50 border-brand-200">
          <h2 className="text-xl font-bold">
            Score: {result.score}% ({Math.round((result.score / 100) * result.total)}/{result.total})
          </h2>
          {result.weak_topics_json?.length > 0 && (
            <div className="mt-2 text-sm text-slate-600">
              Topics to review: {result.weak_topics_json.map((w: any) => w.topic).join(", ")}
            </div>
          )}
        </div>
      )}

      {questions.map((q, qi) => (
        <div key={qi} className="card p-6">
          <p className="font-medium mb-3">{qi + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const isSelected = selected[qi] === oi;
              const isCorrect = submitted && oi === q.correct_index;
              const isWrongSelected = submitted && isSelected && oi !== q.correct_index;
              return (
                <button
                  key={oi}
                  onClick={() => choose(qi, oi)}
                  disabled={submitted}
                  className={`w-full text-left px-4 py-2 rounded-lg border text-sm flex items-center justify-between
                    ${isSelected && !submitted ? "border-brand-500 bg-brand-50" : "border-slate-200"}
                    ${isCorrect ? "border-green-500 bg-green-50" : ""}
                    ${isWrongSelected ? "border-red-500 bg-red-50" : ""}
                  `}
                >
                  <span>{opt}</span>
                  {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  {isWrongSelected && <XCircle className="w-4 h-4 text-red-600" />}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted && (
        <button className="btn-primary w-full" onClick={submit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Quiz"}
        </button>
      )}
    </div>
  );
}
