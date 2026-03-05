import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock } from "lucide-react";

const typeLabel: Record<string, string> = {
  escort: "🚶‍♀️ Walk Escort",
  pickup: "🚗 Safe Pickup",
  checkin: "📍 Check-in",
  other: "💬 Other",
};

const MessagesPage = () => {
  const { user } = useAuth();

  // Show assigned requests where user is a participant (these have chat)
  const { data: chatRequests, isLoading } = useQuery({
    queryKey: ["chat-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("status", "assigned")
        .or(`requester_id.eq.${user!.id},assigned_responder_id.eq.${user!.id}`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : chatRequests && chatRequests.length > 0 ? (
          <div className="space-y-3">
            {chatRequests.map((req) => (
              <Link key={req.id} to={`/app/requests/${req.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{typeLabel[req.type] || req.type}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-sister-sage/10 text-sister-sage border-sister-sage/30">
                      Active
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/30" />
            <p className="mt-4 text-muted-foreground">No active conversations</p>
            <p className="text-xs text-muted-foreground">
              Messages appear here when you're matched with a request.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MessagesPage;
