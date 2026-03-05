import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Shield, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

const HomePage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: myRequests } = useQuery({
    queryKey: ["my-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("requester_id", user!.id)
        .in("status", ["open", "assigned"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: respondingTo } = useQuery({
    queryKey: ["responding-to", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("assigned_responder_id", user!.id)
        .eq("status", "assigned")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const isVerified = profile?.verification_status === "verified";

  const statusColor = {
    open: "bg-sister-warm/10 text-sister-warm border-sister-warm/30",
    assigned: "bg-sister-sage/10 text-sister-sage border-sister-sage/30",
  };

  const typeLabel: Record<string, string> = {
    escort: "🚶‍♀️ Walk Escort",
    pickup: "🚗 Safe Pickup",
    checkin: "📍 Check-in",
    other: "💬 Other",
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Hey, {profile?.first_name || "Sister"} 💛
          </h1>
          {!isVerified && (
            <div className="mt-3 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4">
              <AlertTriangle className="h-5 w-5 text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Verification Pending</p>
                <p className="text-xs text-muted-foreground">
                  Your ID is being reviewed. You'll be able to request and respond to help once verified.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button asChild size="lg" className="h-auto flex-col gap-2 py-6" disabled={!isVerified}>
            <Link to="/app/request/new">
              <PlusCircle className="h-6 w-6" />
              <span>Request Help</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="h-auto flex-col gap-2 py-6" disabled={!isVerified}>
            <Link to="/app/requests">
              <Shield className="h-6 w-6" />
              <span>Respond</span>
            </Link>
          </Button>
        </div>

        {/* Active requests */}
        {myRequests && myRequests.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">Your Active Requests</h2>
            <div className="space-y-3">
              {myRequests.map((req) => (
                <Link key={req.id} to={`/app/requests/${req.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-foreground">{typeLabel[req.type] || req.type}</p>
                        {req.note && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{req.note}</p>}
                      </div>
                      <Badge variant="outline" className={statusColor[req.status as keyof typeof statusColor] || ""}>
                        {req.status === "open" ? <Clock className="mr-1 h-3 w-3" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {req.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Responding to */}
        {respondingTo && respondingTo.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-3">You're Helping</h2>
            <div className="space-y-3">
              {respondingTo.map((req) => (
                <Link key={req.id} to={`/app/requests/${req.id}`}>
                  <Card className="border-sister-sage/30 transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-foreground">{typeLabel[req.type] || req.type}</p>
                        {req.note && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{req.note}</p>}
                      </div>
                      <Badge variant="outline" className="bg-sister-sage/10 text-sister-sage border-sister-sage/30">
                        <Shield className="mr-1 h-3 w-3" />
                        Responding
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppLayout>
  );
};

export default HomePage;
