import { useState } from "react";
import { useRoute } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
}

interface CourseDetailResponse {
  id: string;
  title: string;
  description: string;
  total_lessons: number;
  duration: string | null;
  progress: number;
  category: string;
  status: 'not-started' | 'in-progress' | 'completed';
  students_enrolled: number;
  instructor: string | null;
  lessons_list: Lesson[];
  learning_outcomes: string[];
}
import { CheckCircle2, PlayCircle, Lock, Clock, Users, ChevronDown, FileText, HelpCircle } from "lucide-react";
import { Button } from "@/components/shared/Button";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export default function CourseDetail() {
  const [, params] = useRoute("/courses/:id");
  const { data: course, isLoading } = useQuery({
    queryKey: ['course-detail', params?.id],
    queryFn: () => customFetch<CourseDetailResponse>(`/api/courses/${params?.id}`),
    enabled: !!params?.id
  });
  const [expandedSection, setExpandedSection] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 px-4 pt-20 flex items-center justify-center">
          <p className="text-muted-foreground font-mono animate-pulse">LOADING COURSE DATA...</p>
        </main>
      </div>
    );
  }

  if (!course) return <div className="min-h-screen bg-background flex items-center justify-center font-display text-muted-foreground">Course Not Found</div>;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 pb-20 pt-14 md:pt-0">
        {/* Hero Banner */}
        <div className="h-[220px] md:h-[300px] relative border-b border-border flex items-end">
          <div className="absolute inset-0 bg-secondary">
             {/* Unsplash Cockpit Texture */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1200')] bg-cover bg-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          </div>
          <div className="max-w-7xl mx-auto px-6 md:px-10 w-full relative z-10 pb-10">
            <div className="inline-block px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded text-xs font-mono mb-4 tracking-widest">
              {course.category} MODULE
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{course.title}</h1>
            <div className="flex gap-6 font-mono text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><Clock size={16}/> {course.duration || '—'}</span>
              <span className="flex items-center gap-2"><Users size={16}/> {course.students_enrolled} Enrolled</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 mt-10 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="text-2xl font-display font-semibold mb-4">About This Course</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">{course.description}</p>
            </section>

            {course.learning_outcomes && course.learning_outcomes.length > 0 && (
              <section>
                <h2 className="text-2xl font-display font-semibold mb-4">What You'll Learn</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {course.learning_outcomes.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 glass-card p-4 rounded-lg">
                      <CheckCircle2 size={20} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <CurriculumSection courseId={course.id} totalLessons={course.total_lessons} />
          </div>

          <div className="space-y-6">
            <div className="sticky top-24 glass-card p-8 rounded-2xl border-t-4 border-t-primary text-center">
              <ProgressRing progress={course.progress} size={180} strokeWidth={14}>
                <span className="text-5xl font-mono text-glow-blue text-accent mb-1">{course.progress}%</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">Completed</span>
              </ProgressRing>
              
              <div className="mt-8 mb-6 space-y-4 text-left">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Instructor</span>
                  <span className="font-semibold">{course.instructor || 'Zainco Intl'}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Total Lessons</span>
                  <span className="font-semibold">{course.total_lessons}</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-muted-foreground">Est. Duration</span>
                  <span className="font-semibold">{course.duration || '—'}</span>
                </div>
              </div>

              <Button size="lg" className="w-full">
                {course.progress === 0 ? "START MODULE" : "CONTINUE TRAINING"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Curriculum Section (fetches from curriculum API) ---
interface CurriculumItem {
  id: string;
  title: string;
  type: string;
  order_index: number;
  is_locked: boolean;
  lesson_id?: string;
  quiz_id?: string;
  slides_url?: string;
  completed: boolean;
  quiz_score: number | null;
  quiz_status: string | null;
}

function CurriculumSection({ courseId, totalLessons }: { courseId: string; totalLessons: number }) {
  const [expanded, setExpanded] = useState(true);
  const { data: items } = useQuery({
    queryKey: ['student-curriculum', courseId],
    queryFn: () => customFetch<CurriculumItem[]>(`/api/courses/${courseId}/curriculum`),
    enabled: !!courseId,
  });

  const getIcon = (item: CurriculumItem) => {
    if (item.completed) return <CheckCircle2 size={20} className="text-primary" />;
    if (item.is_locked) return <Lock size={20} className="text-muted-foreground" />;
    if (item.type === 'lesson') return <PlayCircle size={20} className="text-accent" />;
    if (item.type === 'quiz') return <HelpCircle size={20} className="text-green-400" />;
    if (item.type === 'slides') return <FileText size={20} className="text-accent" />;
    return <PlayCircle size={20} className="text-accent" />;
  };

  const getLink = (item: CurriculumItem) => {
    if (item.type === 'lesson' && item.lesson_id) return `/courses/${courseId}/lesson/${item.lesson_id}`;
    if (item.type === 'quiz' && item.quiz_id) return `/courses/${courseId}/quiz/${item.quiz_id}`;
    if (item.type === 'slides') return `/courses/${courseId}/slides/${item.id}`;
    return null;
  };

  const getLabel = (item: CurriculumItem) => {
    if (item.type === 'lesson') return 'VIDEO';
    if (item.type === 'quiz') return 'QUIZ';
    if (item.type === 'slides') return 'SLIDES';
    return item.type.toUpperCase();
  };

  return (
    <section>
      <h2 className="text-2xl font-display font-semibold mb-6">Curriculum</h2>
      <div className="glass-card rounded-xl border border-border overflow-hidden">
        <div
          className="p-5 flex justify-between items-center cursor-pointer bg-secondary/50 hover:bg-secondary transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div>
            <h3 className="font-display font-semibold text-lg">Course Modules</h3>
            <p className="text-xs font-mono text-muted-foreground mt-1">{items?.length || totalLessons} Items</p>
          </div>
          <ChevronDown className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
              <div className="divide-y divide-border/50">
                {items?.map((item, i) => {
                  const link = getLink(item);
                  return (
                    <div key={item.id} className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${item.is_locked ? 'opacity-50' : ''}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-muted-foreground font-mono text-xs w-6">{String(i + 1).padStart(2, '0')}</div>
                        {getIcon(item)}
                        <div>
                          <span className={`font-medium ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {item.title}
                          </span>
                          <span className={`ml-2 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                            item.type === 'quiz' ? 'border-green-500/30 text-green-400' :
                            item.type === 'slides' ? 'border-accent/30 text-accent' :
                            'border-primary/30 text-primary'
                          }`}>{getLabel(item)}</span>
                          
                          {item.type === 'quiz' && item.completed && (
                            <span className={`ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                              item.quiz_status === 'graded' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                            }`}>
                              {item.quiz_status === 'graded' ? `SCORE: ${item.quiz_score ?? 0}` : 'PENDING REVIEW'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {item.completed && link ? (
                          <Link href={link}>
                            <Button size="sm" variant="ghost">Review</Button>
                          </Link>
                        ) : !item.is_locked && link ? (
                          <Link href={link}>
                            <Button size="sm" variant="secondary">Start</Button>
                          </Link>
                        ) : item.is_locked ? (
                          <Button size="sm" variant="ghost" disabled>Locked</Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
