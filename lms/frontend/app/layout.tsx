import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LMS Portal",
  description: "Document-to-web LMS with AI study assistant",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
