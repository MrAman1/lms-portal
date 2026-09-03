"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChapterContent from "@/components/ChapterContent";
import ChatSidebar from "@/components/ChatSidebar";
import MermaidRenderer from "@/components/MermaidRenderer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "@/lib/api";
import { BookOpen, Sparkles, ClipboardList } from "lucide-react";
import Link from "next/link";

type Chapter = {
  id: string;
  course_id: string;
  title: string;
  html_content: string;
  sections_json: { heading: string; level: number }[];
};

type Revision = {
  comparison_table_markdown: string;
  mnemonics: string[];
  mermaid_mindmap: string;
};

export default function ChapterPage() {
  const params = useParams<{ courseId: string; chapterId: string }>();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [revision, setRevision] = useState<Revision | null>(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [tab, setTab] = useState<"content" | "revision">("content");

  useEffect(() => {
    if (!params.chapterId) return;
    api.get(`/chapters/${params.chapterId}`).then((res) => setChapter(res.data));
    // mark as viewed / partial progress
    api.post(`/chapters/${params.chapterId}/progress?completion_pct=50`).catch(() => {});
  }, [params.chapterId]);

  async function loadRevisionAids() {
    if (revision || revisionLoading) {
      setTab("revision");
      return;
    }

    setTab("revision");
    setRevisionLoading(true);
    try {
      const res = await api.post("/quiz/revision-aids", { chapter_id: params.chapterId });
      setRevision(res.data);
    } catch {
      /* noop, shown as empty state */
    } finally {
      setRevisionLoading(false);
    }
  }

  function markComplete() {
    api.post(`/chapters/${params.chapterId}/progress?completion_pct=100`).catch(() => {});
  }

  // Helpers for sidebar section navigation
  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  };

  const scrollToSection = (headingText: string) => {
    const id = slugify(headingText);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!chapter) {
    return (
      <div>
        <Navbar />
        <p className="text-center text-slate-500 mt-20">Loading chapter...</p>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[220px_1fr_340px] gap-6">
        {/* Table of contents */}
        <aside className="hidden lg:block">
          <div className="card p-4 sticky top-20">
            <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">On this page</h3>
            <ul className="space-y-1 text-sm">
              {chapter.sections_json.map((s, i) => (
                <li
                  key={i}
                  style={{ paddingLeft: (s.level - 1) * 10 }}
                  onClick={() => scrollToSection(s.heading)}
                  className="text-slate-600 hover:text-brand-600 truncate cursor-pointer transition-colors"
                >
                  {s.heading}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Main content */}
        <main>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <BookOpen className="w-4 h-4" /> Chapter
          </div>
          <h1 className="text-3xl font-bold mb-4">{chapter.title}</h1>

          <div className="flex gap-2 mb-6">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === "content"
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-slate-300 text-slate-600"
              }`}
              onClick={() => setTab("content")}
            >
              Chapter Content
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 ${
                tab === "revision"
                  ? "bg-brand-600 text-white"
                  : "bg-white border border-slate-300 text-slate-600"
              }`}
              onClick={loadRevisionAids}
            >
              <Sparkles className="w-3.5 h-3.5" /> Revision Aids
            </button>
            <Link
              href={`/quiz/generate?chapterId=${chapter.id}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-600 flex items-center gap-1"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Quiz
            </Link>
          </div>

          {tab === "content" && (
            <div className="card p-6">
              <ChapterContent html={chapter.html_content} />
              <button onClick={markComplete} className="btn-secondary mt-4 text-sm">
                Mark chapter complete
              </button>
            </div>
          )}

          {tab === "revision" && (
            <div className="space-y-6">
              {revisionLoading && (
                <p className="text-slate-500 text-sm">
                  Generating revision aids from this chapter...
                </p>
              )}

              {revision && (
                <>
                  {revision.comparison_table_markdown && (
                    <div className="card p-6">
                      <h3 className="font-semibold mb-3">Comparison Table</h3>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {revision.comparison_table_markdown}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {revision.mnemonics?.length > 0 && (
                    <div className="card p-6">
                      <h3 className="font-semibold mb-3">Mnemonics</h3>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">
                        {revision.mnemonics.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {revision.mermaid_mindmap && (
                    <div className="card p-6">
                      <h3 className="font-semibold mb-3">Mind Map</h3>
                      <MermaidRenderer chart={revision.mermaid_mindmap} id={chapter.id} />
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>

        {/* AI chat sidebar */}
        <div>
          <ChatSidebar chapterId={chapter.id} />
        </div>
      </div>
    </div>
  );
}