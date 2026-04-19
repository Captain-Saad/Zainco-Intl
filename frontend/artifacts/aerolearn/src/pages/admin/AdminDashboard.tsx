import { Sidebar } from "@/components/layout/Sidebar";
import { StatCard } from "@/components/shared/StatCard";
import {
  Users, CheckCircle, BookOpen, DollarSign, Plus, Bell,
  X, Mail, Phone, Shield, Clock, ChevronRight, Eye, PhoneCall
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/shared/Button";
import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

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

interface EnrollmentInquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  license_number: string;
  message: string;
  status: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusColor(status: string) {
  switch (status) {
    case "new": return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "reviewed": return "bg-blue-500/20 text-blue-400 border-blue-500/40";
    case "contacted": return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    default: return "bg-secondary text-muted-foreground border-border";
  }
}

export default function AdminDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<EnrollmentInquiry | null>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => customFetch<AdminStatsResponse>('/api/admin/stats')
  });

  const { data: graphs, isLoading: graphsLoading } = useQuery({
    queryKey: ['admin-graphs'],
    queryFn: () => customFetch<AdminGraphsResponse>('/api/admin/graphs')
  });

  const { data: inquiries } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: () => customFetch<EnrollmentInquiry[]>('/api/admin/enrollment-inquiries'),
    refetchInterval: 30000, // refetch every 30s
  });

  const { data: inquiryCount } = useQuery({
    queryKey: ['admin-inquiry-count'],
    queryFn: () => customFetch<{ count: number }>('/api/admin/enrollment-inquiries/count'),
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      customFetch(`/api/admin/enrollment-inquiries/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
        headers: { "Content-Type": "application/json" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-count'] });
    },
  });

  // Close notification panel when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node) &&
        !selectedInquiry
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedInquiry]);

  const isLoading = statsLoading || graphsLoading;
  const newCount = inquiryCount?.count || 0;

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
      <main className="flex-1 md:ml-64 px-4 pt-16 pb-8 md:p-10 max-w-[1800px] w-full">
        <header className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">SYSTEM OVERVIEW</h1>
            <p className="text-muted-foreground font-mono mt-2 text-sm">ADMINISTRATOR PRIVILEGES ACTIVE</p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            {/* Notification Bell */}
            <div ref={bellRef} className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setSelectedInquiry(null);
                }}
                className="relative w-10 h-10 rounded-lg border border-border bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
                aria-label="Enrollment Inquiries"
              >
                <Bell size={18} />
                {newCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center animate-pulse shadow-[0_0_8px_rgba(201,168,76,0.6)]">
                    {newCount > 9 ? "9+" : newCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {showNotifications && !selectedInquiry && (
                  <motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-12 w-[380px] max-h-[480px] overflow-y-auto glass-card rounded-xl border border-border shadow-2xl z-50"
                  >
                    <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between z-10">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-primary" />
                        <span className="font-display font-semibold text-sm">Enrollment Inquiries</span>
                        {newCount > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                            {newCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowNotifications(false)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    {(!inquiries || inquiries.length === 0) ? (
                      <div className="p-8 text-center">
                        <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">No enrollment inquiries yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border/50">
                        {inquiries.map((inquiry) => (
                          <button
                            key={inquiry.id}
                            onClick={() => setSelectedInquiry(inquiry)}
                            className={`w-full text-left p-4 hover:bg-white/5 transition-colors flex items-start gap-3 group ${
                              inquiry.status === "new" ? "bg-primary/5" : ""
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              inquiry.status === "new"
                                ? "bg-primary/20 text-primary border border-primary/40"
                                : "bg-secondary text-muted-foreground border border-border"
                            }`}>
                              {inquiry.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm text-foreground truncate">{inquiry.name}</span>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  {timeAgo(inquiry.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{inquiry.email}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${statusColor(inquiry.status)}`}>
                                  {inquiry.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <ChevronRight size={14} className="text-muted-foreground mt-3 shrink-0 group-hover:text-primary transition-colors" />
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

        {/* Expanded Inquiry Detail Card */}
        <AnimatePresence>
          {selectedInquiry && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                onClick={() => {
                  setSelectedInquiry(null);
                  setShowNotifications(false);
                }}
              />

              {/* Inquiry Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.target === e.currentTarget && (() => { setSelectedInquiry(null); setShowNotifications(false); })()}
              >
                <div className="w-full max-w-lg glass-card rounded-2xl border border-border shadow-2xl overflow-hidden">
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-border/50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary font-display font-bold text-lg">
                          {selectedInquiry.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-xl text-foreground">{selectedInquiry.name}</h3>
                          <p className="text-xs font-mono text-muted-foreground mt-0.5">
                            Submitted {timeAgo(selectedInquiry.created_at)} • {new Date(selectedInquiry.created_at).toLocaleDateString("en-PK", {
                              year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedInquiry(null); setShowNotifications(false); }}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-5">
                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card rounded-lg p-3 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Mail size={13} />
                          <span className="text-[10px] font-mono tracking-wide">EMAIL</span>
                        </div>
                        <p className="text-sm text-foreground font-medium truncate">{selectedInquiry.email}</p>
                      </div>
                      <div className="glass-card rounded-lg p-3 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Phone size={13} />
                          <span className="text-[10px] font-mono tracking-wide">PHONE</span>
                        </div>
                        <p className="text-sm text-foreground font-medium">{selectedInquiry.phone}</p>
                      </div>
                      <div className="glass-card rounded-lg p-3 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Shield size={13} />
                          <span className="text-[10px] font-mono tracking-wide">LICENSE</span>
                        </div>
                        <p className="text-sm text-foreground font-medium">{selectedInquiry.license_number}</p>
                      </div>
                      <div className="glass-card rounded-lg p-3 border border-border/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Clock size={13} />
                          <span className="text-[10px] font-mono tracking-wide">STATUS</span>
                        </div>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded border ${statusColor(selectedInquiry.status)}`}>
                          {selectedInquiry.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Message */}
                    {selectedInquiry.message && selectedInquiry.message.trim() !== "" && (
                      <div className="glass-card rounded-lg p-4 border border-border/50">
                        <p className="text-[10px] font-mono tracking-wide text-muted-foreground mb-2">MESSAGE</p>
                        <p className="text-sm text-foreground/90 leading-relaxed">{selectedInquiry.message}</p>
                      </div>
                    )}

                    {/* Status Actions */}
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-[10px] font-mono tracking-wide text-muted-foreground mb-3">UPDATE STATUS</p>
                      <div className="flex gap-2">
                        {["new", "reviewed", "contacted"].map((s) => (
                          <button
                            key={s}
                            disabled={selectedInquiry.status === s || updateStatusMutation.isPending}
                            onClick={() => {
                              updateStatusMutation.mutate({ id: selectedInquiry.id, status: s });
                              setSelectedInquiry({ ...selectedInquiry, status: s });
                            }}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-all border ${
                              selectedInquiry.status === s
                                ? `${statusColor(s)} font-bold`
                                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground bg-secondary/50"
                            }`}
                          >
                            {s === "new" && <Bell size={13} />}
                            {s === "reviewed" && <Eye size={13} />}
                            {s === "contacted" && <PhoneCall size={13} />}
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
