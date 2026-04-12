import { Sidebar } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/shared/StatCard";
import { Users, CheckCircle, BookOpen, DollarSign, Plus } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/shared/Button";
import { useState } from "react";
import { useLocation } from "wouter";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";

interface AdminStatsResponse {
  total_students: number;
  total_courses: number;
  total_lessons: number;
  active_sessions: number;
}

interface GraphData {
  name: string;
  students: number;
}
interface DailyActivity {
  day: string;
  active: number;
}
interface PieData {
  name: string;
  value: number;
  color: string;
}
interface AdminGraphsResponse {
  enrollments: GraphData[];
  activity: DailyActivity[];
  completion: PieData[];
}

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => customFetch<AdminStatsResponse>('/api/admin/stats')
  });

  const { data: graphs, isLoading: graphsLoading } = useQuery({
    queryKey: ['admin-graphs'],
    queryFn: () => customFetch<AdminGraphsResponse>('/api/admin/graphs')
  });

  const isLoading = statsLoading || graphsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 px-4 pt-20 flex items-center justify-center">
          <p className="text-muted-foreground font-mono animate-pulse">LOADING DASHBOARD DATA...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-7xl w-full">
        <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">SYSTEM OVERVIEW</h1>
            <p className="text-muted-foreground font-mono mt-2 text-sm">ADMINISTRATOR PRIVILEGES ACTIVE</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>Send Alert</Button>
            <Button className="gap-2" onClick={() => setLocation('/admin/students')}><Plus size={18}/> Add Student</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
          <StatCard title="Total Students" value={stats?.total_students?.toString() || "0"} icon={Users} trend="+12 this month" />
          <StatCard title="Active Sessions" value={stats?.active_sessions?.toString() || "0"} icon={CheckCircle} />
          <StatCard title="Total Modules" value={stats?.total_courses?.toString() || "0"} icon={BookOpen} trend="+5 this week" />
          <StatCard title="Total Lessons" value={stats?.total_lessons?.toString() || "0"} icon={DollarSign} className="border-t-emerald-500" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="glass-card p-6 rounded-xl border border-border">
            <h3 className="font-display font-semibold mb-6">Enrollments per Course</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphs?.enrollments || []}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'hsl(var(--secondary))'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none', borderRadius: '8px' }} />
                  <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-border">
            <h3 className="font-display font-semibold mb-6">Daily Active Students (30d)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphs?.activity || []}>
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none' }} />
                  <Line type="monotone" dataKey="active" stroke="hsl(var(--accent))" strokeWidth={3} dot={{r: 4, fill: 'hsl(var(--accent))'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-border lg:col-span-2 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 w-full h-64">
              <h3 className="font-display font-semibold mb-2">Completion Demographics</h3>
              <p className="text-sm text-muted-foreground mb-4">Overall student progress distribution across all available modules.</p>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={graphs?.completion || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {(graphs?.completion || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4 w-full">
              {(graphs?.completion || []).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="font-mono text-muted-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Quick Action">
          <div className="space-y-6">
            <Input label="Enter details..." />
            <Button className="w-full" onClick={() => setIsModalOpen(false)}>Execute Action</Button>
          </div>
        </Modal>
      </main>
    </div>
  );
}
