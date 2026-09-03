"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BookOpen, Trophy, TrendingUp, KeyRound, ArrowRight, Clock, Bot, Sparkles, GraduationCap } from "lucide-react";

type Course = { 
  id: string; 
  title: string; 
  description: string; 
  teacher_name?: string; 
};

export default function StudentDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [studentName, setStudentName] = useState<string>("");
  const [courseCode, setCourseCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchEnrolledCourses = () => {
    api.get("/courses/enrolled")
      .then((res) => setCourses(res.data))
      .catch((err) => console.error("Failed to fetch enrolled courses:", err));
  };

  useEffect(() => {
    fetchEnrolledCourses();

    // 1. Try to fetch the user profile from the backend API (matches Navbar pattern)
    api.get("/auth/me")
      .then((res) => {
        const name = res.data.full_name || res.data.name || res.data.username || res.data.email?.split("@")[0];
        if (name) setStudentName(name);
      })
      .catch(() => {
        // Alternative user profile endpoint fallback
        api.get("/users/me")
          .then((res) => {
            const name = res.data.full_name || res.data.name || res.data.username || res.data.email?.split("@")[0];
            if (name) setStudentName(name);
          })
          .catch((err) => console.error("Could not fetch user profile from API:", err));
      });

    // 2. Fallback: Parse localStorage or JWT token if API request is pending/unsupported
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const name = parsed.full_name || parsed.name || parsed.username || parsed.email?.split("@")[0];
        if (name) setStudentName(name);
      } else {
        const directName = localStorage.getItem("studentName") || localStorage.getItem("name") || localStorage.getItem("username");
        if (directName) setStudentName(directName);
      }
    } catch (e) {
      console.error("Failed to parse user session storage", e);
    }

    // Fetch student analytics
    api.get("/analytics/student/me")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Failed to fetch student analytics:", err));
  }, []);

  const handleJoinCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim()) return;

    setJoining(true);
    setJoinMsg(null);

    try {
      const res = await api.post("/courses/join", { code: courseCode.trim().toUpperCase() });
      setJoinMsg({ type: "success", text: res.data.message || "Successfully joined course!" });
      setCourseCode("");
      fetchEnrolledCourses();
    } catch (err: any) {
      setJoinMsg({
        type: "error",
        text: err?.response?.data?.detail || "Invalid code or failed to join course.",
      });
    } finally {
      setJoining(false);
    }
  };

  const chartData = (stats?.quiz_history || []).map((q: any, i: number) => ({
    name: `Quiz ${i + 1}`,
    score: q.score,
  }));

  // Dynamic Time Spent in Learning Calculation
  const quizzesCount = stats?.quiz_history?.length || 0;
  const enrolledCount = courses.length;
  const totalMinutes = (quizzesCount * 25) + (enrolledCount * 40);
  const hoursSpent = Math.floor(totalMinutes / 60);
  const minsSpent = totalMinutes % 60;
  const timeSpentDisplay = stats 
    ? (hoursSpent > 0 ? `${hoursSpent}h ${minsSpent}m` : `${minsSpent}m`)
    : "-";

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-16 text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Dynamic Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-emerald-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hi {studentName ? studentName : "Student"}! 👋
            </h1>
            <p className="mt-2 text-emerald-50 text-xs sm:text-sm max-w-md leading-relaxed">
              Welcome back! Enter your teacher's Classroom Join Code to unlock course notes, study materials, and faculty assignments.
            </p>
          </div>

          <form 
            onSubmit={handleJoinCourse}
            className="w-full md:w-auto bg-slate-900/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2"
          >
            <div className="relative flex-1 md:w-64">
              <KeyRound className="w-4 h-4 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ENTER CODE (E.G. A3F812)"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white text-xs font-bold text-slate-800 tracking-wider uppercase placeholder:text-slate-400 placeholder:normal-case focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={joining}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-900 font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-1 shrink-0"
            >
              {joining ? "Joining..." : "Join"} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {joinMsg && (
          <div className={`p-4 rounded-2xl text-xs font-medium border ${joinMsg.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-600"}`}>
            {joinMsg.text}
          </div>
        )}

        {/* Dynamic 4-Stat Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={BookOpen} label="Chapters Completed" value={stats?.chapters_completed ?? "-"} color="cyan" />
          <StatCard icon={Trophy} label="Avg Quiz Score" value={stats ? `${stats.avg_quiz_score}%` : "-"} color="amber" />
          <StatCard icon={TrendingUp} label="Quizzes Taken" value={stats?.quiz_history?.length ?? "-"} color="indigo" />
          <StatCard icon={Clock} label="Time Spent Learning" value={timeSpentDisplay} color="emerald" />
        </div>

        {/* Learning Tools Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-500" /> Learning Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* AI Tutor Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">AI Tutor & Assistant</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Ask questions, clarify concepts, and receive instant grounded explanations from syllabus notes.
                  </p>
                </div>
              </div>
              <Link
                href="/tutor"
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs text-center shadow-md shadow-emerald-100 transition flex items-center justify-center gap-2"
              >
                <Bot className="w-4 h-4" /> Launch AI Tutor
              </Link>
            </div>

            {/* Revision Aids Card */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Revision Aids & Mind Maps</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Visual React Flow mind maps, Mermaid flowcharts, comparison matrices, and memory mnemonics.
                  </p>
                </div>
              </div>
              <Link
                href="/revision"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs text-center shadow-md shadow-indigo-100 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Explore Revision Aids
              </Link>
            </div>

          </div>
        </section>

        {/* Quiz History Chart */}
        {chartData.length > 0 && (
          <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="font-bold text-sm text-slate-800">Quiz Score History</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                <YAxis fontSize={12} domain={[0, 100]} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="score" fill="#06b6d4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        )}

        {/* Enrolled Courses Section */}
        <section className="space-y-4">
          <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-cyan-600" /> My Enrolled Courses
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {courses.map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.id}`}
                className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-cyan-400 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{c.title}</h3>
                  {c.teacher_name && (
                    <p className="text-xs font-semibold text-cyan-600 mt-0.5">Instructor: {c.teacher_name}</p>
                  )}
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{c.description || "No description available"}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <span className="text-xs font-semibold text-cyan-600 flex items-center gap-1">
                    Continue Learning <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
            {courses.length === 0 && (
              <div className="col-span-2 text-center py-10 text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-white">
                <p className="text-sm font-semibold text-slate-700">You haven't enrolled in any courses yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use the banner above to enter a course code from your teacher.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  const bgStyles: Record<string, string> = {
    cyan: "bg-cyan-50 text-cyan-600",
    amber: "bg-amber-50 text-amber-600",
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgStyles[color] || "bg-slate-50 text-slate-600"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}