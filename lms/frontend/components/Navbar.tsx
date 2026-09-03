"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, clearSession, User } from "@/lib/api";
import { LogOut, Sparkles } from "lucide-react";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  function logout() {
    clearSession();
    router.push("/login");
  }

  return (
    <nav className="border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* CogniAssistant Brand Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-md shadow-cyan-100">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl tracking-tight text-slate-800">
              Cogni<span className="text-cyan-600">Assistant</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-1">
              AI Learning Assistant
            </span>
          </div>
        </Link>

        {/* Action Links & Authentication States */}
        <div className="flex items-center gap-4 text-sm font-medium">
          {user ? (
            <>
              {user.role === "teacher" ? (
                <>
                  <Link href="/teacher/dashboard" className="text-slate-600 hover:text-cyan-600 transition">
                    Teacher Dashboard
                  </Link>
                  <Link href="/upload" className="text-slate-600 hover:text-cyan-600 transition">
                    Upload Notes
                  </Link>
                </>
              ) : (
                <Link href="/student/dashboard" className="text-slate-600 hover:text-cyan-600 transition">
                  My Dashboard
                </Link>
              )}
              <span className="text-slate-300">|</span>
              <span className="text-slate-700 font-semibold">{user.name}</span>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition ml-2"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900 transition">
                Login
              </Link>
              <Link
                href="/register"
                className="text-white font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 px-5 py-2 rounded-xl shadow-md shadow-cyan-100 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}