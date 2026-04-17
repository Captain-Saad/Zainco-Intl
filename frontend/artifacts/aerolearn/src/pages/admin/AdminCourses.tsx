import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { Eye, Edit, Trash2, Globe, Lock, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";

interface CourseData {
  id: string;
  title: string;
  category: string;
  status: string;
  total_lessons: number;
  thumbnail_url?: string;
  learning_outcomes?: string[];
  students_enrolled?: number;
}

export default function AdminCourses() {
  const [modalOpen, setModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "MCC",
    duration: "",
    thumbnail_url: "",
    status: "draft",
    learning_outcomes: [] as string[],
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleOutcomeChange = (index: number, value: string) => {
    const updated = [...formData.learning_outcomes];
    updated[index] = value;
    setFormData({ ...formData, learning_outcomes: updated });
  };

  const addOutcome = () => {
    if (formData.learning_outcomes.length >= 20) return;
    setFormData({ ...formData, learning_outcomes: [...formData.learning_outcomes, ""] });
  };

  const removeOutcome = (index: number) => {
    const updated = formData.learning_outcomes.filter((_, i) => i !== index);
    setFormData({ ...formData, learning_outcomes: updated });
  };

  const moveOutcome = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === formData.learning_outcomes.length - 1) return;
    
    const updated = [...formData.learning_outcomes];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    setFormData({ ...formData, learning_outcomes: updated });
  };

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['admin-courses-list'],
    queryFn: () => customFetch<CourseData[]>('/api/courses')
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => {
      const data = new FormData();
      data.append('file', file);
      
      const token = localStorage.getItem('token');
      return fetch('/api/admin/courses/image', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: data,
      }).then(res => {
        if (!res.ok) throw new Error('Failed to upload image');
        return res.json();
      });
    }
  });

  const createMutation = useMutation({
    mutationFn: (newCourse: any) => 
      customFetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCourse),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses-list'] });
      setModalOpen(false);
      setSelectedCourse(null);
      setFormData({ title: "", description: "", category: "MCC", duration: "", thumbnail_url: "", status: "draft", learning_outcomes: [] });
      setImageFile(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => 
      customFetch(`/api/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses-list'] });
      setModalOpen(false);
      setSelectedCourse(null);
      setFormData({ title: "", description: "", category: "MCC", duration: "", thumbnail_url: "", status: "draft", learning_outcomes: [] });
      setImageFile(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      customFetch(`/api/courses/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-courses-list'] }),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    let finalImageUrl = formData.thumbnail_url;

    if (imageFile) {
      try {
        const uploadRes = await uploadImageMutation.mutateAsync(imageFile);
        finalImageUrl = uploadRes.url;
      } catch (err) {
        console.error("Image upload failed", err);
        alert("Failed to upload image. Please try again.");
        return;
      }
    }

    const finalPayload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      duration: formData.duration,
      thumbnail_url: finalImageUrl || null,
      status: formData.status,
      learning_outcomes: formData.learning_outcomes.filter(o => o.trim() !== ""),
    };

    if (selectedCourse) {
      updateMutation.mutate({ id: selectedCourse.id, data: finalPayload });
    } else {
      createMutation.mutate(finalPayload);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-[1800px] w-full">
        <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">COURSE MANAGEMENT</h1>
          <Button onClick={() => {
            setSelectedCourse(null);
            setFormData({ title: "", description: "", category: "MCC", duration: "", thumbnail_url: "", status: "draft", learning_outcomes: [] });
            setModalOpen(true);
          }} className="self-start sm:self-auto">Create New Course</Button>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {isLoading ? (
            <p className="text-muted-foreground font-mono animate-pulse">LOADING COURSES...</p>
          ) : courses.length === 0 ? (
            <div className="col-span-2 text-center p-10 border border-border border-dashed rounded-xl">
              <p className="text-muted-foreground font-mono mb-4">NO COURSES CREATED YET.</p>
              <Button onClick={() => setModalOpen(true)}>Create First Course</Button>
            </div>
          ) : courses.map(course => (
            <div key={course.id} className="glass-card rounded-xl border border-border flex flex-col md:flex-row overflow-hidden group">
              <div className="w-full md:w-48 bg-secondary border-r border-border relative flex flex-col items-center justify-center p-6 shrink-0">
                 <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=400')] bg-cover bg-center mix-blend-overlay" />
                 {course.thumbnail_url && (
                    <img src={course.thumbnail_url} className="absolute inset-0 w-full h-full object-cover opacity-20" alt="Course Thumbnail" />
                 )}
                 <h3 className="font-display text-4xl font-bold text-white/20 mb-2 relative z-10">{course.category}</h3>
                 <Badge variant={course.status === 'not-started' || course.status === 'draft' ? 'outline' : 'gold'} className="relative z-10">
                   {course.status === 'not-started' || course.status === 'draft' ? 'Draft' : 'Published'}
                 </Badge>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-display font-bold text-lg mb-1">{course.title}</h3>
                <p className="text-xs text-muted-foreground font-mono mb-4 flex gap-4">
                  <span>{course.students_enrolled || 0} Students</span>
                  <span>{course.total_lessons || 0} Lessons</span>
                </p>
                <div className="mt-auto flex gap-2 border-t border-border/50 pt-4">
                  <Button 
                    size="sm" 
                    variant="secondary" 
                    className="flex-1 gap-1"
                    onClick={() => {
                      setSelectedCourse(course);
                      setFormData({
                        title: course.title,
                        description: (course as any).description || "",
                        category: course.category,
                        duration: (course as any).duration || "",
                        thumbnail_url: course.thumbnail_url || "",
                        status: course.status,
                        learning_outcomes: course.learning_outcomes || [],
                      });
                      setModalOpen(true);
                    }}
                  ><Edit size={14} /> Edit</Button>
                  <Link href={`/admin/courses/${course.id}`}>
                    <Button size="icon" variant="ghost"><Eye size={18}/></Button>
                  </Link>
                  <Button onClick={() => {
                    if (window.confirm(`Are you sure you want to permanently delete '${course.title}'?`)) {
                      deleteMutation.mutate(course.id);
                    }
                  }} size="icon" variant="danger"><Trash2 size={18}/></Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedCourse ? "Edit Course Module" : "Create Course Module"}>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input label="Course Title" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground ml-1">Description</label>
              <textarea 
                className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[100px] resize-none"
                placeholder="Enter detailed course description..."
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground ml-1">Category Code</label>
                <select 
                  className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  <option>MCC</option>
                  <option>JOC</option>
                  <option>TYPE</option>
                  <option>SIM</option>
                </select>
              </div>
              <Input label="Total Duration (e.g. 36 hrs)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground ml-1">Cover Image (Optional)</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setImageFile(file);
                }}
                className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 focus:outline-none focus:border-primary"
              />
              {imageFile && <p className="text-xs text-primary ml-1">Selected: {imageFile.name}</p>}
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <div>
                <h4 className="font-display font-bold text-foreground mb-1">What You'll Learn</h4>
                <p className="text-xs text-muted-foreground mb-4">Add up to 20 key learning outcomes. These will be displayed as bullet points on the course page.</p>
              </div>
              
              <div className="space-y-2">
                {formData.learning_outcomes.map((outcome, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <div className="flex flex-col gap-0.5 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button type="button" onClick={() => moveOutcome(idx, 'up')} disabled={idx === 0} className="hover:text-primary disabled:opacity-30 disabled:hover:text-inherit">
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" onClick={() => moveOutcome(idx, 'down')} disabled={idx === formData.learning_outcomes.length - 1} className="hover:text-primary disabled:opacity-30 disabled:hover:text-inherit">
                        <ArrowDown size={14} />
                      </button>
                    </div>
                    <Input 
                      className="flex-1"
                      placeholder="e.g. Master CRM fundamentals..."
                      label=""
                      value={outcome}
                      onChange={(e) => handleOutcomeChange(idx, e.target.value)}
                      maxLength={200}
                    />
                    <Button type="button" size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 shrink-0" onClick={() => removeOutcome(idx)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              
              {formData.learning_outcomes.length < 20 && (
                <Button type="button" variant="secondary" size="sm" className="w-full gap-2 border-dashed border-border" onClick={addOutcome}>
                  <Plus size={16} /> Add Outcome
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border">
              <div>
                <p className="font-medium flex items-center gap-2"><Globe size={16}/> Publish Immediately</p>
                <p className="text-xs text-muted-foreground mt-1">Make available to students instantly.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={formData.status === "published"}
                  onChange={e => setFormData({...formData, status: e.target.checked ? "published" : "draft"})}
                />
                <div className="w-11 h-6 bg-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
              </label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={createMutation.isPending || !formData.title}>
               {createMutation.isPending ? "Creating..." : "Create Module"}
            </Button>
          </form>
        </Modal>
      </main>
    </div>
  );
}
