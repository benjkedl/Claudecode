"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, BarChart2, MessageCircle, Zap } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Zap },
  { href: "/learn", label: "Learn", icon: BookOpen },
  { href: "/analyze", label: "Analyze", icon: BarChart2 },
  { href: "/coach", label: "Coach", icon: MessageCircle },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
            <Zap size={16} className="text-white" />
          </div>
          LearnAI
        </Link>
        <div className="flex items-center gap-1">
          {navItems.slice(1).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                pathname === href
                  ? "bg-primary-500/10 text-primary-500"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
