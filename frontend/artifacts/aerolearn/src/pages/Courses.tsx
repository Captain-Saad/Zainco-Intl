import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/shared/Button";
import { Badge } from "@/components/shared/Badge";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Users } from "lucide-react";

interface CourseCategory {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed';
  category?: string; // Assuming category might be present for some courses
  lessons_list?: { completed: boolean }[]; // Assuming lessons_list might be present for some courses
  lessons?: number; // Assuming lessons might be present for some courses
  total_lessons?: number;
}

export default function Courses() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses-list'],
    queryFn: () => customFetch<CourseCategory[]>('/api/courses')
  });

  const categories = courses 
    ? Array.from(new Set(courses.map((c: CourseCategory) => 'category' in c ? (c as any).category : 'General')))
    : [];
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed'>('all');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 px-4 pt-20 md:p-10 flex items-center justify-center">
          <p className="text-muted-foreground font-mono animate-pulse">DOWNLOADING COURSE CATALOG...</p>
        </main>
      </div>
    );
  }

  const filteredCourses = courses?.filter((c: CourseCategory) => filter === 'all' || c.status === filter);

  const item = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-7xl w-full">
        <header className="mb-8 md:mb-10">
          <div className="text-xs md:text-sm font-mono text-muted-foreground mb-2">DASHBOARD &gt; MY COURSES</div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">TRAINING MODULES</h1>
        </header>

        <div className="flex gap-4 md:gap-6 mb-8 border-b border-border overflow-x-auto pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'ALL MODULES' },
            { id: 'in-progress', label: 'IN PROGRESS' },
            { id: 'completed', label: 'COMPLETED' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`pb-4 text-sm font-mono tracking-wider transition-colors relative ${
                filter === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {filter === tab.id && (
                <motion.div layoutId="courseTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(!filteredCourses || filteredCourses.length === 0) ? (
            <div className="col-span-full py-16 text-center border border-dashed border-border rounded-xl">
              <h2 className="text-xl font-display text-foreground mb-2">No Courses Assigned</h2>
              <p className="text-muted-foreground">You do not have access to any modules yet. Please contact your administrator for enrollment.</p>
            </div>
          ) : (
              filteredCourses.map((course: CourseCategory) => (
                <Link key={course.id} href={`/courses/${course.id}`}>
                  <motion.div 
                    variants={item}
                    whileHover={{ scale: 1.02 }}
                    className="glass-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all group cursor-pointer h-full flex flex-col"
                  >
                    <div className="h-40 bg-secondary rounded-lg mb-6 flex items-center justify-center relative overflow-hidden group-hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] transition-shadow">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="font-display text-4xl font-bold text-white/20 group-hover:scale-110 transition-transform duration-500">
                        {('category' in course) ? (course as any).category : 'COURSE'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className="px-3 py-1 rounded bg-secondary text-xs font-mono text-muted-foreground">
                        {('category' in course) ? (course as any).category : 'ALL'}
                      </span>
                    </div>

                    <h3 className="text-xl font-display font-bold mb-3 group-hover:text-primary transition-colors">{course.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3 flex-1">{course.description}</p>
                
                <div className="mt-auto">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-mono text-muted-foreground">
                      {Math.round((course.progress / 100) * (course.total_lessons || 0))} / {course.total_lessons || 0} LESSONS
                    </span>
                    <span className="text-sm font-mono text-accent">{course.progress}%</span>
                  </div>
                  
                  <div className="w-full h-1.5 bg-secondary rounded-full mb-6 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full ${course.progress === 100 ? 'bg-emerald-500' : 'bg-primary'}`} 
                    />
                  </div>

                  <Link href={`/courses/${course.id}`}>
                    <Button variant={course.progress === 0 ? "secondary" : "primary"} className="w-full">
                      {course.progress === 100 ? "Review Course" : course.progress === 0 ? "Start Training" : "Continue"}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </Link>
          ))
          )}
        </div>
      </main>
    </div>
  );
}
