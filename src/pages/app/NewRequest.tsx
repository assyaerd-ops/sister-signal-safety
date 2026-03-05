import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGeolocation } from "@/hooks/useGeolocation";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type RequestType = Database["public"]["Enums"]["request_type"];
type UrgencyLevel = Database["public"]["Enums"]["urgency_level"];

const requestTypes: { value: RequestType; label: string; emoji: string }[] = [
  { value: "escort", label: "Walk Escort", emoji: "🚶‍♀️" },
  { value: "pickup", label: "Safe Pickup", emoji: "🚗" },
  { value: "checkin", label: "Check-in", emoji: "📍" },
  { value: "other", label: "Other", emoji: "💬" },
];

const urgencyLevels: { value: UrgencyLevel; label: string; color: string }[] = [
  { value: "low", label: "Low — When available", color: "bg-sister-sage/10 text-sister-sage border-sister-sage/30" },
  { value: "medium", label: "Medium — Soon", color: "bg-sister-warm/10 text-sister-warm border-sister-warm/30" },
  { value: "high", label: "High — Right now", color: "bg-destructive/10 text-destructive border-destructive/30" },
];

const NewRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const geo = useGeolocation();
  const [type, setType] = useState<RequestType>("escort");
  const [urgency, setUrgency] = useState<UrgencyLevel>("medium");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    const { data, error } = await supabase
      .from("requests")
      .insert({
        requester_id: user.id,
        type,
        urgency,
        note: note.trim() || null,
        lat: geo.lat,
        lng: geo.lng,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (error) {
      toast.error("Failed to create request. Make sure your account is verified.");
    } else {
      toast.success("Request sent! Sisters nearby will see it.");
      navigate(`/app/requests/${data.id}`);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Request Help</h1>

        {/* Type */}
        <div className="space-y-2">
          <Label>What do you need?</Label>
          <div className="grid grid-cols-2 gap-2">
            {requestTypes.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  type === t.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-2xl">{t.emoji}</span>
                <p className="mt-1 text-sm font-medium text-foreground">{t.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <Label>Urgency</Label>
          <div className="flex flex-col gap-2">
            {urgencyLevels.map((u) => (
              <button
                key={u.value}
                onClick={() => setUrgency(u.value)}
                className={`rounded-xl border-2 p-3 text-left text-sm transition-all ${
                  urgency === u.value
                    ? "border-primary bg-primary/5 font-medium"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="space-y-2">
          <Label htmlFor="note">Additional details (optional)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Where are you? What's the situation?"
            rows={3}
          />
        </div>

        {/* Location */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Share Location</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={geo.requestLocation}
                disabled={geo.loading}
              >
                {geo.loading ? <Loader2 className="h-3 w-3 animate-spin" /> : geo.lat ? "Updated ✓" : "Enable"}
              </Button>
            </div>
            {geo.error && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                <span>{geo.error}</span>
              </div>
            )}
            {geo.lat && (
              <p className="text-xs text-muted-foreground">
                📍 Location captured. Responders nearby will see your request.
              </p>
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSubmit} className="w-full" size="lg" disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Send Request
        </Button>
      </div>
    </AppLayout>
  );
};

export default NewRequest;
