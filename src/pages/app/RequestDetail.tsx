import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Send, X, CheckCircle2, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";

const typeLabel: Record<string, string> = {
  escort: "🚶‍♀️ Walk Escort",
  pickup: "🚗 Safe Pickup",
  checkin: "📍 Check-in",
  other: "💬 Other",
};

const RequestDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");

  // Fetch request
  const { data: request, isLoading } = useQuery({
    queryKey: ["request", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("requests").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch messages
  const { data: messages } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("request_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!request && (request.requester_id === user?.id || request.assigned_responder_id === user?.id),
  });

  // Realtime messages
  useEffect(() => {
    if (!id || !request) return;
    const isParticipant = request.requester_id === user?.id || request.assigned_responder_id === user?.id;
    if (!isParticipant) return;

    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `request_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, request, user?.id, qc]);

  // Scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Accept request
  const acceptMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("requests")
        .update({ assigned_responder_id: user!.id, status: "assigned" as const })
        .eq("id", id!)
        .eq("status", "open");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("You've accepted this request!");
      qc.invalidateQueries({ queryKey: ["request", id] });
    },
    onError: () => toast.error("Failed to accept — it may already be taken."),
  });

  // Close request
  const closeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("requests")
        .update({ status: "closed" as const })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request closed.");
      qc.invalidateQueries({ queryKey: ["request", id] });
    },
  });

  // Cancel request
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("requests")
        .update({ status: "cancelled" as const })
        .eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Request cancelled.");
      navigate("/app/home");
    },
  });

  // Send message
  const sendMessage = async () => {
    if (!message.trim() || !user || !id) return;
    const { error } = await supabase.from("messages").insert({
      request_id: id,
      sender_id: user.id,
      text: message.trim(),
    });
    if (error) {
      toast.error("Failed to send message");
    } else {
      setMessage("");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!request) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center text-muted-foreground">
          Request not found.
        </div>
      </AppLayout>
    );
  }

  const isRequester = request.requester_id === user?.id;
  const isResponder = request.assigned_responder_id === user?.id;
  const isParticipant = isRequester || isResponder;
  const canAccept = !isRequester && request.status === "open";
  const isActive = request.status === "open" || request.status === "assigned";

  return (
    <AppLayout>
      <div className="container mx-auto flex flex-col px-4 py-4" style={{ height: "calc(100vh - 128px)" }}>
        {/* Header */}
        <Card className="shrink-0">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold text-foreground">
                  {typeLabel[request.type] || request.type}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {request.urgency} urgency
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(request.created_at).toLocaleString()}
                  </span>
                  {request.lat && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Location shared
                    </span>
                  )}
                </div>
                {request.note && (
                  <p className="mt-2 text-sm text-muted-foreground">{request.note}</p>
                )}
              </div>
              <Badge
                variant="outline"
                className={
                  request.status === "open"
                    ? "bg-sister-warm/10 text-sister-warm"
                    : request.status === "assigned"
                    ? "bg-sister-sage/10 text-sister-sage"
                    : ""
                }
              >
                {request.status}
              </Badge>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {canAccept && (
                <Button onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
                  <Shield className="mr-2 h-4 w-4" />
                  Accept & Respond
                </Button>
              )}
              {isRequester && request.status === "assigned" && (
                <Button onClick={() => closeMutation.mutate()} variant="outline" disabled={closeMutation.isPending}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark Safe / Close
                </Button>
              )}
              {isRequester && request.status === "open" && (
                <Button onClick={() => cancelMutation.mutate()} variant="ghost" disabled={cancelMutation.isPending}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        {isParticipant && request.status === "assigned" ? (
          <>
            <div className="flex-1 overflow-y-auto py-4 space-y-2">
              {messages && messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                        msg.sender_id === user?.id
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-secondary text-secondary-foreground rounded-bl-md"
                      }`}
                    >
                      {msg.text}
                      <p className="mt-1 text-[10px] opacity-60">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-muted-foreground py-8">
                  Send a message to coordinate with your sister.
                </p>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message input */}
            <div className="shrink-0 flex gap-2 pb-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage} size="icon" disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : isParticipant && request.status !== "assigned" ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            {request.status === "open"
              ? "Chat will be available once a responder accepts."
              : "This request has been closed."}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            Accept this request to start chatting.
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default RequestDetail;
