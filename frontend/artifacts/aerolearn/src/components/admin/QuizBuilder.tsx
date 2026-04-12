import { useState } from "react";
import { Button } from "@/components/shared/Button";
import { Input } from "@/components/shared/Input";
import { Modal } from "@/components/shared/Modal";
import { Plus, Trash2, GripVertical, CheckCircle, HelpCircle } from "lucide-react";

// ---------- Types ----------
interface QuizOption {
  option_text: string;
  is_correct: boolean;
}

interface QuizQuestion {
  question_type: "mcq" | "short_answer";
  question_text: string;
  order_index: number;
  options: QuizOption[];
}

interface QuizBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  onQuizCreated: (quizId: string, title: string) => void;
}

// ---------- Component ----------
export default function QuizBuilder({ isOpen, onClose, courseId, onQuizCreated }: QuizBuilderProps) {
  const [title, setTitle] = useState("");
  const [timeLimit, setTimeLimit] = useState<number | "">("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizMode, setQuizMode] = useState<"builder" | "upload">("builder");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ---- Question Helpers ----
  const addQuestion = (type: "mcq" | "short_answer") => {
    setQuestions(prev => [
      ...prev,
      {
        question_type: type,
        question_text: "",
        order_index: prev.length,
        options: type === "mcq" ? [
          { option_text: "", is_correct: true },
          { option_text: "", is_correct: false },
        ] : [],
      },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order_index: i })));
  };

  const updateQuestionText = (idx: number, text: string) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, question_text: text } : q));
  };

  // ---- Option Helpers ----
  const addOption = (qIdx: number) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: [...q.options, { option_text: "", is_correct: false }] } : q
      )
    );
  };

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q
      )
    );
  };

  const updateOptionText = (qIdx: number, oIdx: number, text: string) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? { ...o, option_text: text } : o)) }
          : q
      )
    );
  };

  const setCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => ({ ...o, is_correct: j === oIdx })) }
          : q
      )
    );
  };

  // ---- Submit ----
  const handleSubmit = async () => {
    setError("");
    if (!title.trim()) { setError("Quiz title is required."); return; }
    
    if (quizMode === "builder") {
      if (questions.length === 0) { setError("Add at least one question."); return; }
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].question_text.trim()) { setError(`Question ${i + 1} is empty.`); return; }
        if (questions[i].question_type === "mcq" && questions[i].options.length < 2) {
          setError(`Question ${i + 1} needs at least 2 options.`); return;
        }
      }
    } else {
      if (!uploadFile) { setError("Please select a file to upload."); return; }
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Create the quiz shell
      const quizRes = await fetch("/api/admin/quizzes", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          course_id: courseId,
          quiz_mode: quizMode,
          time_limit_mins: timeLimit || null,
        }),
      });
      if (!quizRes.ok) throw new Error("Failed to create quiz");
      const quizData = await quizRes.json();

      if (quizMode === "builder") {
        // 2. Add each question
        for (const q of questions) {
          const qRes = await fetch(`/api/admin/quizzes/${quizData.id}/questions`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              question_type: q.question_type,
              question_text: q.question_text,
              order_index: q.order_index,
              options: q.options,
            }),
          });
          if (!qRes.ok) throw new Error("Failed to add question");
        }
      } else {
        // 2. Upload Document
        const formData = new FormData();
        formData.append("file", uploadFile!);
        
        const uploadHeaders: Record<string, string> = {};
        if (token) uploadHeaders["Authorization"] = `Bearer ${token}`;
        
        const uploadRes = await fetch(`/api/admin/quizzes/${quizData.id}/upload-document`, {
          method: "POST",
          headers: uploadHeaders,
          body: formData
        });
        if (!uploadRes.ok) throw new Error("Failed to upload quiz document");
      }

      onQuizCreated(quizData.id, title);
      // Reset
      setTitle("");
      setTimeLimit("");
      setQuestions([]);
      setQuizMode("builder");
      setUploadFile(null);
      onClose();
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quiz Builder">
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {/* --- Header Fields --- */}
        <div className="space-y-4">
          <div className="flex bg-secondary/50 p-1 rounded-xl">
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${quizMode === 'builder' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setQuizMode("builder")}
            >
              Build Online
            </button>
            <button
              type="button"
              className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-colors ${quizMode === 'upload' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setQuizMode("upload")}
            >
              Document Upload
            </button>
          </div>
          <Input label="Quiz Title" required value={title} onChange={e => setTitle(e.target.value)} />
          <Input
            label="Time Limit (minutes, optional)"
            type="number"
            value={timeLimit}
            onChange={e => setTimeLimit(e.target.value ? parseInt(e.target.value) : "")}
          />
        </div>

        {quizMode === "builder" ? (
          <>
            {/* --- Questions List --- */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" /> Questions ({questions.length})
              </h3>

          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="p-4 rounded-xl border border-border bg-secondary/30 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GripVertical size={14} className="opacity-40" />
                  <span className="font-mono">{String(qIdx + 1).padStart(2, "0")}</span>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    q.question_type === "mcq"
                      ? "border-primary/40 text-primary bg-primary/10"
                      : "border-accent/40 text-accent bg-accent/10"
                  }`}>
                    {q.question_type === "mcq" ? "Multiple Choice" : "Short Answer"}
                  </span>
                </div>
                <button onClick={() => removeQuestion(qIdx)} className="text-destructive hover:text-destructive/80" title="Remove question">
                  <Trash2 size={14} />
                </button>
              </div>

              <textarea
                className="w-full bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary resize-none min-h-[60px] text-sm"
                placeholder="Enter your question here..."
                value={q.question_text}
                onChange={e => updateQuestionText(qIdx, e.target.value)}
              />

              {/* MCQ Options */}
              {q.question_type === "mcq" && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOption(qIdx, oIdx)}
                        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          opt.is_correct
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-500"
                            : "border-border text-transparent hover:border-muted-foreground"
                        }`}
                        title={opt.is_correct ? "Correct answer" : "Mark as correct"}
                      >
                        <CheckCircle size={12} />
                      </button>
                      <input
                        className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                        placeholder={`Option ${oIdx + 1}`}
                        value={opt.option_text}
                        onChange={e => updateOptionText(qIdx, oIdx, e.target.value)}
                      />
                      {q.options.length > 2 && (
                        <button onClick={() => removeOption(qIdx, oIdx)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {q.options.length < 6 && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 ml-7"
                      onClick={() => addOption(qIdx)}
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  )}
                </div>
              )}

              {q.question_type === "short_answer" && (
                <p className="text-xs text-muted-foreground italic pl-4">
                  Students will type a free-text answer. Manual grading required.
                </p>
              )}
            </div>
          ))}

          {/* Add Question Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => addQuestion("mcq")}
              className="flex-1 py-3 rounded-xl border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} /> MCQ Question
            </button>
            <button
              type="button"
              onClick={() => addQuestion("short_answer")}
              className="flex-1 py-3 rounded-xl border-2 border-dashed border-accent/30 text-accent hover:bg-accent/5 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Short Answer
            </button>
          </div>
        </div>
        </>
      ) : (
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-lg flex items-center gap-2">
            <HelpCircle size={18} className="text-primary" /> Upload Assessment
          </h3>
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
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Students will download this file, complete it locally, and upload their solution document back here.
            </p>
          </div>
        </div>
      )}

        {/* --- Submit --- */}
        <Button className="w-full" onClick={handleSubmit} disabled={saving}>
          {saving ? "Creating Quiz..." : "Save Quiz"}
        </Button>
      </div>
    </Modal>
  );
}
