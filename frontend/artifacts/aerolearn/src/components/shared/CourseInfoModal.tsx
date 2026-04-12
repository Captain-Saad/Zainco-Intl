import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Clock, Users, BookOpen, GraduationCap } from "lucide-react";
import { useLocation } from "wouter";
import { Course } from "@/data/mockData";

interface CourseInfoModalProps {
  course: Course;
  onClose: () => void;
}

export default function CourseInfoModal({ course, onClose }: CourseInfoModalProps) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const enrollUrl = `/enroll?course=${course.id}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#020810]/85 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[720px] max-h-[88vh] sm:max-h-[88vh] bg-[#071428] border-[0.5px] border-[#C9A84C]/25 rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden z-[101]
                     max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:max-h-[92vh] sm:m-0"
        >
          {/* Custom Scrollbar Styles */}
          <style>{`
            .modal-scroll::-webkit-scrollbar { width: 4px; }
            .modal-scroll::-webkit-scrollbar-track { background: transparent; }
            .modal-scroll::-webkit-scrollbar-thumb { 
              background: rgba(201,168,76,0.4);
              border-radius: 2px; 
            }
          `}</style>

          {/* Close Button (Floating) */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 border-[0.5px] border-white/15 text-white/70 hover:bg-black/70 hover:text-white transition-all shadow-lg"
          >
            <X size={16} />
          </button>

          <div className="flex-1 overflow-y-auto modal-scroll">
            {/* Header Section */}
            <div 
              className="relative h-[160px] sm:h-[200px] flex flex-col justify-end bg-cover bg-center bg-[#071428]"
              style={{ 
                backgroundImage: `linear-gradient(to bottom, rgba(7,20,40,0.3) 0%, rgba(7,20,40,0.95) 100%), ${
                  course.id === '1' ? `url(${import.meta.env.BASE_URL}images/mcc-pilots.jpg)` :
                  course.id === '2' ? `url(${import.meta.env.BASE_URL}images/joc-airplane.png)` :
                  course.id === '4' ? `url(${import.meta.env.BASE_URL}images/sim-cockpit.jpg)` :
                  'linear-gradient(135deg, #0A1F3D, #071428)'
                }` 
              }}
            >
              <div className="px-6 sm:px-8 pb-6">
                <span className="text-[10px] tracking-[0.2em] uppercase font-mono px-2.5 py-1 rounded bg-[#C9A84C]/10 border-[0.5px] border-[#C9A84C]/30 text-[#C9A84C] mb-3 inline-block">
                  {course.category} Certification
                </span>
                <h2 className="font-display font-medium text-2xl sm:text-3xl text-[#F0F4F8] leading-tight">
                  {course.title}
                </h2>
                <p className="text-[13px] text-[#8BA3C1] mt-1.5 flex items-center gap-1.5 font-sans">
                  <span className="opacity-60">Instructor:</span>
                  <span className="font-medium text-[#C8D8E8]">{course.instructor}</span>
                </p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="px-6 sm:px-8">
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-between py-2 overflow-hidden">
                <div className="flex flex-col items-center gap-0.5 px-4 py-4 sm:py-6 sm:flex-1 border-r sm:border-r border-white/5 last:border-0 max-sm:odd:border-b">
                  <span className="font-mono text-[1.2rem] sm:text-[1.4rem] font-medium text-[#0EA5E9] leading-none">
                    {course.lessons_list.length}
                  </span>
                  <span className="text-[10px] text-[#4A6380] uppercase tracking-[0.12em] text-center">Lessons</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 px-4 py-4 sm:py-6 sm:flex-1 border-r sm:border-r border-white/5 last:border-0 max-sm:even:border-b">
                  <span className="font-mono text-[1.2rem] sm:text-[1.4rem] font-medium text-[#0EA5E9] leading-none">
                    {course.duration}
                  </span>
                  <span className="text-[10px] text-[#4A6380] uppercase tracking-[0.12em] text-center">Total Time</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 px-4 py-4 sm:py-6 sm:flex-1 sm:border-r border-white/5 last:border-0 border-r max-sm:odd:border-none">
                  <span className="font-mono text-[1.2rem] sm:text-[1.4rem] font-medium text-[#0EA5E9] leading-none">
                    {course.students}
                  </span>
                  <span className="text-[10px] text-[#4A6380] uppercase tracking-[0.12em] text-center">Enrolled</span>
                </div>
                <div className="flex flex-col items-center gap-0.5 px-4 py-4 sm:py-6 sm:flex-1 last:border-0">
                  <span className="font-mono text-[1.2rem] sm:text-[1.4rem] font-medium text-[#0EA5E9] leading-none">
                    10 Seats
                  </span>
                  <span className="text-[10px] text-[#4A6380] uppercase tracking-[0.12em] text-center">Available</span>
                </div>
              </div>
            </div>

            {/* Gold Divider */}
            <div className="h-[0.5px] bg-[#C9A84C]/15 mx-6 sm:mx-8 mb-6" />

            {/* Content Body */}
            <div className="px-6 sm:px-8 pb-10 space-y-8">
              
              {/* About Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#C9A84C] whitespace-nowrap">About This Course</h3>
                  <div className="flex-1 h-[0.5px] bg-[#C9A84C]/20" />
                </div>
                <p className="text-[14.5px] text-[#8BA3C1] leading-relaxed font-sans">
                  {course.description}
                </p>
              </section>

              {/* Learning Outcomes */}
              {course.highlights && course.highlights.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#C9A84C] whitespace-nowrap">What You'll Learn</h3>
                    <div className="flex-1 h-[0.5px] bg-[#C9A84C]/20" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    {course.highlights.map((item, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="mt-1 w-[18px] h-[18px] shrink-0 rounded-full bg-[#C9A84C]/10 border-[0.5px] border-[#C9A84C]/30 flex items-center justify-center">
                          <Check size={10} className="text-[#C9A84C]" />
                        </div>
                        <span className="text-[13.5px] text-[#C8D8E8] leading-snug">{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Curriculum Preview */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#C9A84C] whitespace-nowrap">Curriculum Preview</h3>
                  <div className="flex-1 h-[0.5px] bg-[#C9A84C]/20" />
                </div>
                <div className="space-y-1.5">
                  {course.lessons_list.slice(0, 4).map((lesson, idx) => (
                    <div 
                      key={lesson.id}
                      className="flex items-center gap-4 px-4 py-3 rounded-lg bg-white/[0.02] border-[0.5px] border-white/5"
                    >
                      <span className="font-mono text-xs text-[#4A6380] w-4">{idx + 1}</span>
                      <span className="flex-1 text-[13.5px] text-[#C8D8E8]">{lesson.title}</span>
                      <span className="font-mono text-[11px] text-[#4A6380]">{lesson.duration}</span>
                    </div>
                  ))}
                  {course.lessons_list.length > 4 && (
                    <p className="text-[12px] text-[#4A6380] text-center pt-2 italic">
                      + {course.lessons_list.length - 4} more lessons inside the course
                    </p>
                  )}
                </div>
              </section>

              {/* Instructor Section */}
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-[11px] tracking-[0.2em] uppercase text-[#C9A84C] whitespace-nowrap">Instructor</h3>
                  <div className="flex-1 h-[0.5px] bg-[#C9A84C]/20" />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border-[0.5px] border-white/5">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-[#0A1F3D] to-[#071428] border-[1.5px] border-[#C9A84C]/30 flex items-center justify-center shadow-lg">
                    <span className="font-medium text-[#C9A84C] text-[15px]">{getInitials(course.instructor)}</span>
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-[#F0F4F8]">{course.instructor}</h4>
                    <p className="text-[12px] text-[#8BA3C1]">Lead Instructor · A-320 Type Rated</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="relative z-10 sticky bottom-0 bg-gradient-to-t from-[#071428] via-[#071428] to-transparent pt-8 px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="text-center sm:text-left">
                <p className="text-[12px] text-[#4A6380] mb-0.5">Ready to begin your training?</p>
                <p className="text-[11px] text-[#C9A84C] tracking-[0.1em] font-medium uppercase font-mono">Limited — 10 seats only</p>
              </div>
              <div className="flex flex-col-reverse sm:flex-row items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg border-[0.5px] border-white/15 text-white/60 text-[13.5px] font-medium hover:border-white/35 hover:text-white transition-all bg-white/[0.02]"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose();
                    setLocation(enrollUrl);
                  }}
                  className="w-full sm:w-auto px-7 py-2.5 rounded-lg bg-[#C9A84C] text-[#040D1A] text-[13.5px] font-bold tracking-wide hover:bg-[#E8C97A] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(201,168,76,0.2)]"
                >
                  ENROLL NOW
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
