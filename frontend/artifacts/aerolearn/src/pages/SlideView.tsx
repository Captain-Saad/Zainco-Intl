import { useRoute, Link } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { ChevronLeft, Download, Maximize2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/shared/Button";

interface CurriculumItem {
  id: string;
  title: string;
  type: string;
  slides_url?: string;
  course_id: string;
}

export default function SlideView() {
  const [, params] = useRoute("/courses/:courseId/slides/:itemId");
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const { data: item, isLoading } = useQuery({
    queryKey: ['curriculum-item', params?.itemId],
    queryFn: () => customFetch<CurriculumItem>(`/api/admin/curriculum/${params?.itemId}`), // We can reuse the admin detail endpoint or a student one
    enabled: !!params?.itemId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!item || !item.slides_url) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 flex flex-col items-center justify-center gap-4">
          <FileText className="w-16 h-16 text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">Slides not found or not available.</p>
          <Link href={`/courses/${params?.courseId}`}>
            <Button variant="ghost">Back to Course</Button>
          </Link>
        </main>
      </div>
    );
  }

  const fullUrl = item.slides_url.startsWith('http') 
    ? item.slides_url 
    : `https://cnkqsinhqbzpkejucygz.supabase.co/storage/v1/object/public/slides/${item.slides_url}`;

  const isPdf = fullUrl.toLowerCase().split('?')[0].endsWith('.pdf');
  const viewerUrl = isPdf 
    ? fullUrl 
    : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fullUrl)}`;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex text-white">
      <Sidebar />
      <main className="flex-1 md:ml-64 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <Link href={`/courses/${params?.courseId}`}>
              <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-sm font-semibold tracking-wide uppercase text-accent">{item.title}</h1>
              <p className="text-[10px] text-muted-foreground font-mono">STUDY MATERIAL • MODULE {params?.itemId?.slice(0,4).toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a href={item.slides_url} download target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2 text-xs h-8 border border-white/10 hover:bg-white/5">
                <Download size={14} />
                Download
              </Button>
            </a>
          </div>
        </header>

        {/* Viewer Area */}
        <div className={`flex-1 relative bg-black flex items-center justify-center p-4 md:p-8 ${
            isFullScreen ? 'fixed inset-0 z-[100] p-0 md:p-0' : ''
        }`}>
          <div className={`w-full bg-card border border-white/10 shadow-2xl overflow-hidden relative group transition-all duration-300 ${
            isFullScreen ? 'max-w-none h-screen rounded-none border-0' : 'max-w-5xl h-full rounded-2xl'
          }`}>
            <div className="absolute top-4 right-4 z-[110] flex gap-2">
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className="bg-black/40 hover:bg-black/60 backdrop-blur-md border-white/10"
                    onClick={() => setIsFullScreen(!isFullScreen)}
                >
                    <Maximize2 size={18} className={isFullScreen ? 'rotate-180' : ''} />
                </Button>
            </div>
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title={item.title}
            />
            
            {/* Overlay indicators for premium feel */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono flex items-center gap-2">
                    <Maximize2 size={12} />
                    FULL SCREEN VIEW ACTIVE
                </div>
            </div>
          </div>
        </div>

        {/* Footer/Navigation (Optional for more modules) */}
        <footer className="h-12 bg-black/40 border-t border-white/5 flex items-center justify-center">
            <p className="text-[10px] font-mono text-muted-foreground tracking-widest uppercase">Zainco International • Pilot Training Academy</p>
        </footer>
      </main>
    </div>
  );
}
