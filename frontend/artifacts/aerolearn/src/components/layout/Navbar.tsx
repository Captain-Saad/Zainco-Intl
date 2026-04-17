import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "../shared/Button";
import { cn } from "@/lib/utils";
import { Plane, Menu, X } from "lucide-react";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const isHome = location === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (isHome) {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    } else {
      sessionStorage.setItem("scrollTo", sectionId);
      navigate("/");
    }
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 md:px-6 py-3 md:py-4",
        scrolled || mobileMenuOpen
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-lg"
          : "bg-transparent"
      )}
    >
      <div className="w-[92%] max-w-[1800px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Zainco Logo" className="w-16 h-16 md:w-[72px] md:h-[72px] object-contain group-hover:scale-105 transition-transform shrink-0" />
          <span className="font-display font-bold text-xl md:text-2xl tracking-widest text-foreground">
            ZAINCO<span className="text-primary"> INTL</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <button
            onClick={() => scrollToSection("program")}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            PROGRAMS
          </button>
          <button
            onClick={() => scrollToSection("instructors")}
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            INSTRUCTORS
          </button>
          <Link href="/login">
            <Button variant="ghost" className="text-foreground">
              Sign In
            </Button>
          </Link>
          <Link href="/enroll">
            <Button variant="primary">Enroll Now</Button>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden w-10 h-10 flex items-center justify-center text-foreground rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pb-4 px-2 border-t border-border/50 flex flex-col gap-1">
          <button
            onClick={() => scrollToSection("program")}
            className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-white/5 text-left"
          >
            PROGRAMS
          </button>
          <button
            onClick={() => scrollToSection("instructors")}
            className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-white/5 text-left"
          >
            INSTRUCTORS
          </button>
          <div className="flex flex-col gap-3 px-4 pt-3 mt-1 border-t border-border/30">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/enroll" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                Enroll Now
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
