"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/lib/api";
import { Send, Bot, User as UserIcon, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  grounded?: boolean;
  sources?: string[];
};

export default function ChatSidebar({ chapterId }: { chapterId: string }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! Ask me anything about this chapter — I'll answer strictly from its notes." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: question }]);
    setLoading(true);
    try {
      const res = await api.post("/chat/", { chapter_id: chapterId, question });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: res.data.answer, grounded: res.data.grounded, sources: res.data.sources },
      ]);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: err?.response?.data?.detail || "Something went wrong. Please try again.", grounded: false },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card flex flex-col h-[calc(100vh-7rem)] sticky top-20">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
        <Bot className="w-5 h-5 text-brand-600" />
        <span className="font-semibold text-sm">AI Study Assistant</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && <Bot className="w-5 h-5 text-brand-600 shrink-0 mt-1" />}
            <div
              className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              <div className="prose prose-sm max-w-none prose-p:my-1">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
              {m.role === "assistant" && m.grounded === false && (
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                  <AlertCircle className="w-3 h-3" /> Not found in chapter notes
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="text-xs text-slate-400 mt-1">Source: {m.sources.join(", ")}</div>
              )}
            </div>
            {m.role === "user" && <UserIcon className="w-5 h-5 text-slate-400 shrink-0 mt-1" />}
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 pl-7">Thinking...</div>}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-slate-200 flex gap-2">
        <input
          className="input"
          placeholder="Ask about this chapter..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button className="btn-primary px-3" onClick={send} disabled={loading}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
