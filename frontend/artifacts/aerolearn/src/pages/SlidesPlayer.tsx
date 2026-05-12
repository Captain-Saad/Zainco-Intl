import { useRoute, Link } from "wouter";
import { ChevronLeft, FileText, CheckCircle2, Lock, PlayCircle, HelpCircle, Download, Maximize2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

export default function SlidesPlayer() {
  const [, params] = useRoute("/courses/:courseId/slides/:itemId");
  const { user } = useAuth();
  const [isFullScreen, setIsFullScreen] = useState(false);
  
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
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      {/* Top Bar - stacked on mobile */}
      <header className="bg-card border-b border-border shrink-0 px-3 md:px-6 py-2 md:py-0 md:h-16 md:flex md:items-center md:justify-between">
        <div className="flex items-center gap-2 md:gap-4 min-w-0 mb-2 md:mb-0">
          <Link href={`/courses/${params?.courseId}`}>
            <div className="p-1.5 md:p-2 hover:bg-white/5 rounded cursor-pointer text-muted-foreground hover:text-foreground shrink-0">
              <ChevronLeft size={18} />
            </div>
          </Link>
          <h1 className="font-display font-bold text-sm md:text-lg truncate min-w-0">{currentItem.title}</h1>
          <span className="px-1.5 py-0.5 rounded border border-accent/30 text-accent text-[9px] md:text-[10px] uppercase tracking-widest font-mono shrink-0">Slides</span>
        </div>
        <div className="flex gap-2 pl-8 md:pl-0">
          {currentItem.slides_url && (
            <a href={currentItem.slides_url} download target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8 px-2 md:px-3">
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </Button>
            </a>
          )}
          {nextItem && isCompleted && (
            <Button onClick={handleContinue} size="sm" className="gap-1.5 text-xs h-8">
               Continue <CheckCircle2 size={14} />
            </Button>
          )}
          {!isCompleted && (
             <Button onClick={() => completeSlides()} variant="secondary" size="sm" className="gap-1.5 text-xs h-8 px-2 md:px-3">
                <CheckCircle2 size={14} /> <span className="hidden sm:inline">Mark as</span> Complete
             </Button>
          )}
        </div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-auto lg:overflow-hidden">
        {/* Main Content (Slides Viewer) */}
        <div className={`flex-none lg:flex-1 flex flex-col bg-secondary/20 p-2 md:p-8 relative lg:overflow-y-auto items-center justify-center ${
          isFullScreen ? 'fixed inset-0 z-[100] bg-black p-0 md:p-0' : ''
        }`}>
          <div className={`w-full max-w-5xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${
            isFullScreen ? 'max-w-none h-full rounded-none border-0' : 'aspect-[4/3] rounded-xl md:rounded-2xl'
          }`}>
            <div className="absolute top-2 right-2 md:top-4 md:right-4 z-[110] flex gap-2">
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="bg-black/40 hover:bg-black/60 backdrop-blur-md border-white/10 w-8 h-8 md:w-10 md:h-10"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                >
                    <Maximize2 size={16} className={isFullScreen ? 'rotate-180' : ''} />
                </Button>
            </div>
            {currentItem.slides_url ? (
              <iframe 
                src={(() => {
                  const fullUrl = currentItem.slides_url.startsWith('http') 
                    ? currentItem.slides_url 
                    : `https://cnkqsinhqbzpkejucygz.supabase.co/storage/v1/object/public/slides/${currentItem.slides_url}`;
                  
                  return fullUrl.toLowerCase().split('?')[0].endsWith('.pdf')
                    ? fullUrl
                    : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fullUrl)}`;
                })()}
                className="w-full h-full border-none"
                title="Slides Viewer"
              />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                    <FileText size={64} className="text-muted-foreground opacity-20" />
                    <p className="text-muted-foreground font-mono">NO SLIDES FILE ATTACHED</p>
                </div>
            )}
          </div>
          
          <div className="mt-4 md:mt-8 p-4 md:p-6 glass-card rounded-xl border border-border max-w-5xl w-full">
            <h3 className="font-display font-bold text-base md:text-lg mb-2">Instructor Notes</h3>
            <p className="text-muted-foreground leading-relaxed text-sm">
                Review these slides thoroughly before proceeding to the next quiz. You can download the full PDF version from the Resources tab if available.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col flex-none lg:h-[calc(100vh-64px)]">
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
