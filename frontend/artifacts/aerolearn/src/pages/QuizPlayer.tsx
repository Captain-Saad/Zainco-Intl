import { useState, useEffect, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/shared/Button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/useAuth";
import { Clock, CheckCircle, ArrowLeft, Send, FileText } from "lucide-react";

// ---------- Types ----------
interface QuizOption {
  id: string;
  option_text: string;
  is_correct: boolean; // always false for students
}

interface QuizQuestion {
  id: string;
  question_type: "mcq" | "short_answer";
  question_text: string;
  order_index: number;
  options: QuizOption[];
}

interface QuizData {
  id: string;
  title: string;
  course_id: string;
  time_limit_mins: number | null;
  quiz_mode: string;
  quiz_file_url: string | null;
  questions: QuizQuestion[];
  my_submission: SubmissionResult | null;
}

interface SubmissionResult {
  id: string;
  score: number | null;
  status: string;
  answers?: any[];
  answer_file_url?: string | null;
}

// ---------- Component ----------
export default function QuizPlayer() {
  const [, params] = useRoute("/courses/:courseId/quiz/:quizId");
  const courseId = params?.courseId;
  const quizId = params?.quizId;
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [location, setLocation] = useLocation();

  const [answers, setAnswers] = useState<Record<string, { selected_option?: string; answer_text?: string }>>({});
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz-player", quizId],
    queryFn: () => customFetch<QuizData>(`/api/quizzes/${quizId}`),
    enabled: !!quizId,
  });

  // Fetch full curriculum for context and next item
  const { data: curriculum } = useQuery({
    queryKey: ['student-curriculum', courseId],
    queryFn: () => customFetch<any[]>(`/api/courses/${courseId}/curriculum`),
    enabled: !!courseId,
  });

  const currentIndex = curriculum?.findIndex((item: any) => item.type === 'quiz' && item.quiz_id === quizId) ?? -1;
  const nextItem = currentIndex >= 0 && curriculum && currentIndex < curriculum.length - 1
    ? curriculum[currentIndex + 1]
    : null;

  // Timer
  useEffect(() => {
    if (quiz?.time_limit_mins && !submitted && !isAdmin) {
      setTimeLeft(quiz.time_limit_mins * 60);
    }
  }, [quiz, submitted, isAdmin]);

  // Load previous submission
  useEffect(() => {
    if (quiz?.my_submission && !submitted) {
      setSubmitted(true);
      setSubmissionResult(quiz.my_submission);
      
      const prevAnswers: Record<string, { selected_option?: string; answer_text?: string }> = {};
      quiz.my_submission.answers?.forEach((ans: any) => {
        prevAnswers[ans.question_id] = {
          selected_option: ans.selected_option,
          answer_text: ans.answer_text,
        };
      });
      setAnswers(prevAnswers);
    }
  }, [quiz, submitted]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleSubmit(); // Auto-submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, submitted]);

  const submitMutation = useMutation({
    mutationFn: (payload: any) =>
      customFetch<SubmissionResult>(`/api/quizzes/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setSubmitted(true);
      setSubmissionResult(data);
    },
  });

  const submitDocumentMutation = useMutation({
    mutationFn: (formData: FormData) => {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      return fetch(`/api/quizzes/${quizId}/submit-document`, {
        method: "POST",
        headers,
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error("Failed to upload solution");
        return res.json();
      });
    },
    onSuccess: (data: SubmissionResult) => {
      setSubmitted(true);
      setSubmissionResult(data);
    },
  });

  const handleSubmit = useCallback(() => {
    if (submitted || !quiz) return;
    
    if (quiz.quiz_mode === "upload") {
      if (!uploadFile) return alert("Please select a file to submit");
      const formData = new FormData();
      formData.append("file", uploadFile);
      submitDocumentMutation.mutate(formData);
    } else {
      const answersPayload = quiz.questions.map(q => ({
        question_id: q.id,
        selected_option: answers[q.id]?.selected_option || null,
        answer_text: answers[q.id]?.answer_text || null,
      }));
      submitMutation.mutate({ answers: answersPayload });
    }
  }, [submitted, quiz, answers, uploadFile]);

  const setMCQAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { selected_option: optionId } }));
  };

  const setTextAnswer = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: { answer_text: text } }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-8 flex items-center justify-center">
          <p className="text-muted-foreground animate-pulse font-mono">LOADING QUIZ...</p>
        </main>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-background flex">
        <Sidebar />
        <main className="flex-1 md:ml-64 p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Quiz not found.</p>
        </main>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <Link
                href={isAdmin ? `/admin/courses/${courseId}` : `/courses/${courseId}`}
                className="text-accent hover:text-accent/80 text-sm font-mono mb-2 inline-block"
              >
                <ArrowLeft size={14} className="inline mr-1" /> Back to Course
              </Link>
              <h1 className="text-2xl md:text-3xl font-display font-bold">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {quiz.questions.length} Question{quiz.questions.length !== 1 ? "s" : ""}
                {quiz.time_limit_mins ? ` • ${quiz.time_limit_mins} min time limit` : ""}
              </p>
            </div>

            {/* Timer */}
            {timeLeft !== null && !submitted && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono text-lg ${
                timeLeft < 60
                  ? "border-destructive/50 text-destructive bg-destructive/10 animate-pulse"
                  : "border-primary/30 text-primary bg-primary/10"
              }`}>
                <Clock size={18} />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Submission Result */}
          {submitted && submissionResult && (
            <div className="glass-card rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center space-y-2">
              <CheckCircle size={36} className="mx-auto text-emerald-500" />
              <h2 className="text-xl font-display font-bold text-emerald-400">Assignment Submitted!</h2>
              {submissionResult.status === "graded" ? (
                <p className="text-muted-foreground">
                  Your score: <span className="text-foreground font-bold text-lg">{submissionResult.score}</span> / {quiz.questions.length}
                </p>
              ) : (
                <p className="text-muted-foreground">Your answers have been submitted. They will be graded manually.</p>
              )}
              
              {nextItem && (
                <div className="pt-4">
                   <Button 
                    onClick={() => {
                      if (nextItem.type === 'lesson') {
                        setLocation(`/courses/${courseId}/lesson/${nextItem.lesson_id}`);
                      } else if (nextItem.type === 'quiz') {
                        setLocation(`/courses/${courseId}/quiz/${nextItem.quiz_id}`);
                      } else if (nextItem.type === 'slides') {
                        setLocation(`/courses/${courseId}/slides/${nextItem.id}`);
                      }
                    }}
                    className="gap-2"
                  >
                    Continue to {nextItem.title} <Send size={14} className="rotate-90" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Upload Mode UI */}
          {quiz.quiz_mode === "upload" ? (
            <div className="glass-card rounded-xl border border-border p-6 space-y-6">
              <div className="p-5 flex flex-col items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-center space-y-3">
                <FileText size={40} className="mx-auto text-blue-400" />
                <h3 className="text-lg font-bold">Assignment Document</h3>
                <p className="text-sm text-muted-foreground">Download the assignment file provided by your instructor.</p>
                {quiz.quiz_file_url ? (
                  <Button 
                    variant="secondary"
                    className="mt-2"
                    onClick={() => window.open(quiz.quiz_file_url || "", "_blank")}
                  >
                    Download Assessment File
                  </Button>
                ) : (
                  <p className="text-sm text-destructive">No assessment file attached.</p>
                )}
              </div>

              {!submitted && !isAdmin ? (
                <div className="pt-6 border-t border-border">
                  <h4 className="font-bold mb-4">Upload Your Solution</h4>
                  <div className="p-6 rounded-xl border border-dashed border-border bg-secondary/20 flex flex-col items-center justify-center text-center space-y-3">
                    <input 
                      type="file" 
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setUploadFile(file);
                      }}
                      className="w-full max-w-sm text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                    />
                    {uploadFile && <p className="text-xs text-foreground bg-secondary px-3 py-1 rounded-full">Selected: {uploadFile.name}</p>}
                  </div>
                </div>
              ) : submitted && submissionResult?.answer_file_url ? (
                <div className="pt-6 border-t border-border text-center">
                  <h4 className="font-bold mb-2">Your Submitted Solution</h4>
                  <Button variant="secondary" onClick={() => window.open(submissionResult.answer_file_url || "", "_blank")}>
                    Download Your Submission
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            // /* Builder Mode (Questions) */
            <div className="space-y-5">
            {quiz.questions
              .sort((a, b) => a.order_index - b.order_index)
              .map((q, idx) => (
                <div key={q.id} className="glass-card rounded-xl border border-border p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 flex-shrink-0 bg-primary/10 text-primary rounded-lg flex items-center justify-center font-mono font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground leading-relaxed">{q.question_text}</p>
                      <span className={`text-[10px] uppercase tracking-wider mt-1 inline-block ${
                        q.question_type === "mcq" ? "text-primary" : "text-accent"
                      }`}>
                        {q.question_type === "mcq" ? "Multiple Choice" : "Short Answer"}
                      </span>
                    </div>
                  </div>

                  {/* MCQ Options */}
                  {q.question_type === "mcq" && (
                    <div className="space-y-2 pl-11">
                      {q.options.map(opt => {
                        const isSelected = answers[q.id]?.selected_option === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            disabled={submitted}
                            onClick={() => setMCQAnswer(q.id, opt.id)}
                            className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                              isSelected
                                ? "border-primary bg-primary/10 text-foreground shadow-sm"
                                : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                            } ${submitted ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {opt.option_text}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer */}
                  {q.question_type === "short_answer" && (
                    <div className="pl-11">
                      <textarea
                        className="w-full bg-secondary border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary min-h-[80px] resize-none text-sm"
                        placeholder="Type your answer here..."
                        value={answers[q.id]?.answer_text || ""}
                        onChange={e => setTextAnswer(q.id, e.target.value)}
                        disabled={submitted}
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>
          )}

          {/* Submit Button */}
          {!submitted && !isAdmin && (
            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || submitDocumentMutation.isPending}
            >
              <Send size={16} />
              {submitMutation.isPending || submitDocumentMutation.isPending ? "Submitting..." : "Submit Assignment"}
            </Button>
          )}

          {isAdmin && !submitted && (
            <div className="text-center text-muted-foreground text-sm p-4 border border-dashed border-border rounded-xl">
              <FileText size={20} className="mx-auto mb-2 opacity-40" />
              Admin preview mode — submission is disabled.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
