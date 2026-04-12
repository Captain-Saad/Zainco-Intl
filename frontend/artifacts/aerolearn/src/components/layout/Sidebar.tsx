import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, BookOpen, TrendingUp, User, LogOut, Users, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

import { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

const studentLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "My Courses", icon: BookOpen },
  { href: "/progress", label: "Progress", icon: TrendingUp },
  { href: "/profile", label: "Profile", icon: User },
];

const adminLinks: NavLink[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const links = user?.role === "admin" ? adminLinks : studentLinks;

  const SidebarContent = () => (
    <div className="flex flex-col h-full relative">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 1px, #fff 1px, #fff 2px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* Logo */}
      <div className="p-6 relative z-10 flex items-center justify-between">
        <Link
          href={user?.role === "admin" ? "/admin" : "/dashboard"}
          className="flex items-center gap-2"
        >
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Zainco Logo" className="w-14 h-14 object-contain shrink-0" />
          <span className="font-display font-bold text-xl tracking-wider">
            Zainco <span className="text-primary">Intl</span>
          </span>
        </Link>
        {/* Mobile close button */}
        <button
          className="md:hidden text-muted-foreground hover:text-foreground transition-colors p-1"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>

      {user?.role === "admin" && (
        <div className="px-6 pb-2 relative z-10">
          <div className="text-[10px] font-mono tracking-widest text-primary px-2 py-0.5 border border-primary/30 rounded inline-block bg-primary/10">
            ADMIN PANEL
          </div>
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-4 py-4 space-y-1 relative z-10">
        {links.map((link) => {
          const isActive =
            location === link.href ||
            (!link.exact && location.startsWith(`${link.href}/`));
          return (
            <Link key={link.href} href={link.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer min-h-[48px]",
                  isActive
                    ? "bg-primary/10 text-primary border-l-4 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5 border-l-4 border-transparent"
                )}
              >
                <link.icon size={20} className="shrink-0" />
                <span className="font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom user + logout */}
      <div className="p-4 border-t border-border/50 relative z-10">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors min-h-[48px]"
        >
          <LogOut size={20} className="shrink-0" />
          <span className="font-medium">Sign Out</span>
        </button>

        <div className="mt-4 flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full border-2 border-primary/50 flex items-center justify-center bg-card text-foreground font-display font-bold shrink-0">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .substring(0, 2) || "U"}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {user?.license || user?.role}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile hamburger button (top-left, fixed) ── */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center text-foreground shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar drawer ── */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 bottom-0 w-72 bg-secondary border-r border-border z-50 transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* ── Desktop sidebar (always visible at md+) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-secondary border-r border-border flex-col z-40">
        <SidebarContent />
      </aside>
    </>
  );
}
