import { useRoute, Link, useLocation } from "wouter";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, HelpCircle, FileText, Lock, PlayCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import SecureVideoPlayer from "@/components/video/SecureVideoPlayer";
import { Button } from "@/components/shared/Button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  locked: boolean;
  content?: string;
  video_url?: string;
}

interface CourseDetailResponse {
  id: string;
  title: string;
  category: string;
  lessons_list: Lesson[];
}

export default function Lesson() {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute("/courses/:id/lesson/:lessonId");
  const { user } = useAuth();
  
  // Fetch course for sidebar context
  const { data: course, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course-detail', params?.id],
    queryFn: () => customFetch<CourseDetailResponse>(`/api/courses/${params?.id}`),
    enabled: !!params?.id
  });

  // Fetch lesson details
  const { data: lesson, isLoading: isLessonLoading } = useQuery({
    queryKey: ['lesson-detail', params?.lessonId],
    queryFn: () => customFetch<Lesson>(`/api/courses/${params?.id}/lessons/${params?.lessonId}`),
    enabled: !!params?.lessonId && !!params?.id
  });

  // Fetch full curriculum for context
  const { data: curriculum } = useQuery({
    queryKey: ['student-curriculum', params?.id],
    queryFn: () => customFetch<any[]>(`/api/courses/${params?.id}/curriculum`),
    enabled: !!params?.id,
  });

  // Video token mutation
  const { mutateAsync: getToken } = useMutation<{ signed_url: string, expires_at: string }, Error, void>({
    mutationFn: () => customFetch<{ signed_url: string, expires_at: string }>(`/api/video/token`, {
      method: 'POST',
      body: JSON.stringify({ lesson_id: params?.lessonId })
    })
  });

  // Progress mutation
  const { mutateAsync: saveProgress } = useMutation({
    mutationFn: (data: { lesson_id: string; watch_percent: number; current_position: number; completed: boolean }) => 
      customFetch(`/api/video/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
  });

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [watchPercent, setWatchPercent] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (lesson?.id) {
      // Get token on mount or lesson change
      getToken().then((data) => {
        setVideoUrl(data.signed_url);
      }).catch(err => {
        console.error("Failed to fetch video token", err);
      });
    }
  }, [lesson?.id, getToken]);

  const currentIndex = curriculum?.findIndex((item: any) => item.type === 'lesson' && item.lesson_id === params?.lessonId) ?? -1;
  const nextItem = currentIndex >= 0 && curriculum && currentIndex < curriculum.length - 1
    ? curriculum[currentIndex + 1]
    : null;

  if (isCourseLoading || isLessonLoading) return <div className="text-center mt-20 font-mono text-muted-foreground animate-pulse">LOADING LESSON DATA...</div>;
  if (!course || !lesson) return <div className="text-center mt-20">Lesson Not Found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-card border-b border-border flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={user?.role === 'admin' ? `/admin/courses/${course.id}` : `/courses/${course.id}`}>
            <div className="p-2 hover:bg-white/5 rounded cursor-pointer text-muted-foreground hover:text-foreground">
              <ChevronLeft size={20} />
            </div>
          </Link>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm font-mono text-muted-foreground uppercase hidden sm:inline">{course.category}</span>
          <span className="text-sm font-mono text-muted-foreground hidden sm:inline">/</span>
          <h1 className="font-display font-bold text-lg">{lesson.title}</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
        {/* Main Content (Video) */}
        <div className="flex-1 flex flex-col relative lg:overflow-y-auto">
            {/* Secure Video Player */}
            <SecureVideoPlayer
              src={videoUrl || ''}
              lessonId={params?.lessonId || ''}
              lessonTitle={lesson.title}
              courseThumbnail={undefined}
              onComplete={async () => {
                if (params?.lessonId) {
                  await saveProgress({
                    lesson_id: params.lessonId,
                    watch_percent: 100,
                    current_position: Math.floor(videoRef.current?.currentTime || 0),
                    completed: true,
                  });
                }
              }}
              onProgressUpdate={(pct) => setWatchPercent(pct)}
              nextLesson={
                nextItem?.type === 'lesson'
                  ? { id: nextItem.lesson_id, title: nextItem.title }
                  : undefined
              }
            />

          <div className="p-4 md:p-8 max-w-4xl">
            <h2 className="text-2xl font-display font-bold mb-6">Instructor Notes</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground font-sans leading-relaxed whitespace-pre-wrap">
              {lesson.content || "No instructor notes available for this lesson."}
            </div>

            <div className="mt-12 flex justify-between border-t border-border pt-6">
              <Link href={user?.role === 'admin' ? `/admin/courses/${course.id}` : `/courses/${course.id}`}>
                <Button variant="ghost" className="gap-2"><ArrowLeft size={16} /> Back to Course</Button>
              </Link>
              
              {nextItem ? (
                <div className="relative group/btn">
                  <Button className="gap-2" disabled={watchPercent < 90} onClick={async () => {
                    try {
                      await saveProgress({
                          lesson_id: params?.lessonId || "",
                          watch_percent: 100,
                          current_position: 0,
                          completed: true
                      });
                    } catch (e) {
                      console.error("Failed to save progress", e);
                    }
                    
                    if (nextItem.type === 'lesson') {
                      setLocation(`/courses/${course.id}/lesson/${nextItem.lesson_id}`);
                    } else if (nextItem.type === 'quiz') {
                      setLocation(`/courses/${course.id}/quiz/${nextItem.quiz_id}`);
                    } else if (nextItem.type === 'slides') {
                      setLocation(`/courses/${course.id}/slides/${nextItem.id}`);
                    }
                  }}>Complete & Continue <ArrowRight size={16} /></Button>
                  {watchPercent < 90 && (
                    <span className="absolute -top-8 right-0 bg-black/80 text-xs text-muted-foreground px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity">
                      Watch at least 90% to unlock
                    </span>
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Lesson List */}
        <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-64px)]">
          <div className="p-4 border-b border-border font-display font-bold">Curriculum</div>
          <div className="flex-1 overflow-y-auto">
            {curriculum?.map((item: any) => {
              const isCurrent = item.type === 'lesson' && item.lesson_id === params?.lessonId;
              const link = item.type === 'lesson' ? `/courses/${course.id}/lesson/${item.lesson_id}` : 
                          item.type === 'quiz' ? `/courses/${course.id}/quiz/${item.quiz_id}` :
                          item.type === 'slides' ? `/courses/${course.id}/slides/${item.id}` : null;
              
              const inner = (
                <div
                  className={`p-4 border-b border-border/50 flex gap-4 transition-colors
                    ${isCurrent ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-white/5 border-l-4 border-l-transparent'}
                    ${item.is_locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="mt-1">
                    {item.completed ? (
                      <CheckCircle2 size={18} className="text-primary" />
                    ) : item.is_locked ? (
                      <Lock size={18} className="text-muted-foreground" />
                    ) : item.type === 'lesson' ? (
                      <PlayCircle size={18} className="text-accent" />
                    ) : item.type === 'quiz' ? (
                      <HelpCircle size={18} className="text-green-400" />
                    ) : (
                      <FileText size={18} className="text-accent" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium text-sm leading-tight mb-1 ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{item.title}</p>
                    <div className="flex items-center gap-2">
                       <p className="text-xs font-mono text-muted-foreground uppercase">{item.type}</p>
                       {item.type === 'quiz' && item.completed && (
                         <span className={`text-[9px] font-mono px-1 py-0.5 rounded border ${
                           item.quiz_status === 'graded' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                         }`}>
                           {item.quiz_status === 'graded' ? `${item.quiz_score ?? 0}` : 'REVIEW'}
                         </span>
                       )}
                    </div>
                  </div>
                </div>
              );
              
              if (item.is_locked || !link) {
                return <div key={item.id}>{inner}</div>;
              }
              return (
                <Link key={item.id} href={link}>
                  {inner}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
