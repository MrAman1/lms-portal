"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import QuizPlayer from "@/components/QuizPlayer";
import { api } from "@/lib/api";

export default function QuizPage() {
  const params = useParams<{ quizId: string }>();
  const [quiz, setQuiz] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.quizId) return;
    api
      .get(`/quiz/${params.quizId}`)
      .then((res) => setQuiz(res.data))
      .catch(() => setError("Quiz not found."));
  }, [params.quizId]);

  if (error) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-slate-500 mt-20">{error}</p>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-slate-500 mt-20">Loading quiz...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-6">{quiz.title}</h1>
        <QuizPlayer quizId={quiz.id} questions={quiz.questions_json} />
      </div>
    </div>
  );
}
