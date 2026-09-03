"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

let initialized = false;

export default function MermaidRenderer({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "neutral",
        securityLevel: "loose",
      });
      initialized = true;
    }

    let cancelled = false;
    setError("");

    async function render() {
      if (!chart) return;

      // Clean markdown code blocks & fences
      const cleanChart = chart
        .replace(/```mermaid/gi, "")
        .replace(/```/g, "")
        .trim();

      if (!cleanChart) return;

      try {
        // 1. Validate syntax BEFORE rendering to block DOM error injection
        await mermaid.parse(cleanChart);

        // 2. Safely render valid syntax
        const safeId = `mermaid-${id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
        const { svg } = await mermaid.render(safeId, cleanChart);

        if (!cancelled && ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (e: any) {
        if (!cancelled) {
          // Removes any lingering Mermaid error elements from the DOM
          const errorElem = document.querySelectorAll("[id^='dmermaid']");
          errorElem.forEach((el) => el.remove());

          setError("Could not render mind map diagram.");
        }
      }
    }

    render();

    return () => {
      cancelled = true;
    };
  }, [chart, id]);

  if (error) return <p className="text-sm text-red-500 py-2">{error}</p>;
  return <div ref={ref} className="overflow-x-auto" />;
}