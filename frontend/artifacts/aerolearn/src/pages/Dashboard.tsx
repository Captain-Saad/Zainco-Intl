import { motion } from "framer-motion";
import { PlayCircle, Award, Clock, BookOpen, Video, FileText, LogIn } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/shared/Button";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Link } from "wouter";

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
  weekly_stats: { day: string; minutes: number }[];
  achievements: Achievement[];
  streak_days: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  created_at: string;
  metadata: any | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: progressData, isLoading: isProgressLoading } = useQuery({
    queryKey: ['progress-summary'],
    queryFn: () => customFetch<ProgressSummary>('/api/progress')
  });

  const { data: flightLog, isLoading: isLogLoading } = useQuery({
    queryKey: ['activities-log'],
    queryFn: () => customFetch<ActivityItem[]>('/api/activities?limit=5')
  });

  const inProgressCourses = progressData?.courses.filter((c: any) => c.progress > 0 && c.progress < 100) || [];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  if (isProgressLoading || isLogLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 px-4 pt-16 flex items-center justify-center">
          <p className="text-muted-foreground font-mono animate-pulse">SYNCING FLIGHT DATA...</p>
        </main>
      </div>
    );
  }

  const getIconForActivity = (type: string) => {
    switch (type) {
      case 'video_watched': return <Video size={16} className="text-accent" />;
      case 'quiz': return <FileText size={16} className="text-emerald-400" />;
      case 'login': return <LogIn size={16} className="text-muted-foreground" />;
      case 'achievement': return <Award size={16} className="text-primary" />;
      default: return <BookOpen size={16} />;
    }
  };

  // Compute stats from available array data
  const totalCourses = progressData?.courses?.length || 0;
  const totalLessonsDone = progressData?.courses?.reduce((acc, curr) => acc + curr.lessons_done, 0) || 0;
  const totalAchievements = progressData?.achievements?.length || 0;
  // Estimate hours from weekly stats if actual tracking is omitted from root
  const totalWeeklyMinutes = progressData?.weekly_stats?.reduce((acc, curr) => acc + curr.minutes, 0) || 0;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-7xl w-full">
        <header className="mb-8 md:mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
              Welcome back, <span className="text-primary">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-accent font-mono mt-2 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
              SYSTEMS ONLINE • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
            </p>
          </div>
        </header>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10"
        >
          <StatCard title="Courses Enrolled" value={totalCourses} icon={BookOpen} />
          <StatCard title="Weekly Hours" value={(totalWeeklyMinutes / 60).toFixed(1)} icon={Clock} />
          <StatCard title="Lessons Done" value={totalLessonsDone} icon={PlayCircle} />
          <StatCard title="Certificates" value={totalAchievements} icon={Award} />
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 md:gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Continue Learning */}
            <section>
              <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary rounded" />
                Continue Learning
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {inProgressCourses.slice(0,2).map((course: any) => (
                  <div key={course.course_id} className="glass-card rounded-xl p-5 border border-border hover:border-primary/50 transition-colors">
                    <div className="h-32 bg-secondary rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
                      <span className="font-display text-2xl font-bold text-white/20">MODULE</span>
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2 truncate">{course.title}</h3>
                    <div className="flex justify-between text-sm mb-2 font-mono">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="text-accent">{course.progress}%</span>
                    </div>
                    <div className="flex justify-end text-xs mb-2 font-mono text-muted-foreground">
                      {course.lessons_done} / {course.total_lessons} LESSONS
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full mb-6 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${course.progress}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-primary" 
                      />
                    </div>
                    <Link href={`/courses/${course.course_id}`}>
                      <Button className="w-full">Resume Training</Button>
                    </Link>
                  </div>
                ))}
                {inProgressCourses.length === 0 && (
                  <div className="col-span-2 text-center p-8 border border-dashed rounded-xl border-border">
                     <p className="text-muted-foreground font-mono text-sm">No active courses. Head to the catalog to begin.</p>
                  </div>
                )}
              </div>
            </section>

            {/* Chart */}
            <section>
              <h2 className="text-2xl font-display font-semibold mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-accent rounded" />
                Weekly Study Log (Minutes)
              </h2>
              <div className="glass-card p-6 rounded-xl h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData?.weekly_stats || []}>
                    <defs>
                      <linearGradient id="colorMin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="minutes" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorMin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="space-y-10">
            {/* Overall Progress */}
            <section className="glass-card p-6 rounded-xl flex flex-col items-center">
              <h3 className="font-display font-semibold mb-6 w-full text-left">Overall Completion</h3>
              <ProgressRing progress={progressData?.overall_percent || 0} size={160} strokeWidth={12}>
                <span className="text-4xl font-mono text-glow-blue text-accent">{progressData?.overall_percent || 0}%</span>
                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Cleared</span>
              </ProgressRing>
              <p className="text-center text-sm text-muted-foreground mt-6 px-4">
                You have {progressData?.streak_days || 0} days streak running! Keep it up.
              </p>
            </section>

            {/* Activity Feed */}
            <section>
              <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-3">
                <div className="w-1 h-5 bg-border rounded" />
                Flight Log
              </h2>
              <div className="glass-card rounded-xl p-6">
                <div className="space-y-3">
                  {flightLog?.slice(0,5).map((act: ActivityItem) => (
                    <div key={act.id} className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-background/40 hover:bg-card/60 transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full border border-border bg-secondary text-slate-400 shadow shrink-0 mt-0.5">
                        {getIconForActivity(act.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-foreground leading-snug">{act.description}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-0.5">{new Date(act.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  {(!flightLog || flightLog.length === 0) && (
                     <p className="text-muted-foreground font-mono text-sm">No recent logs recorded.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
