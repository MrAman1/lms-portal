"use client";

import { useEffect, useRef } from "react";
import katex from "katex";

/**
 * Helper to convert heading text into clean HTML IDs
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Takes the chapter's stored HTML (which contains literal $...$ and $$...$$
 * math delimiters produced by the backend parsers) and renders it, replacing
 * every math span with KaTeX-rendered markup client-side.
 * Also dynamically attaches IDs and scroll offsets to all headings for TOC navigation.
 */
export default function ChapterContent({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Render KaTeX math equations
    containerRef.current.innerHTML = renderMath(html);

    // 2. Attach IDs and scroll margins to all headings for sidebar navigation
    const headings = containerRef.current.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach((heading) => {
      const text = heading.textContent || "";
      if (text) {
        heading.id = slugify(text);
        heading.classList.add("scroll-mt-20");
      }
    });
  }, [html]);

  return <div ref={containerRef} className="chapter-content" />;
}

function renderMath(html: string): string {
  // Display math: $$ ... $$
  let out = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, expr) => safeRender(expr, true));
  // Inline math: $ ... $ (avoid matching leftover $$ already replaced)
  out = out.replace(/\$([^\n]+?)\$/g, (_, expr) => safeRender(expr, false));
  return out;
}

function safeRender(expr: string, displayMode: boolean): string {
  try {
    return katex.renderToString(expr.trim(), {
      throwOnError: false,
      displayMode,
    });
  } catch {
    return `<span class="text-red-500">[math error: ${expr}]</span>`;
  }
}