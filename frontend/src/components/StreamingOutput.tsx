"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  text: string;
  isStreaming: boolean;
  className?: string;
}

export default function StreamingOutput({ text, isStreaming, className = "" }: Props) {
  if (!text) return null;

  return (
    <div className={`card mt-4 ${className}`}>
      <div className={`streaming-text ${isStreaming ? "streaming-cursor" : ""}`}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
      </div>
    </div>
  );
}
