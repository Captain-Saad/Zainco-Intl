import { Link } from "wouter";
import { Plane, AlertTriangle } from "lucide-react";
import { Button } from "@/components/shared/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4">
      <div className="radar-bg opacity-20" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-background to-background z-0" />

      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/30 mb-8">
          <AlertTriangle size={36} className="text-primary" />
        </div>

        <p className="font-mono text-xs tracking-[0.4em] text-muted-foreground mb-4">NAVIGATION ERROR</p>
        <h1 className="font-display font-bold text-8xl md:text-9xl text-foreground/10 leading-none mb-2 select-none">
          404
        </h1>
        <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-4">
          Route Not Found
        </h2>
        <p className="text-muted-foreground max-w-sm mb-10">
          The page you are looking for does not exist or has been moved. Return to the flight deck.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/">
            <Button size="lg" className="gap-2">
              <Plane size={18} className="-rotate-45" /> Back to Homepage
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
