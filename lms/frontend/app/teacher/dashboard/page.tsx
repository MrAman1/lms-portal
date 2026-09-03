"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Users, TrendingUp, AlertTriangle, Upload, Copy, Check, BookOpen, Trophy, Plus } from "lucide-react";

type Course = { 
  id: string; 
  title: string; 
  code?: string;
  department?: string;
  enrolled_count?: number;
};

export default function TeacherDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [analytics, setAnalytics] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [teacherName, setTeacherName] = useState<string>("");

  // 1. Fetch Dynamic Teacher Profile Name
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        const name = res.data.full_name || res.data.name || res.data.username || res.data.email?.split("@")[0];
        if (name) setTeacherName(name);
      })
      .catch(() => {
        api.get("/users/me")
          .then((res) => {
            const name = res.data.full_name || res.data.name || res.data.username || res.data.email?.split("@")[0];
            if (name) setTeacherName(name);
          })
          .catch(() => {
            try {
              const storedUser = localStorage.getItem("user");
              if (storedUser) {
                const parsed = JSON.parse(storedUser);
                setTeacherName(parsed.full_name || parsed.name || parsed.username || parsed.email?.split("@")[0] || "");
              } else {
                const directName = localStorage.getItem("teacherName") || localStorage.getItem("name") || localStorage.getItem("username");
                if (directName) setTeacherName(directName);
              }
            } catch (e) {
              console.error("Session parse error", e);
            }
          });
      });
  }, []);

  // 2. Fetch Teacher Courses
  useEffect(() => {
    api.get("/courses/teacher")
      .then((res) => {
        setCourses(res.data);
        if (res.data.length) setSelectedCourse(res.data[0].id);
      })
      .catch((err) => console.error("Failed to fetch teacher courses:", err));
  }, []);

  // 3. Fetch Selected Course Analytics
  useEffect(() => {
    if (!selectedCourse) return;
    api.get(`/analytics/teacher/course/${selectedCourse}`)
      .then((res) => setAnalytics(res.data))
      .catch((err) => console.error("Failed to fetch course analytics:", err));
  }, [selectedCourse]);

  const activeCourseObj = courses.find((c) => c.id === selectedCourse);

  const copyCodeToClipboard = (code?: string) => {
    const targetCode = code || activeCourseObj?.code;
    if (!targetCode) return;
    navigator.clipboard.writeText(targetCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const weakTopicData = (analytics?.class_weak_topics || []).map((w: any) => ({
    name: w.topic,
    misses: w.miss_count,
  }));

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans pb-16 text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        
        {/* Purple Hero Banner (Matches Reference UI & Displays Dynamic Name) */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome Back, {teacherName ? teacherName : "Teacher"}!
            </h1>
            <p className="text-purple-100 text-xs sm:text-sm max-w-lg leading-relaxed">
              <span className="font-semibold text-white">Designation:</span> Professor & Head of Dept (HOD) — Track student reading progress, quiz scores, topic mastery, and manage course notes.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/upload"
              className="bg-white text-indigo-700 hover:bg-purple-50 font-bold text-xs px-5 py-3 rounded-2xl transition shadow-md flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </Link>
          </div>
        </div>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Enrolled Students"
            value={analytics?.total_students ?? "-"}
            subtext="Total Active Learners"
            color="indigo"
          />
          <StatCard
            icon={Trophy}
            label="Class Quiz Average"
            value={analytics?.avg_completion_pct !== undefined ? `${analytics.avg_completion_pct}%` : "-"}
            subtext="Across All Quizzes"
            color="amber"
          />
          <StatCard
            icon={BookOpen}
            label="Class Reading Rate"
            value={analytics?.reading_rate !== undefined ? `${analytics.reading_rate}%` : "11%"}
            subtext="Chapters Published"
            color="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="At Risk Students"
            value={analytics?.at_risk_students ?? "0"}
            subtext="Score <50% or Low Reading"
            color="rose"
          />
        </div>

        {/* Classrooms Grid & Join Codes Section */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-800">
                My Classrooms & Student Join Codes ({courses.length})
              </h2>
            </div>
            <Link
              href="/upload"
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Classroom
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {courses.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCourse(c.id)}
                className={`bg-white p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-4 shadow-sm ${
                  selectedCourse === c.id
                    ? "border-emerald-500 ring-2 ring-emerald-500/20"
                    : "border-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {c.department || "General"}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base mt-1">{c.title}</h3>
                </div>

                {c.code && (
                  <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Student Join Code</p>
                      <p className="text-sm font-extrabold text-emerald-800 tracking-wider">{c.code}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyCodeToClipboard(c.code);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy Code
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white p-8 text-center border border-dashed border-slate-200 rounded-3xl space-y-3">
            <h3 className="text-base font-bold text-slate-800">No courses created yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your first study material or notes to generate a course and share its code with students.
            </p>
            <Link href="/upload" className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition shadow-sm">
              <Upload className="w-4 h-4" /> Upload New Course
            </Link>
          </div>
        ) : (
          <>
            {/* Active Course View & Analytics Details */}
            {analytics && (
              <div className="space-y-6 pt-4 border-t border-slate-200">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600">Active Classroom View</span>
                    <h2 className="text-xl font-extrabold text-slate-800">
                      Analytics for {activeCourseObj?.title}
                    </h2>
                  </div>

                  {/* Course Selector Dropdown */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-slate-500">Select Course:</label>
                    <select
                      className="bg-white border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Class-wide Weak Topics Chart */}
                {weakTopicData.length > 0 && (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Class-wide Weak Topics
                    </h2>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={weakTopicData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" fontSize={12} stroke="#94a3b8" />
                        <YAxis type="category" dataKey="name" fontSize={12} stroke="#64748b" width={140} />
                        <Tooltip />
                        <Bar dataKey="misses" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Student Progress Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-sm text-slate-800">Student Progress Breakdown</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-slate-50 text-slate-400 uppercase font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-3.5">Student</th>
                          <th className="px-6 py-3.5">Chapters Completed</th>
                          <th className="px-6 py-3.5">Avg Quiz Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analytics.student_progress.map((s: any) => (
                          <tr key={s.student_id || s.student_name} className="hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-semibold text-slate-800">{s.student_name}</td>
                            <td className="px-6 py-4">
                              {s.chapters_completed} / {s.total_chapters}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">{s.avg_quiz_score}%</td>
                          </tr>
                        ))}
                        {analytics.student_progress.length === 0 && (
                          <tr>
                            <td className="px-6 py-6 text-center text-slate-400" colSpan={3}>
                              No enrolled students or activity for this course yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color }: { icon: any; label: string; value: any; subtext: string; color: string }) {
  const bgStyles: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    emerald: "bg-emerald-50 text-emerald-600",
    rose: "bg-rose-50 text-rose-600",
  };

  const textStyles: Record<string, string> = {
    indigo: "text-indigo-600",
    amber: "text-amber-600",
    emerald: "text-emerald-600",
    rose: "text-rose-600",
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgStyles[color] || "bg-slate-50 text-slate-600"}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div>
        <p className={`text-2xl font-extrabold ${textStyles[color] || "text-slate-800"}`}>{value}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">{subtext}</p>
      </div>
    </div>
  );
}