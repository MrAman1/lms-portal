import Navbar from "@/components/Navbar";
import Link from "next/link";
import { Sparkles, Shield, GraduationCap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-20">
        
        {/* SECTION 1: FACULTY CONTENT SUITE */}
        <section>
          {/* Tag Header */}
          <div className="inline-flex items-center gap-2 px-3 me-2 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
            Faculty Content Suite
          </div>

          {/* Heading & Subtitle */}
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
            Turn Academic Material into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              Interactive Learning
            </span>{" "}
            <span className="text-cyan-400 font-bold">with</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Upload your Word, PDF, or LaTeX material and transform it into structured web-based learning content for your students.
          </p>

          {/* 3 Faculty Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-cyan-600 text-base">DOCX / PDF / TeX</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Document Upload</p>
              <p className="text-xs text-slate-500 leading-relaxed">Seamlessly parse and import structured academic documents into web formats.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-cyan-600 text-base">Automatic</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Extraction</p>
              <p className="text-xs text-slate-500 leading-relaxed">Auto-extract core concepts, topics, and structure across your course content.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-cyan-600 text-base">Structured</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Publish Notes</p>
              <p className="text-xs text-slate-500 leading-relaxed">Publish interactive course notes accessible via 6-character access codes.</p>
            </div>
          </div>

          {/* Security Banner */}
          <div className="mt-6 bg-slate-100/70 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-600">
            <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span>
              <strong>Security:</strong> Role-Based Security: Teacher ownership controls, protected publishing, and secure role-based access.
            </span>
          </div>
        </section>


        {/* SECTION 2: STUDENT INTELLIGENCE ECOSYSTEM */}
        <section>
          {/* Tag Header */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Student Intelligence Ecosystem
          </div>

          {/* Heading & Subtitle */}
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 max-w-3xl leading-tight">
            Learn Smarter{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
              with Your Syllabus
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
            Access your course chapters and study structured learning material converted from your academic documents into an interactive web experience.
          </p>

          {/* 3 Student Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-emerald-600 text-base">Web-Based</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Structured Notes</p>
              <p className="text-xs text-slate-500 leading-relaxed">Read rendered notes formatted with KaTeX math support and clear typography.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-emerald-600 text-base">Chapter Grounded</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Tutor</p>
              <p className="text-xs text-slate-500 leading-relaxed">RAG AI chatbot that answers questions strictly using your uploaded course content.</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
              <h3 className="font-bold text-emerald-600 text-base">Interactive</h3>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Learning Support</p>
              <p className="text-xs text-slate-500 leading-relaxed">Generate auto MCQ quizzes, revision summaries, and mnemonics on the fly.</p>
            </div>
          </div>

          {/* Security Banner */}
          <div className="mt-6 bg-slate-100/70 border border-slate-200/60 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-600">
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span>
              <strong>Security:</strong> Role-Based Security: Secure JWT authentication, protected student resources, and bcrypt password protection.
            </span>
          </div>

          {/* Action Callouts */}
          <div className="mt-10 flex items-center gap-4">
            <Link
              href="/register"
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold text-sm px-7 py-3 rounded-xl shadow-md shadow-cyan-100 hover:opacity-95 transition"
            >
              Get Started Free
            </Link>
            <Link
              href="/login"
              className="bg-white text-slate-700 font-semibold text-sm px-7 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              Sign In
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200/60 text-xs text-slate-400">
          © 2026 CogniAssistant. All rights reserved.
        </footer>
      </main>
    </div>
  );
}