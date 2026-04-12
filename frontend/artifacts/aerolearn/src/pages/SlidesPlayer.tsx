import { useRoute, Link } from "wouter";
import { ChevronLeft, FileText, CheckCircle2, Lock, PlayCircle, HelpCircle, Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export default function SlidesPlayer() {
  const [, params] = useRoute("/courses/:courseId/slides/:itemId");
  const { user } = useAuth();
  
  // Fetch curriculum for sidebar and current item
  const { data: curriculum, isLoading: isCurriculumLoading } = useQuery({
    queryKey: ['student-curriculum', params?.courseId],
    queryFn: () => customFetch<any[]>(`/api/courses/${params?.courseId}/curriculum`),
    enabled: !!params?.courseId,
  });

  const currentItem = curriculum?.find(item => item.id === params?.itemId);
  const currentIndex = curriculum?.findIndex(item => item.id === params?.itemId) ?? -1;
  const nextItem = currentIndex >= 0 && curriculum && currentIndex < curriculum.length - 1
    ? curriculum[currentIndex + 1]
    : null;

  const { mutate: completeSlides, isSuccess: isCompleted } = useMutation({
    mutationFn: () => customFetch(`/api/courses/${params?.courseId}/curriculum/${params?.itemId}/complete`, {
      method: 'POST'
    }),
  });

  const handleContinue = () => {
    if (!nextItem) return;
    if (nextItem.type === 'lesson') {
      window.location.href = `/courses/${params?.courseId}/lesson/${nextItem.lesson_id}`;
    } else if (nextItem.type === 'quiz') {
       window.location.href = `/courses/${params?.courseId}/quiz/${nextItem.quiz_id}`;
    } else if (nextItem.type === 'slides') {
       window.location.href = `/courses/${params?.courseId}/slides/${nextItem.id}`;
    }
  };

  if (isCurriculumLoading) return <div className="text-center mt-20 font-mono text-muted-foreground animate-pulse">LOADING SLIDES...</div>;
  if (!currentItem) return <div className="text-center mt-20">Slides Not Found</div>;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-card border-b border-border flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/courses/${params?.courseId}`}>
            <div className="p-2 hover:bg-white/5 rounded cursor-pointer text-muted-foreground hover:text-foreground">
              <ChevronLeft size={20} />
            </div>
          </Link>
          <div className="h-6 w-px bg-border" />
          <h1 className="font-display font-bold text-lg">{currentItem.title}</h1>
          <span className="ml-2 px-2 py-0.5 rounded border border-accent/30 text-accent text-[10px] uppercase tracking-widest font-mono">Slides</span>
        </div>
        <div className="flex gap-3">
          {nextItem && isCompleted && (
            <Button onClick={handleContinue} className="gap-2">
               Continue <CheckCircle2 size={16} />
            </Button>
          )}
          {!isCompleted && (
             <Button onClick={() => completeSlides()} variant="secondary" size="sm" className="gap-2">
                <CheckCircle2 size={16} /> Mark as Complete
             </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
        {/* Main Content (Slides Viewer) */}
        <div className="flex-1 flex flex-col bg-secondary/20 p-4 md:p-8 relative lg:overflow-y-auto items-center justify-center">
          <div className="w-full max-w-5xl aspect-[4/3] bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col">
            {currentItem.slides_url ? (
               <iframe 
               src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(currentItem.slides_url)}`}
               className="w-full h-full border-none"
               title="Slides Viewer"
             />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <FileText size={64} className="text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-mono">NO SLIDES FILE ATTACHED</p>
                    <Button variant="ghost" className="gap-2">
                        <Download size={16} /> Request File
                    </Button>
                </div>
            )}
          </div>
          
          <div className="mt-8 p-6 glass-card rounded-xl border border-border max-w-5xl w-full">
            <h3 className="font-display font-bold text-lg mb-2">Instructor Notes</h3>
            <p className="text-muted-foreground leading-relaxed">
                Review these slides thoroughly before proceeding to the next quiz. You can download the full PDF version from the Resources tab if available.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col max-h-[50vh] lg:max-h-none lg:h-[calc(100vh-64px)]">
          <div className="p-4 border-b border-border font-display font-bold">Curriculum</div>
          <div className="flex-1 overflow-y-auto">
            {curriculum?.map((item: any) => {
              const isCurrent = item.id === params?.itemId;
              const link = item.type === 'lesson' ? `/courses/${params?.courseId}/lesson/${item.lesson_id}` : 
                          item.type === 'quiz' ? `/courses/${params?.courseId}/quiz/${item.quiz_id}` :
                          item.type === 'slides' ? `/courses/${params?.courseId}/slides/${item.id}` : null;
              
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
                    <p className="text-xs font-mono text-muted-foreground uppercase">{item.type}</p>
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
