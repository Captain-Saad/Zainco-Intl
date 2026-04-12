import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Courses from "@/pages/Courses";
import CourseDetail from "@/pages/CourseDetail";
import Lesson from "@/pages/Lesson";
import Progress from "@/pages/Progress";
import Profile from "@/pages/Profile";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminStudents from "@/pages/admin/AdminStudents";
import AdminCourses from "@/pages/admin/AdminCourses";
import AdminCourseDetail from "@/pages/admin/AdminCourseDetail";
import AdminQuizSubmissions from "@/pages/admin/AdminQuizSubmissions";
import QuizPlayer from "@/pages/QuizPlayer";
import SlidesPlayer from "@/pages/SlidesPlayer";
import Enroll from "@/pages/Enroll";
import NotFound from "@/pages/not-found";
import InstallBanner from "@/components/shared/InstallBanner";

const queryClient = new QueryClient();

// Route Protection Wrapper
function ProtectedRoute({ component: Component, adminOnly = false }: { component: any, adminOnly?: boolean }) {
  const { user } = useAuth();
  
  if (!user) return <Redirect to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Redirect to="/dashboard" />;
  
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/enroll" component={Enroll} />

      {/* Protected Student Routes */}
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/courses"><ProtectedRoute component={Courses} /></Route>
      <Route path="/courses/:id"><ProtectedRoute component={CourseDetail} /></Route>
      <Route path="/courses/:id/lesson/:lessonId"><ProtectedRoute component={Lesson} /></Route>
      <Route path="/courses/:courseId/quiz/:quizId"><ProtectedRoute component={QuizPlayer} /></Route>
      <Route path="/courses/:courseId/slides/:itemId"><ProtectedRoute component={SlidesPlayer} /></Route>
      <Route path="/progress"><ProtectedRoute component={Progress} /></Route>
      <Route path="/profile"><ProtectedRoute component={Profile} /></Route>

      {/* Protected Admin Routes */}
      <Route path="/admin/courses/:courseId/quiz/:quizId/submissions"><ProtectedRoute component={AdminQuizSubmissions} adminOnly /></Route>
      <Route path="/admin/courses/:id"><ProtectedRoute component={AdminCourseDetail} adminOnly /></Route>
      <Route path="/admin/courses"><ProtectedRoute component={AdminCourses} adminOnly /></Route>
      <Route path="/admin/students"><ProtectedRoute component={AdminStudents} adminOnly /></Route>
      <Route path="/admin"><ProtectedRoute component={AdminDashboard} adminOnly /></Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Ensure the app forces the dark class on root for consistent custom tailwind styling
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
            <InstallBanner />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
