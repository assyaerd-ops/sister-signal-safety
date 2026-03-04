import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="font-display text-xl font-bold text-foreground">SisterSignal</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </nav>
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Welcome, Sister 💛
        </h1>
        <p className="text-muted-foreground">
          You're signed in as {user?.email}. The full dashboard is coming soon.
        </p>
      </div>
    </div>
  );
};

export default Home;
