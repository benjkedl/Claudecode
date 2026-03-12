import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LLM Learning Platform",
  description: "AI-powered platform for personalized learning, data analysis, and coaching",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
