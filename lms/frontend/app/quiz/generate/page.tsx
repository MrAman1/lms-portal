"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { Sparkles } from "lucide-react";

export default function GenerateQuizPage() {
  return (
    <Suspense fallback={null}>
      <GenerateQuizInner />
    </Suspense>
  );
}

function GenerateQuizInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const chapterId = searchParams.get("chapterId") || "";
  const [numQuestions, setNumQuestions] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/quiz/generate", { chapter_id: chapterId, num_questions: numQuestions });
      router.push(`/quiz/${res.data.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Quiz generation failed. (Teacher account required.)");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="card p-8 text-center">
          <Sparkles className="w-8 h-8 text-brand-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold mb-1">One-Click Quiz Builder</h1>
          <p className="text-sm text-slate-600 mb-6">
            Generates a multiple-choice quiz directly from this chapter's content.
          </p>

          <label className="text-sm font-medium text-slate-700 block mb-1 text-left">Number of questions</label>
          <input
            type="number"
            min={3}
            max={15}
            className="input mb-4"
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <button className="btn-primary w-full" onClick={generate} disabled={loading || !chapterId}>
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>
      </div>
    </div>
  );
}
