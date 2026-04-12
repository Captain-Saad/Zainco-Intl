import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Input } from "@/components/shared/Input";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { Modal } from "@/components/shared/Modal";
import { Search, Filter, Eye, Edit, Trash2, UserX, UserCheck, Power, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

interface StudentListResponse {
  id: string;
  email: string;
  first_name?: never;
  last_name?: never;
  license_number?: never;
  name: string;
  license: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  overall_progress?: number;
}

interface CourseOption {
  id: string;
  title: string;
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentListResponse | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    licenseNumber: "",
    phone: "",
    courseId: "",
  });

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => customFetch<StudentListResponse[]>('/api/admin/students')
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => customFetch<CourseOption[]>('/api/courses')
  });

  const { data: studentDetail } = useQuery({
    queryKey: ['admin-student-detail', selectedStudent?.id],
    queryFn: () => customFetch<any>(`/api/admin/students/${selectedStudent?.id}`),
    enabled: !!selectedStudent?.id && accessModalOpen,
  });

  const enrollMutation = useMutation({
    mutationFn: (newStudent: any) => 
      customFetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
      setDrawerOpen(false);
      setFormData({
        firstName: "", lastName: "", email: "", password: "", licenseNumber: "", phone: "", courseId: "",
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string, is_active: boolean }) => 
      customFetch(`/api/admin/students/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-students'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => 
      customFetch(`/api/admin/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-students'] }),
  });

  const enrollCourseMutation = useMutation({
    mutationFn: ({ studentId, courseId }: { studentId: string, courseId: string }) => 
      customFetch(`/api/admin/students/${studentId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-student-detail', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
  });

  const unenrollCourseMutation = useMutation({
    mutationFn: ({ studentId, courseId }: { studentId: string, courseId: string }) => 
      customFetch(`/api/admin/students/${studentId}/enroll/${courseId}`, { method: 'DELETE' }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-student-detail', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-students'] });
    },
  });

  const handleEnroll = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) return;
    enrollMutation.mutate({
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,
      license_number: formData.licenseNumber || null,
      phone: formData.phone || null,
      course_id: formData.courseId || null,
    });
  };

  const filtered = students.filter(s => {
    const term = search.toLowerCase();
    const fullName = (s.name || "").toLowerCase();
    return fullName.includes(term) || s.email.toLowerCase().includes(term);
  });

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 flex flex-col min-h-screen w-full overflow-hidden">
        <header className="mb-6 md:mb-8 shrink-0 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">STUDENT ROSTER</h1>
          <Button onClick={() => setDrawerOpen(true)} className="self-start sm:self-auto">Enroll New Student</Button>
        </header>

        <div className="glass-card p-3 md:p-4 rounded-t-xl border border-b-0 border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center shrink-0">
          <div className="relative flex-1 max-w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <Button variant="secondary" className="gap-2 px-4 py-2 h-auto text-sm"><Filter size={16}/> Filter</Button>
        </div>

        <div className="flex-1 overflow-auto border border-border rounded-b-xl bg-card min-h-0">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead className="bg-secondary/50 sticky top-0 z-10 font-mono text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="p-4 font-medium">Pilot</th>
                <th className="p-4 font-medium">License</th>
                <th className="p-4 font-medium">Course</th>
                <th className="p-4 font-medium">Progress</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-mono animate-pulse">
                    LOADING STUDENT RECORDS...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground font-mono">
                    NO STUDENTS FOUND
                  </td>
                </tr>
              ) : filtered.map(student => {
                const initial = (student.name?.[0] || student.email[0] || "?").toUpperCase();
                const fullName = student.name || student.email.split('@')[0];
                return (
                  <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold border border-primary/20">
                          {initial}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{fullName}</div>
                          <div className="text-xs text-muted-foreground">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-muted-foreground">{student.license || "N/A"}</td>
                    <td className="p-4">
                      <Badge variant="outline">Overview Mode</Badge>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-3 w-32 ${student.overall_progress === 0 ? 'opacity-50' : ''}`}>
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${student.overall_progress || 0}%` }} />
                        </div>
                        <span className="font-mono text-xs text-muted-foreground">{student.overall_progress || 0}%</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={student.is_active ? 'green' : 'red'}>
                        {student.is_active ? 'active' : 'inactive'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => toggleStatusMutation.mutate({ id: student.id, is_active: !student.is_active })}
                          className={`p-1.5 rounded hover:bg-opacity-20 transition-colors ${student.is_active ? 'text-destructive hover:bg-destructive/10' : 'text-primary hover:bg-primary/10'}`}
                          title={student.is_active ? "Deactivate Student" : "Activate Student"}
                        >
                          {student.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedStudent(student);
                            setAccessModalOpen(true);
                          }}
                          className="p-1.5 text-muted-foreground hover:text-primary rounded hover:bg-primary/10 transition-colors"
                          title="Manage Access"
                        >
                          <Shield size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to permanently delete ${student.email}?`)) {
                              deleteMutation.mutate(student.id);
                            }
                          }}
                          className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-destructive/10"
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </main>

      {/* Slide-in Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="font-display text-xl font-bold">Enroll New Pilot</h2>
                <button onClick={() => setDrawerOpen(false)} className="text-muted-foreground hover:text-foreground">✕</button>
              </div>
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                  <Input label="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                </div>
                <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <Input label="CPL License Number (Optional)" value={formData.licenseNumber} onChange={e => setFormData({...formData, licenseNumber: e.target.value})} />
                <Input label="Phone Number (Optional)" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground ml-1">Assign Course (Optional)</label>
                  <select 
                    className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
                    value={formData.courseId}
                    onChange={e => setFormData({...formData, courseId: e.target.value})}
                  >
                    <option value="">-- No Course --</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>
                </div>
                
                <Input label="Initial Password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="p-6 border-t border-border bg-secondary/30 flex gap-4">
                <Button variant="ghost" className="flex-1" onClick={() => setDrawerOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleEnroll} disabled={enrollMutation.isPending || !formData.email || !formData.password || !formData.firstName || !formData.lastName}>
                  {enrollMutation.isPending ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Modal isOpen={accessModalOpen} onClose={() => setAccessModalOpen(false)} title={`Manage Access: ${selectedStudent?.email || ""}`}>
        <div className="space-y-4 min-w-[300px]">
          <p className="text-sm text-muted-foreground mb-4">Toggle switches below to instantly grant or revoke course access for this pilot.</p>
          
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
            {!courses.length ? (
              <p className="text-center text-muted-foreground text-sm py-4">No courses available.</p>
            ) : (
              courses.map(course => {
                const isEnrolled = studentDetail?.enrollments?.some((enr: any) => enr.course_id === course.id);
                return (
                  <div key={course.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30">
                    <span className="text-sm font-medium">{course.title}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={!!isEnrolled}
                        onChange={(e) => {
                          if (!selectedStudent) return;
                          if (e.target.checked) {
                            enrollCourseMutation.mutate({ studentId: selectedStudent.id, courseId: course.id });
                          } else {
                            unenrollCourseMutation.mutate({ studentId: selectedStudent.id, courseId: course.id });
                          }
                        }}
                        disabled={enrollCourseMutation.isPending || unenrollCourseMutation.isPending}
                      />
                      <div className="w-11 h-6 bg-card peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border"></div>
                    </label>
                  </div>
                );
              })
            )}
          </div>
          
          <Button variant="ghost" className="w-full mt-4" onClick={() => setAccessModalOpen(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
