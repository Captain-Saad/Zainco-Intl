import { useState } from "react";
import { useRoute, Link } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/shared/Button";
import { Modal } from "@/components/shared/Modal";
import { Input } from "@/components/shared/Input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { ArrowLeft, Award, Clock, CheckCircle, Edit, User } from "lucide-react";

// ---------- Types ----------
interface AnswerData {
  id: string;
  question_id: string;
  answer_text: string | null;
  selected_option: string | null;
}

interface SubmissionData {
  id: string;
  quiz_id: string;
  user_id: string;
  submitted_at: string;
  score: number | null;
  status: string;
  answer_file_url: string | null;
  answers?: AnswerData[];
}

interface QuizData {
  id: string;
  title: string;
  course_id: string;
  questions: { 
    id: string; 
    question_text: string; 
    question_type: string;
    options: { id: string; option_text: string }[];
  }[];
}

// ---------- Component ----------
export default function AdminQuizSubmissions() {
  const [, params] = useRoute("/admin/courses/:courseId/quiz/:quizId/submissions");
  const courseId = params?.courseId;
  const quizId = params?.quizId;
  const queryClient = useQueryClient();

  const [gradeModal, setGradeModal] = useState<SubmissionData | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(0);

  const { data: quiz } = useQuery({
    queryKey: ["admin-quiz-detail", quizId],
    queryFn: () => customFetch<QuizData>(`/api/quizzes/${quizId}`),
    enabled: !!quizId,
  });

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin-quiz-submissions", quizId],
    queryFn: () => customFetch<SubmissionData[]>(`/api/admin/quizzes/${quizId}/submissions`),
    enabled: !!quizId,
  });

  const gradeMutation = useMutation({
    mutationFn: ({ subId, score }: { subId: string; score: number }) =>
      customFetch(`/api/admin/submissions/${subId}/grade`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, status: "graded" }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-quiz-submissions", quizId] });
      setGradeModal(null);
    },
  });

  // Fetch full submission detail with answers
  const { data: fullSubmission, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["admin-submission-header", gradeModal?.id],
    queryFn: () => customFetch<SubmissionData>(`/api/admin/submissions/${gradeModal?.id}`),
    enabled: !!gradeModal?.id,
  });

  const handleGrade = () => {
    if (!gradeModal) return;
    gradeMutation.mutate({ subId: gradeModal.id, score: gradeScore });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-8 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse font-mono">LOADING SUBMISSIONS...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-5xl mx-auto space-y-8">

          <div>
            <Link
              href={`/admin/courses/${courseId}`}
              className="text-accent hover:text-accent/80 text-sm font-mono mb-2 inline-block"
            >
              <ArrowLeft size={14} className="inline mr-1" /> Back to Course
            </Link>
            <h1 className="text-3xl font-display font-bold">Quiz Submissions</h1>
            <p className="text-muted-foreground mt-1">
              Reviewing: <span className="text-foreground font-medium">{quiz?.title || "..."}</span>
              {quiz?.questions && <span> • {quiz.questions.length} Questions</span>}
            </p>
          </div>

          {/* Submissions Table */}
          <div className="glass-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 bg-secondary/30 border-b border-border text-sm font-mono text-muted-foreground flex justify-between px-6">
              <span>Student Submissions</span>
              <span>{submissions?.length || 0} Total</span>
            </div>

            {(!submissions || submissions.length === 0) ? (
              <div className="p-12 text-center text-muted-foreground">
                <Award size={32} className="mx-auto mb-3 opacity-30" />
                <p>No submissions yet for this quiz.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {submissions.map(sub => (
                  <div key={sub.id} className="p-4 px-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-9 w-9 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                        <User size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground font-mono">{sub.user_id.slice(0, 8)}...</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock size={10} /> {formatDate(sub.submitted_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border font-medium ${
                        sub.status === "graded"
                          ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/10"
                          : "border-amber-500/30 text-amber-500 bg-amber-500/10"
                      }`}>
                        {sub.status === "graded" ? (
                          <span className="flex items-center gap-1"><CheckCircle size={10} /> Graded</span>
                        ) : (
                          "Pending Review"
                        )}
                      </span>

                      {sub.score !== null && (
                        <span className="text-foreground font-mono font-bold">
                          {sub.score}/{quiz?.questions?.length || "?"}
                        </span>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={() => {
                          setGradeModal(sub);
                          setGradeScore(sub.score || 0);
                        }}
                      >
                        <Edit size={14} /> Grade
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Grade Modal */}
      <Modal
        isOpen={!!gradeModal}
        onClose={() => setGradeModal(null)}
        title="Grade Submission"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Student: <span className="text-foreground font-mono">{gradeModal?.user_id.slice(0, 12)}...</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Status: <span className={`font-medium ${gradeModal?.status === "graded" ? "text-emerald-500" : "text-amber-500"}`}>{gradeModal?.status}</span>
          </p>

          <Input
            label={`Score (max ${quiz?.questions?.length || "?"})`}
            type="number"
            required
            value={gradeScore}
            onChange={e => setGradeScore(parseInt(e.target.value) || 0)}
          />

          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3 font-display">Student Answers</h4>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingDetail ? (
                <p className="text-xs text-muted-foreground animate-pulse">Loading answers...</p>
              ) : fullSubmission?.answers?.length ? (
                fullSubmission.answers.map((ans, idx) => {
                  const question = quiz?.questions.find(q => q.id === ans.question_id);
                  return (
                    <div key={ans.id} className="p-3 rounded bg-secondary/30 border border-border/50">
                      <p className="text-xs font-medium text-foreground mb-1">
                        Q{idx+1}: {question?.question_text || "Unknown Question"}
                      </p>
                      <div className="text-sm font-mono text-accent">
                        {ans.selected_option ? (() => {
                          const option = question?.options?.find(o => o.id === ans.selected_option);
                          return (
                            <span className="flex items-center gap-2">
                               Selected: <span className="text-foreground font-sans font-medium">{option?.option_text || ans.selected_option}</span>
                            </span>
                          );
                        })() : (
                          <span className="whitespace-pre-wrap">{ans.answer_text || "No Answer"}</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-secondary-foreground">No answers found for this submission.</p>
              )}
            </div>
          </div>

          <Button className="w-full mt-6" onClick={handleGrade} disabled={gradeMutation.isPending}>
            {gradeMutation.isPending ? "Saving..." : "Save Grade"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
