"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { BookOpen, FileText } from "lucide-react";

type Chapter = { id: string; title: string; order_index: number; source_type: string };
type Course = { id: string; title: string; description: string };

export default function CoursePage() {
  const params = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    if (!params.courseId) return;
    api.get(`/courses/${params.courseId}`).then((res) => setCourse(res.data));
    api.get(`/courses/${params.courseId}/chapters`).then((res) => setChapters(res.data));
  }, [params.courseId]);

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <BookOpen className="w-4 h-4" /> Course
        </div>
        <h1 className="text-2xl font-bold mb-1">{course?.title || "Loading..."}</h1>
        <p className="text-slate-600 text-sm mb-8">{course?.description}</p>

        <h2 className="font-semibold mb-3">Chapters</h2>
        <div className="space-y-3">
          {chapters.map((ch) => (
            <Link
              key={ch.id}
              href={`/course/${params.courseId}/chapter/${ch.id}`}
              className="card p-4 flex items-center justify-between hover:border-brand-400 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="font-medium">{ch.title}</span>
              </div>
              <span className="text-xs uppercase text-slate-400">{ch.source_type}</span>
            </Link>
          ))}
          {chapters.length === 0 && <p className="text-slate-500 text-sm">No chapters uploaded yet.</p>}
        </div>
      </div>
    </div>
  );
}
