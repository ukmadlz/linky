"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Palette, Settings, BarChart2 } from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/appearance",
    label: "Appearance",
    icon: Palette,
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart2,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-slate-800 bg-[#1e2235] md:flex">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <span className="font-display text-xl font-semibold text-white">
            biohasl.ink
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
                  : pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
                    style={
                      isActive
                        ? {
                            backgroundColor: "rgba(95, 77, 197, 0.15)",
                            color: "#a89af7",
                          }
                        : {
                            color: "#94a3b8",
                          }
                    }
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#e2e8f0";
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "rgba(255,255,255,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        (e.currentTarget as HTMLElement).style.color = "#94a3b8";
                        (e.currentTarget as HTMLElement).style.backgroundColor =
                          "transparent";
                      }
                    }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-800 bg-[#1e2235] md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname.startsWith("/dashboard/")
              : pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors duration-200"
              style={isActive ? { color: "#a89af7" } : { color: "#94a3b8" }}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
