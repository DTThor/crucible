"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Timer, Dumbbell, User, CalendarRange } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/" as const, label: "Today", icon: Home },
  { href: "/fast" as const, label: "Fast", icon: Timer },
  { href: "/train" as const, label: "Train", icon: Dumbbell },
  { href: "/plan" as const, label: "Plan", icon: CalendarRange },
  { href: "/me" as const, label: "Me", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
