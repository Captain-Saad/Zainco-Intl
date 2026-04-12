import { motion } from "framer-motion";
import { LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <motion.div 
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      whileHover={{ y: -4 }}
      className={cn(
        "glass-card rounded-xl p-5 border-t-2 border-t-primary hud-brackets",
        className
      )}
    >
      <div className="flex justify-between items-start">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <Icon size={20} />
        </div>
        {trend && (
          <div className="flex items-center text-xs text-emerald-400 font-mono">
            <TrendingUp size={14} className="mr-1" />
            {trend}
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-mono font-semibold text-foreground text-glow-blue">{value}</h3>
        <p className="text-sm text-muted-foreground mt-1 font-sans">{title}</p>
      </div>
    </motion.div>
  );
}
