
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/cbt/results/$testId")({
  component: CbtResults,
});

function CbtResults() {
  const { testId } = Route.useParams();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-8 text-center">
      <div className="bg-white p-8 rounded-xl shadow-xl max-w-lg w-full">
        <h1 className="text-3xl font-black text-emerald-700 mb-4">Exam Submitted!</h1>
        <p className="text-slate-600 mb-6">Your test has been successfully submitted and is currently being processed by the AI auto-grading engine.</p>
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg font-bold">
          Your results and certificate will be available on your dashboard soon.
        </div>
      </div>
    </div>
  );
}

