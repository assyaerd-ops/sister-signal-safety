import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, Home, PlusCircle, Shield, User, MessageCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/app/home", icon: Home, label: "Home" },
  { to: "/app/request/new", icon: PlusCircle, label: "Request Help" },
  { to: "/app/requests", icon: Shield, label: "Respond" },
  { to: "/app/messages", icon: MessageCircle, label: "Messages" },
  { to: "/app/profile", icon: User, label: "Profile" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/app/home" className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" fill="currentColor" />
            <span className="font-display text-lg font-bold text-foreground">SisterSignal</span>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Bottom tab bar */}
      <nav className="sticky bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
        <div className="container mx-auto flex items-center justify-around px-2 py-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-3 py-2 text-xs transition-colors ${
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
