import { Sidebar } from "@/components/layout/Sidebar";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { motion } from "framer-motion";
import { Flame, Lock, PlaneTakeoff, Award, Shield, Target, Trophy, Star, Compass } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

interface CourseProgress {
  course_id: string;
  title: string;
  progress: number;
  lessons_done: number;
  total_lessons: number;
}

interface Achievement {
  badge_key: string;
  earned_at: string;
}

interface ProgressSummary {
  overall_percent: number;
  courses: CourseProgress[];
  weekly_stats: any[];
  achievements: Achievement[];
  streak_days: number;
}

// Map course title keywords to aviation badge metadata
const COURSE_BADGE_MAP: Record<string, { icon: React.ReactNode; suffix: string }> = {
  mcc: { icon: <Shield size={24} />, suffix: "Crew Ready" },
  joc: { icon: <Compass size={24} />, suffix: "Jet Qualified" },
  type: { icon: <PlaneTakeoff size={24} />, suffix: "Type Rated" },
  sim: { icon: <Target size={24} />, suffix: "Sim Proficient" },
};

function getBadgeForCourse(title: string) {
  const lower = title.toLowerCase();
  for (const [key, value] of Object.entries(COURSE_BADGE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return { icon: <Award size={24} />, suffix: "Certified" };
}

// Milestone badges (not tied to a specific course)
const MILESTONE_BADGES = [
  { id: "first_flight", icon: <PlaneTakeoff size={24} />, title: "First Flight", description: "Completed your first lesson." },
  { id: "all_courses", icon: <Trophy size={24} />, title: "Full Wings", description: "Completed every enrolled course." },
  { id: "perfect_quiz", icon: <Star size={24} />, title: "Aced It", description: "Scored 100% on any quiz." },
  { id: "streak_7", icon: <Flame size={24} />, title: "7-Day Streak", description: "Trained 7 days in a row." },
];

export default function Progress() {
  const { data: progressData, isLoading } = useQuery({
    queryKey: ['student-progress'],
    queryFn: () => customFetch<ProgressSummary>('/api/progress')
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 px-4 pt-20 flex items-center justify-center">
          <p className="text-muted-foreground font-mono animate-pulse">LOADING TRAINING DATA...</p>
        </main>
      </div>
    );
  }

  const earnedBadgeKeys = progressData?.achievements?.map(a => a.badge_key) || [];
  const courses = progressData?.courses || [];

  // Build course-completion badges dynamically from enrolled courses
  const courseBadges = courses.map((c) => {
    const meta = getBadgeForCourse(c.title);
    const completed = c.progress >= 100;
    return {
      id: `course_${c.course_id}`,
      icon: meta.icon,
      title: meta.suffix,
      description: `Completed ${c.title}.`,
      unlocked: completed,
    };
  });

  // Build milestone badges from achievements + computed state
  const hasAnyLesson = courses.some(c => c.lessons_done > 0);
  const allComplete = courses.length > 0 && courses.every(c => c.progress >= 100);
  const streak7 = (progressData?.streak_days || 0) >= 7;

  const milestoneBadges = MILESTONE_BADGES.map((b) => {
    let unlocked = earnedBadgeKeys.includes(b.id);
    // Compute unlocked state from data if not stored as achievement
    if (b.id === "first_flight" && hasAnyLesson) unlocked = true;
    if (b.id === "all_courses" && allComplete) unlocked = true;
    if (b.id === "streak_7" && streak7) unlocked = true;
    return { ...b, unlocked };
  });

  const allBadges = [...courseBadges, ...milestoneBadges];

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-7xl w-full">
        <header className="mb-8 md:mb-10">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">TRAINING RECORD</h1>
        </header>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-10">
          <div className="glass-card p-8 rounded-2xl flex flex-col items-center justify-center border-t-4 border-t-primary">
            <ProgressRing progress={progressData?.overall_percent || 0} size={200} strokeWidth={16}>
              <span className="text-5xl font-mono text-glow-blue text-accent mb-2">{progressData?.overall_percent || 0}%</span>
              <span className="text-xs font-mono text-muted-foreground uppercase">Overall Journey</span>
            </ProgressRing>
          </div>

          <div className="glass-card p-8 rounded-2xl border border-border lg:col-span-2 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <Flame size={200} />
            </div>
            <h3 className="font-display text-xl text-muted-foreground mb-2">Current Streak</h3>
            <div className="text-6xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-4 flex items-center gap-4">
              <Flame size={48} className="text-orange-500" />
              {progressData?.streak_days || 0} DAYS
            </div>
            <p className="text-sm text-muted-foreground max-w-md">Consistent training is key to muscle memory. Keep up the momentum to master the flows.</p>
          </div>
        </div>

        <section className="mb-10">
          <h2 className="text-2xl font-display font-semibold mb-6 border-b border-border pb-4">Module Breakdown</h2>
          <div className="space-y-6">
            {!courses.length ? (
              <p className="text-muted-foreground font-mono">No enrollments yet.</p>
            ) : (
              courses.map((course, i) => (
                <motion.div 
                  key={course.course_id}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: "100%", opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-card p-5 rounded-xl border border-border"
                >
                  <div className="flex justify-between items-center gap-4 mb-1">
                    <span className="font-display font-bold truncate min-w-0">{course.title}</span>
                    <span className="font-mono text-accent shrink-0">{course.progress}%</span>
                  </div>
                  <p className="text-xs font-mono text-muted-foreground mb-3">
                    {course.lessons_done} / {course.total_lessons} lessons completed
                  </p>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 + (i*0.1) }}
                      className={`h-full ${course.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-display font-semibold mb-6 border-b border-border pb-4">Aviation Badges</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {allBadges.map((ach) => (
              <div 
                key={ach.id} 
                className={`glass-card p-6 rounded-xl border flex flex-col items-center text-center transition-all
                  ${ach.unlocked ? 'border-primary/50 shadow-[0_0_15px_rgba(201,168,76,0.1)]' : 'border-border/50 opacity-60 grayscale'}
                `}
              >
                <div className={`w-16 h-16 rounded-full mb-4 flex items-center justify-center relative
                  ${ach.unlocked ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}
                `}>
                  {!ach.unlocked && <Lock size={16} className="absolute -top-1 -right-1 text-muted-foreground" />}
                  {ach.icon}
                </div>
                <h4 className={`font-bold mb-1 ${ach.unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>{ach.title}</h4>
                <p className="text-xs text-muted-foreground">{ach.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
