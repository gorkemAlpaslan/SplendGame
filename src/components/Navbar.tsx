"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useMounted } from "@/lib/hooks";
import { cls } from "@/lib/utils";
import { Gamepad2, Trophy, User, Dices } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  const mounted = useMounted();

  const LINKS = [
    { href: "/oyunlar", label: "Oyunlar", icon: Gamepad2 },
    { href: "/skor-tablosu", label: "Skor Tablosu", icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-bg/75 border-b border-edge/15">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-2 sm:gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <Dices className="w-5 h-5 text-primary-soft group-hover:rotate-12 transition-transform duration-300" />
          <span className="font-extrabold text-lg tracking-tight title-gradient">
            Splend Game
          </span>
        </Link>

        <div className="flex-1" />

        {LINKS.map((l) => {
          const Icon = l.icon;
          const isActive = pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cls(
                "chip flex items-center gap-1.5 transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary-soft border-primary/20"
                  : "text-muted hover:text-ink hover:bg-surface-2/40"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{l.label}</span>
            </Link>
          );
        })}

        <Link
          href="/profil"
          className={cls(
            "chip max-w-40 flex items-center gap-1.5 transition-all duration-200",
            pathname.startsWith("/profil")
              ? "bg-primary/10 text-primary-soft border-primary/20"
              : "text-muted hover:text-ink hover:bg-surface-2/40"
          )}
        >
          <User className="w-3.5 h-3.5" />
          <span className="hidden sm:inline truncate">
            {mounted ? profile.name : "…"}
          </span>
        </Link>
      </nav>
    </header>
  );
}
