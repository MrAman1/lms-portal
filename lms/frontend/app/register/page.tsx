"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { api, setSession } from "@/lib/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { name, email, password, role });
      setSession(res.data.access_token, res.data.user);
      router.push(role === "teacher" ? "/teacher/dashboard" : "/student/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-md mx-auto mt-16 card p-8">
        <h1 className="text-2xl font-bold mb-6">Create your account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input className="input mt-1" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input className="input mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input className="input mt-1" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">I am a</label>
            <div className="flex gap-3">
              {(["student", "teacher"] as const).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-medium capitalize ${
                    role === r ? "bg-brand-600 text-white border-brand-600" : "border-slate-300 text-slate-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          Already have an account? <Link href="/login" className="text-brand-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
