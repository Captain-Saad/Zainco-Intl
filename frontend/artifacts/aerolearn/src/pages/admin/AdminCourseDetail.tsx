import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Edit, Trash2, GripVertical, FileVideo, UploadCloud, Eye, BookOpen, ChevronDown, Plus, FileText, HelpCircle, ClipboardList, Loader2, ExternalLink, Upload, Maximize2 } from "lucide-react";
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

  // Track background uploads: { [lessonId: string]: { fileName: string, progress: number } }
  const [activeUploads, setActiveUploads] = useState<Record<string, { fileName: string, progress: number }>>({});
  const [viewingSlideUrl, setViewingSlideUrl] = useState<string | null>(null);
  const [isSlideFullScreen, setIsSlideFullScreen] = useState(false);
  
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

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
      // Modal will be closed by the specific handler once sub-tasks are done
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

  const uploadVideoMutation = useMutation({
    mutationFn: async ({ lessonId, file }: { lessonId: string; file: File }) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/admin/lessons/${lessonId}/video`);
        
        // Track this upload in our background state
        setActiveUploads(prev => ({
          ...prev,
          [lessonId]: { fileName: file.name, progress: 0 }
        }));

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setActiveUploads(prev => ({
              ...prev,
              [lessonId]: { ...prev[lessonId], progress: percent }
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setActiveUploads(prev => {
              const next = { ...prev };
              delete next[lessonId];
              return next;
            });
            resolve(JSON.parse(xhr.responseText));
          } else {
            setActiveUploads(prev => {
              const next = { ...prev };
              delete next[lessonId];
              return next;
            });
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => {
          setActiveUploads(prev => {
            const next = { ...prev };
            delete next[lessonId];
            return next;
          });
          reject(new Error('Upload failed'));
        };

        const token = localStorage.getItem('token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        const data = new FormData();
        data.append('file', file);
        xhr.send(data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-curriculum', courseId] });
    },
  });

  const uploadSlidesMutation = useMutation({
    mutationFn: async ({ itemId, file }: { itemId: string, file: File }) => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/api/admin/curriculum/${itemId}/slides`);
        
        // Track this upload in our background state
        setActiveUploads(prev => ({
          ...prev,
          [itemId]: { fileName: file.name, progress: 0 }
        }));

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setActiveUploads(prev => ({
              ...prev,
              [itemId]: { ...prev[itemId], progress: percent }
            }));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setActiveUploads(prev => {
              const next = { ...prev };
              delete next[itemId];
              return next;
            });
            resolve(JSON.parse(xhr.responseText));
          } else {
            setActiveUploads(prev => {
              const next = { ...prev };
              delete next[itemId];
              return next;
            });
            reject(new Error('Upload failed'));
          }
        };

        xhr.onerror = () => {
          setActiveUploads(prev => {
            const next = { ...prev };
            delete next[itemId];
            return next;
          });
          reject(new Error('Upload failed'));
        };

        const token = localStorage.getItem('token');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        const data = new FormData();
        data.append('file', file);
        xhr.send(data);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-curriculum', courseId] });
    },
  });

  // Example handling specifically for the Video "Lesson" legacy type creation -> then Curriculum Item creation.
  const createLegacyLessonMutation = useMutation({
    mutationFn: (newLesson: any) => 
      customFetch(`/api/courses/${courseId}/lessons`, { // Create lesson first
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLesson),
      }),
    onSuccess: async (lessonData: any) => {
      // Create Curriculum Item first (fast)
      await createCurriculumMutation.mutateAsync({
        title: formData.title,
        type: "lesson",
        order_index: (curriculumItems?.length || 0),
        is_locked: formData.is_locked,
        lesson_id: lessonData.id
      });
      
      // Start background upload but don't await it here if we want backgrounding
      if (videoFile && lessonData.id) {
        uploadVideoMutation.mutate({ lessonId: lessonData.id, file: videoFile });
      }
      
      setModalType(null);
    }
  });

  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;
    
    if (selectedItem) {
      await updateCurriculumMutation.mutateAsync({
        id: selectedItem.id,
        data: {
          title: formData.title,
          is_locked: formData.is_locked,
        }
      });
      
      if (videoFile && selectedItem.lesson_id) {
        // Start background upload but close modal immediately
        uploadVideoMutation.mutate({ lessonId: selectedItem.lesson_id, file: videoFile });
        setModalType(null);
      } else {
        setModalType(null);
      }
    } else {
      createLegacyLessonMutation.mutate({
        courseId: courseId!,
        lesson: {
          title: formData.title,
          description: formData.description,
          duration: formData.duration,
          order_index: curriculumItems?.length || 0,
          is_locked: formData.is_locked,
        }
      });
      // createLegacyLessonMutation's onSuccess already starts the upload if videoFile exists
      setModalType(null);
    }
  };

  const handleSlidesSubmit = async (e: React.FormEvent) => {
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
      
      if (slidesFile && selectedItem.id) {
        uploadSlidesMutation.mutate({ itemId: selectedItem.id, file: slidesFile });
      }
      setModalType(null);
    } else {
      createCurriculumMutation.mutate({
        title: formData.title,
        type: "slides",
        order_index: curriculumItems?.length || 0,
        is_locked: formData.is_locked,
        slides_url: null,
      }, {
        onSuccess: (newItem: any) => {
          if (slidesFile && newItem.id) {
            uploadSlidesMutation.mutate({ itemId: newItem.id, file: slidesFile });
          }
        }
      });
      setModalType(null);
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
      description: item.lesson?.description || "",
      duration: item.lesson?.duration || "",
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
                    {item.type === 'slides' && item.slides_url && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="text-muted-foreground hover:text-accent hover:bg-accent/10 transition-colors" 
                        title="View Slides"
                        onClick={() => {
                          const fullUrl = item.slides_url!.startsWith('http') 
                            ? item.slides_url! 
                            : `https://cnkqsinhqbzpkejucygz.supabase.co/storage/v1/object/public/slides/${item.slides_url}`;
                          setViewingSlideUrl(fullUrl);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                    )}
                    <div className="flex items-center gap-3">
                      {item.type === 'lesson' && item.lesson?.is_uploading && (
                        <div className="flex items-center gap-2 px-2 py-1 bg-amber-500/10 text-amber-500 rounded text-xs animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          {item.lesson_id && activeUploads[item.lesson_id] 
                            ? `${activeUploads[item.lesson_id].progress}%` 
                            : "Uploading..."}
                        </div>
                      )}
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => openEditModal(item)}
                        disabled={item.type === 'lesson' && item.lesson?.is_uploading}
                      >
                        <Edit size={16} />
                      </Button>
                    </div>
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

            {uploadProgress !== null && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-primary uppercase tracking-wider">Uploading Video...</span>
                  <span className="text-primary">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                  <div 
                    className="bg-primary h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-6" disabled={createCurriculumMutation.isPending || updateCurriculumMutation.isPending || uploadVideoMutation.isPending}>
              {uploadVideoMutation.isPending ? "Finalizing..." : (selectedItem ? "Save Changes" : "Create Lesson")}
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

            <Button type="submit" className="w-full mt-4" disabled={createCurriculumMutation.isPending || uploadSlidesMutation.isPending}>
              {createCurriculumMutation.isPending || uploadSlidesMutation.isPending ? "Uploading..." : "Create Slides Module"}
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

        {/* Background Upload Tracker Widget */}
        {Object.keys(activeUploads).length > 0 && (
          <div className="fixed bottom-6 right-6 w-80 bg-card border border-border rounded-xl shadow-2xl p-4 z-[100] animate-in slide-in-from-right-10 duration-300">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm">Active Uploads</h4>
              <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full">
                {Object.keys(activeUploads).length} item(s)
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(activeUploads).map(([id, upload]) => (
                <div key={id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="truncate w-40">{upload.fileName}</span>
                    <span className="font-medium">{upload.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Slide Viewer Modal */}
        <Modal 
          isOpen={!!viewingSlideUrl} 
          onClose={() => {
            setViewingSlideUrl(null);
            setIsSlideFullScreen(false);
          }} 
          title={isSlideFullScreen ? "" : "Slide Viewer"}
          size={isSlideFullScreen ? "full" : "xl"}
          className={isSlideFullScreen ? "p-0 !max-w-none !m-0 rounded-none h-screen" : ""}
        >
          <div className={`w-full bg-black/5 rounded-xl overflow-hidden relative transition-all duration-300 ${
            isSlideFullScreen 
              ? 'fixed inset-0 z-[200] h-screen w-screen rounded-none bg-black' 
              : 'h-[70vh]'
          }`}>
            <div className={`absolute z-[210] flex gap-2 ${isSlideFullScreen ? 'top-6 right-16' : 'top-4 right-14'}`}>
              <Button 
                variant="secondary" 
                size="icon" 
                className="bg-black/40 hover:bg-black/60 backdrop-blur-md border-white/10"
                onClick={() => setIsSlideFullScreen(!isSlideFullScreen)}
                title={isSlideFullScreen ? "Exit Full Screen" : "Full Screen"}
              >
                <Maximize2 size={16} className={isSlideFullScreen ? 'rotate-180' : ''} />
              </Button>
            </div>
            {viewingSlideUrl && (
              <iframe
                src={
                  viewingSlideUrl.toLowerCase().split('?')[0].endsWith('.pdf') 
                    ? viewingSlideUrl 
                    : `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(viewingSlideUrl)}`
                }
                className="w-full h-full border-0"
                title="Slide Content"
              />
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <a href={viewingSlideUrl || "#"} download target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm" className="gap-2">
                <Upload size={14} className="rotate-180" />
                Download Original
              </Button>
            </a>
          </div>
        </Modal>
      </main>
    </div>
  );
}
