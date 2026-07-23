import { useAuth } from "@/lib/AuthProvider";
import { Board } from "@/components/Board";

export default function App() {
  const { loading, error } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Setting up your board…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  }

  return <Board />;
}
