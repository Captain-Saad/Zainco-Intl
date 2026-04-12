import { useState } from "react";
import { motion } from "framer-motion";
import { Plane, AlertCircle } from "lucide-react";
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("student@zainco.pk");
  const [password, setPassword] = useState("pilot123");
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(false);
    setIsLoading(true);
    
    try {
      await login(email, password);
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden px-4 gap-0">
      {/* Background Effects */}
      <div className="radar-bg opacity-40" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background z-0" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={error ? { x: [-10, 10, -10, 10, 0], opacity: 1, scale: 1 } : { opacity: 1, scale: 1 }}
        transition={error ? { duration: 0.4 } : { duration: 0.5 }}
        className="glass-card w-full max-w-md p-8 rounded-2xl relative z-10 hud-brackets border-t-2 border-t-primary"
      >
        <div className="flex flex-col items-center mb-8">
          <Link href="/">
            <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Zainco Logo" className="w-28 h-28 object-contain mb-4 cursor-pointer hover:scale-105 transition-transform" />
          </Link>
          <h1 className="text-3xl font-display font-bold tracking-widest text-foreground">ZAINCO <span className="text-primary">INTL</span></h1>
          <p className="text-sm text-muted-foreground mt-2 font-mono">SECURE FLIGHT DECK LOGIN</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input 
            id="email"
            label="Email Address" 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={error ? "border-destructive" : ""}
          />
          <Input 
            id="password"
            label="Password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={error ? "border-destructive" : ""}
          />

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm font-mono bg-destructive/10 p-3 rounded">
              <AlertCircle size={16} />
              INVALID CREDENTIALS
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input type="checkbox" className="rounded border-border bg-card text-primary focus:ring-primary" />
              Remember me
            </label>
            <a href="#" className="text-sm text-accent hover:underline">Forgot Password?</a>
          </div>

          <Button type="submit" className="w-full mt-6" size="lg" disabled={isLoading}>
            {isLoading ? "AUTHENTICATING..." : "ENGAGE & SIGN IN"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border/50 text-center font-mono text-xs text-muted-foreground space-y-2">
          <p>Demo Student: student@zainco.pk / pilot123</p>
          <p>Demo Admin: admin@zainco.pk / admin123</p>
        </div>
      </motion.div>

      <Link href="/">
        <div className="mt-5 w-full max-w-md flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer relative z-10 font-mono px-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 5l-7 7 7 7"/></svg>
          Back to Program Details
        </div>
      </Link>
    </div>
  );
}
