"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { UploadCloud, Plus, FileText } from "lucide-react";

type Course = { id: string; title: string; description: string };

export default function UploadPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      const res = await api.get("/courses/");
      setCourses(res.data);
      if (res.data.length && !selectedCourse) setSelectedCourse(res.data[0].id);
    } catch {
      /* not logged in yet or no courses */
    }
  }

  async function createCourse() {
    if (!newCourseTitle.trim()) return;
    const res = await api.post("/courses/", { title: newCourseTitle, description: "" });
    setNewCourseTitle("");
    await loadCourses();
    setSelectedCourse(res.data.id);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !selectedCourse) return;
    setStatus({ type: "loading", msg: "Parsing document and building chapter..." });

    const form = new FormData();
    form.append("course_id", selectedCourse);
    form.append("title", chapterTitle);
    form.append("order_index", "0");
    form.append("file", file);

    try {
      const res = await api.post("/upload/chapter", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setStatus({ type: "success", msg: `Chapter "${res.data.title}" created and indexed for the AI assistant.` });
      setChapterTitle("");
      setFile(null);
    } catch (err: any) {
      setStatus({ type: "error", msg: err?.response?.data?.detail || "Upload failed" });
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1">Upload Chapter Notes</h1>
        <p className="text-slate-600 text-sm mb-8">
          Supports Word (.docx) and LaTeX (.tex). Files are parsed into structured, interactive
          chapter pages and indexed for the AI study assistant automatically.
        </p>

        <div className="card p-6 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> New course</h2>
          <div className="flex gap-2">
            <input
              className="input"
              placeholder="e.g. Introduction to Thermodynamics"
              value={newCourseTitle}
              onChange={(e) => setNewCourseTitle(e.target.value)}
            />
            <button className="btn-secondary whitespace-nowrap" onClick={createCourse}>Create</button>
          </div>
        </div>

        <form onSubmit={handleUpload} className="card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><FileText className="w-4 h-4" /> Upload chapter</h2>

          <div>
            <label className="text-sm font-medium text-slate-700">Course</label>
            <select className="input mt-1" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} required>
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Chapter title (optional — auto-detected if blank)</label>
            <input className="input mt-1" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">File (.docx or .tex)</label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl py-10 cursor-pointer hover:border-brand-400 transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-600">{file ? file.name : "Click to choose a file"}</span>
              <input
                type="file"
                accept=".docx,.tex"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <button className="btn-primary w-full" disabled={status.type === "loading" || !selectedCourse}>
            {status.type === "loading" ? "Processing..." : "Upload & Convert"}
          </button>

          {status.type !== "idle" && status.msg && (
            <p className={`text-sm ${status.type === "error" ? "text-red-600" : status.type === "success" ? "text-green-600" : "text-slate-500"}`}>
              {status.msg}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
