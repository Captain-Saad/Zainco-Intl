import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Edit, Trash2, GripVertical, FileVideo, UploadCloud, Eye, BookOpen, ChevronDown, Plus, FileText, HelpCircle, ClipboardList } from "lucide-react";
import QuizBuilder from "@/components/admin/QuizBuilder";

interface CurriculumItemData {
  id: string;
  course_id: string;
  title: string;
  type: string;
  order_index: number;
  is_locked: boolean;
  lesson_id?: string;
  slides_url?: string;
  quiz_id?: string;
}

interface CourseData {
  id: string;
  title: string;
}

export default function AdminCourseDetail() {
  const [, params] = useRoute("/admin/courses/:id");
  const courseId = params?.id;
  
  const queryClient = useQueryClient();
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [modalType, setModalType] = useState<"video" | "slides" | "quiz" | null>(null);
  const [selectedItem, setSelectedItem] = useState<CurriculumItemData | null>(null);

  // Forms
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [slidesFile, setSlidesFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "", // Video only
    duration: "",    // Video only
    is_locked: false,
  });

  const { data: course, isLoading: loadingCourse } = useQuery({
    queryKey: ['admin-course-detail', courseId],
    queryFn: () => customFetch<CourseData>(`/api/courses/${courseId}`),
    enabled: !!courseId,
  });

  const { data: curriculumItems, isLoading: loadingCurriculum } = useQuery({
    queryKey: ['admin-course-curriculum', courseId],
    queryFn: () => customFetch<CurriculumItemData[]>(`/api/courses/${courseId}/curriculum`),
    enabled: !!courseId,
  });

  const createCurriculumMutation = useMutation({
    mutationFn: (payload: any) => 
      customFetch(`/api/admin/courses/${courseId}/curriculum`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-curriculum', courseId] });
      setModalType(null);
      // Wait to implement complex uploads (e.g. video files associated with a lesson) later if needed
    },
  });

  const updateCurriculumMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      customFetch(`/api/admin/curriculum/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-curriculum', courseId] });
      setModalType(null);
    },
  });

  const deleteCurriculumMutation = useMutation({
    mutationFn: (id: string) => 
      customFetch(`/api/admin/curriculum/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-course-curriculum', courseId] }),
  });

  // Example handling specifically for the Video "Lesson" legacy type creation -> then Curriculum Item creation.
  const createLegacyLessonMutation = useMutation({
    mutationFn: (newLesson: any) => 
      customFetch(`/api/courses/${courseId}/lessons`, { // Create lesson first
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLesson),
      }),
    onSuccess: (lessonData: any) => {
      // Then tie it to Curriculum
      createCurriculumMutation.mutate({
        title: formData.title,
        type: "lesson",
        order_index: (curriculumItems?.length || 0),
        is_locked: formData.is_locked,
        lesson_id: lessonData.id
      });
      if (videoFile && lessonData.id) {
        // uploadVideoMutation.mutate({ lessonId: lessonData.id, file: videoFile }); // implement if needed
      }
    }
  });

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    if (selectedItem) {
      updateCurriculumMutation.mutate({
        id: selectedItem.id,
        data: {
          title: formData.title,
          is_locked: formData.is_locked,
        }
      });
    } else {
      createLegacyLessonMutation.mutate({
        title: formData.title,
        description: formData.description,
        order_index: (curriculumItems?.length || 0),
        duration: formData.duration,
        is_locked: formData.is_locked,
      });
    }
  };

  const handleSlidesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    if (selectedItem) {
      updateCurriculumMutation.mutate({
        id: selectedItem.id,
        data: {
          title: formData.title,
          is_locked: formData.is_locked,
        }
      });
    } else {
      createCurriculumMutation.mutate({
        title: formData.title,
        type: "slides",
        order_index: curriculumItems?.length || 0,
        is_locked: formData.is_locked,
        slides_url: slidesFile ? slidesFile.name : null,
      });
    }
  };

  const openCreateModal = (type: "video" | "slides" | "quiz") => {
    setSelectedItem(null);
    setVideoFile(null);
    setFormData({
      title: "",
      description: "",
      duration: "",
      is_locked: false,
    });
    setModalType(type);
    setIsAddMenuOpen(false);
  };

  const openEditModal = (item: CurriculumItemData) => {
    setSelectedItem(item);
    setVideoFile(null);
    setFormData({
      title: item.title,
      description: "", // Fetched details for legacy lessons if needed
      duration: "",
      is_locked: item.is_locked,
    });
    setModalType(item.type === "lesson" ? "video" : item.type as "slides" | "quiz");
  };

  if (loadingCourse || loadingCurriculum) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 px-4 pt-16 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse font-mono">LOADING COURSE DETAILS...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-[1800px] w-full">
        <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h2 className="text-primary font-mono text-sm mb-2 uppercase">Course Builder</h2>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{course?.title}</h1>
          </div>
          <div className="relative">
            <Button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="self-start sm:self-auto gap-2">
              <Plus size={16} /> Add Module <ChevronDown size={14} />
            </Button>
            {isAddMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-20">
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-sm" onClick={() => openCreateModal("video")}>
                  <FileVideo size={16} className="text-primary" /> Video Lesson
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-sm" onClick={() => openCreateModal("slides")}>
                  <FileText size={16} className="text-accent" /> Slides
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-sm" onClick={() => openCreateModal("quiz")}>
                  <HelpCircle size={16} className="text-green-400" /> Quiz
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="glass-card rounded-2xl border border-border p-6 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-xl">Curriculum</h3>
            <span className="text-muted-foreground text-sm">{curriculumItems?.length || 0} Modules Context</span>
          </div>

          <div className="space-y-3">
            {!curriculumItems?.length ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-20" />
                <p className="text-muted-foreground">No curriculum items have been added to this course yet.</p>
              </div>
            ) : (
              curriculumItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 border border-border/50 hover:bg-secondary transition-colors group">
                  <div className="cursor-grab text-muted-foreground hover:text-foreground">
                    <GripVertical size={20} />
                  </div>
                  <div className="h-10 w-10 flex-shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-mono font-bold">
                    {index + 1}
                  </div>
                  
                  {item.type === 'lesson' && <FileVideo size={20} className="text-primary" />}
                  {item.type === 'slides' && <FileText size={20} className="text-accent" />}
                  {item.type === 'quiz' && <HelpCircle size={20} className="text-green-500" />}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{item.title}</h4>
                    <p className="text-xs text-muted-foreground truncate uppercase">{item.type} • {item.is_locked ? "Locked" : "Unlocked"}</p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {item.lesson_id && (
                      <Link href={`/courses/${courseId}/lesson/${item.lesson_id}`}>
                        <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Preview Lesson">
                          <Eye size={16} />
                        </Button>
                      </Link>
                    )}
                    {item.quiz_id && (
                      <>
                        <Link href={`/courses/${courseId}/quiz/${item.quiz_id}`}>
                          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Preview Quiz">
                            <Eye size={16} />
                          </Button>
                        </Link>
                        <Link href={`/admin/courses/${courseId}/quiz/${item.quiz_id}/submissions`}>
                          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-green-500 hover:bg-green-500/10 transition-colors" title="View Submissions">
                            <ClipboardList size={16} />
                          </Button>
                        </Link>
                      </>
                    )}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => openEditModal(item)}
                    >
                      <Edit size={16} />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="danger" 
                      onClick={() => {
                        if (window.confirm(`Delete module '${item.title}'?`)) {
                          deleteCurriculumMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <Modal isOpen={modalType === "video"} onClose={() => setModalType(null)} title={selectedItem ? "Edit Video Lesson" : "Add Video Lesson"}>
          <form className="space-y-4" onSubmit={handleVideoSubmit}>
            <Input 
              label="Lesson Title" 
              required 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
            
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground ml-1">Description (Optional)</label>
              <textarea 
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[80px] resize-none"
                placeholder="Lesson context..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <Input 
                label="Duration (e.g. 15m)" 
                value={formData.duration} 
                onChange={e => setFormData({...formData, duration: e.target.value})} 
              />
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm text-muted-foreground ml-1">Attach Video (Optional)</label>
              <input 
                type="file" 
                accept="video/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setVideoFile(file);
                }}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 focus:outline-none focus:border-primary"
              />
              {videoFile && <p className="text-xs text-primary ml-1">Selected: {videoFile.name}</p>}
              {selectedItem && selectedItem.type === 'lesson' && !videoFile && (
                <p className="text-xs text-muted-foreground ml-1">Leave empty to keep current video, or select a new one to overwrite.</p>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border mt-4">
              <div>
                <p className="font-medium">Lock Automatically</p>
                <p className="text-xs text-muted-foreground leading-tight mt-1">Require previous lesson completion to unlock.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.is_locked}
                  onChange={e => setFormData({...formData, is_locked: e.target.checked})}
                />
                <div className="w-11 h-6 bg-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
              </label>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={createCurriculumMutation.isPending || updateCurriculumMutation.isPending}>
              {selectedItem ? "Save Changes" : "Create Lesson"}
            </Button>
          </form>
        </Modal>

        {/* Slides Upload Modal */}
        <Modal isOpen={modalType === "slides"} onClose={() => setModalType(null)} title="Add Slides Module">
          <form className="space-y-4" onSubmit={handleSlidesSubmit}>
            <Input
              label="Slides Title"
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground ml-1">Upload PDF / PPTX</label>
              <input
                type="file"
                accept=".pdf,.pptx,.ppt"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setSlidesFile(file);
                }}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 focus:outline-none focus:border-accent"
              />
              {slidesFile && <p className="text-xs text-accent ml-1">Selected: {slidesFile.name}</p>}
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
              <div>
                <p className="font-medium">Lock Automatically</p>
                <p className="text-xs text-muted-foreground leading-tight mt-1">Require previous module completion to unlock.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.is_locked}
                  onChange={e => setFormData({...formData, is_locked: e.target.checked})}
                />
                <div className="w-11 h-6 bg-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
              </label>
            </div>

            <Button type="submit" className="w-full mt-4" disabled={createCurriculumMutation.isPending}>
              Create Slides Module
            </Button>
          </form>
        </Modal>

        {/* Quiz Builder Modal */}
        {courseId && (
          <QuizBuilder
            isOpen={modalType === "quiz"}
            onClose={() => setModalType(null)}
            courseId={courseId}
            onQuizCreated={(quizId: string, title: string) => {
              createCurriculumMutation.mutate({
                title: title,
                type: "quiz",
                order_index: curriculumItems?.length || 0,
                is_locked: false,
                quiz_id: quizId,
              });
            }}
          />
        )}
      </main>
    </div>
  );
}
