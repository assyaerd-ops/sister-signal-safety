import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

const typeLabel: Record<string, string> = {
  escort: "🚶‍♀️ Walk Escort",
  pickup: "🚗 Safe Pickup",
  checkin: "📍 Check-in",
  other: "💬 Other",
};

const urgencyStyle: Record<string, string> = {
  low: "bg-sister-sage/10 text-sister-sage border-sister-sage/30",
  medium: "bg-sister-warm/10 text-sister-warm border-sister-warm/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};

function timeSince(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

const ResponderDashboard = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const { data: openRequests, isLoading } = useQuery({
    queryKey: ["open-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Filter out own requests
      return data.filter((r) => r.requester_id !== user?.id);
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const toggleAvailable = async (checked: boolean) => {
    try {
      await updateProfile.mutateAsync({ responder_available: checked });
      toast.success(checked ? "You're now available to respond" : "You're now offline");
    } catch {
      toast.error("Failed to update availability");
    }
  };

  const isVerified = profile?.verification_status === "verified";

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Responder Dashboard</h1>
          <div className="flex items-center gap-2">
            <Label htmlFor="available" className="text-sm text-muted-foreground">Available</Label>
            <Switch
              id="available"
              checked={profile?.responder_available ?? false}
              onCheckedChange={toggleAvailable}
              disabled={!isVerified}
            />
          </div>
        </div>

        {!isVerified && (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 text-sm text-muted-foreground">
            You need to be verified to see and accept requests.
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : openRequests && openRequests.length > 0 ? (
          <div className="space-y-3">
            {openRequests.map((req) => (
              <Link key={req.id} to={`/app/requests/${req.id}`}>
                <Card className="transition-all hover:shadow-md hover:border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{typeLabel[req.type] || req.type}</p>
                        {req.note && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{req.note}</p>
                        )}
                        <div className="flex items-center gap-3 pt-1">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {timeSince(req.created_at)}
                          </span>
                          {req.lat && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" /> Has location
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className={urgencyStyle[req.urgency] || ""}>
                        {req.urgency}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No open requests right now</p>
            <p className="text-xs text-muted-foreground">New requests will appear here automatically</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ResponderDashboard;
