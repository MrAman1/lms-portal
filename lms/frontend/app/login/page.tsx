"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api, setSession } from "@/lib/api";
import { GraduationCap, Building2, ShieldCheck, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [roleTab, setRoleTab] = useState<"student" | "teacher" | "admin">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      setSession(res.data.access_token, res.data.user);

      const rawRole = res.data.user?.role || "";
      const role = String(rawRole).toLowerCase();

      if (role.includes("admin")) {
        router.push("/admin");
      } else if (role.includes("teacher")) {
        router.push("/teacher/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col justify-between text-slate-700 font-sans">
      <Navbar />

      <div className="w-full max-w-md mx-auto my-auto px-4 py-8">
        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
          
          {/* Role Selection Tabs */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => setRoleTab("student")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                roleTab === "student"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("teacher")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                roleTab === "teacher"
                  ? "bg-cyan-600 text-white shadow-md shadow-cyan-200"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="w-4 h-4" />
              Teacher
            </button>
            <button
              type="button"
              onClick={() => setRoleTab("admin")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                roleTab === "admin"
                  ? "bg-slate-800 text-white shadow-md shadow-slate-300"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Admin
            </button>
          </div>

          {/* Tab Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-800 border-b-2 border-cyan-500 pb-3 -mb-3">
                Sign In
              </span>
              <Link href="/register" className="text-slate-400 hover:text-slate-600 font-medium pb-3 -mb-3">
                Create Account
              </Link>
            </div>
            <span className="text-[11px] font-medium text-slate-400 capitalize">
              {roleTab} Portal
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-xs rounded-xl bg-red-50 border border-red-100 text-red-600 font-medium">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email or Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@aipower.edu"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me / Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-slate-500">
                <input type="checkbox" className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                Remember me
              </label>
              <Link href="#" className="text-cyan-600 font-medium hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold text-white shadow-md transition mt-2 capitalize ${
                roleTab === "student"
                  ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200"
                  : roleTab === "teacher"
                  ? "bg-cyan-600 hover:bg-cyan-700 shadow-cyan-200"
                  : "bg-slate-800 hover:bg-slate-900 shadow-slate-300"
              }`}
            >
              {loading ? "Signing in..." : `Sign In as ${roleTab}`}
            </button>
          </form>
        </div>
      </div>

      {/* Footer Links */}
      <footer className="w-full max-w-md mx-auto pb-6 border-t border-slate-200/60 flex items-center justify-center gap-6 text-[11px] text-slate-400">
        <Link href="#" className="hover:text-slate-600">Security Protocol</Link>
        <Link href="#" className="hover:text-slate-600">Terms of Service</Link>
        <Link href="#" className="hover:text-slate-600">Support</Link>
      </footer>
    </div>
  );
}