"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, LineChart, ClipboardList, Settings, ShieldCheck } from "lucide-react";

const items = [
  { title: "Dashboard", href: "/investor", icon: LayoutDashboard },
  { title: "Portfolio", href: "/investor/portfolio", icon: LineChart },
  { title: "Orders", href: "/investor/orders", icon: ClipboardList },
  { title: "KYC", href: "/investor/kyc", icon: ShieldCheck },
  { title: "Settings", href: "/investor/settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-20 space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/investor" && pathname?.startsWith(item.href));
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
              active ? "bg-accent text-foreground" : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
