import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Phone, MapPin, Shield, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Trusted contacts
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const qc = useQueryClient();

  const { data: contacts } = useQuery({
    queryKey: ["trusted-contacts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_contacts")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trusted_contacts").insert({
        user_id: user!.id,
        name: newContactName.trim(),
        phone: newContactPhone.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact added");
      setNewContactName("");
      setNewContactPhone("");
      qc.invalidateQueries({ queryKey: ["trusted-contacts"] });
    },
    onError: (e: Error) => {
      toast.error(e.message?.includes("Maximum") ? "Maximum 3 contacts allowed" : "Failed to add contact");
    },
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase.from("trusted_contacts").delete().eq("id", contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contact removed");
      qc.invalidateQueries({ queryKey: ["trusted-contacts"] });
    },
  });

  const startEdit = () => {
    if (profile) {
      setFirstName(profile.first_name);
      setPhone(profile.phone || "");
      setCity(profile.city || "");
      setEditMode(true);
    }
  };

  const saveProfile = async () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    try {
      await updateProfile.mutateAsync({
        first_name: firstName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
      });
      toast.success("Profile updated");
      setEditMode(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const verificationBadge = {
    pending: { label: "Pending", className: "bg-sister-warm/10 text-sister-warm border-sister-warm/30" },
    verified: { label: "Verified", className: "bg-sister-sage/10 text-sister-sage border-sister-sage/30" },
    rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/30" },
  };

  const vb = profile ? verificationBadge[profile.verification_status] : null;

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Your Profile</h1>

        {/* Profile info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Details</CardTitle>
            {vb && <Badge variant="outline" className={vb.className}>{vb.label}</Badge>}
          </CardHeader>
          <CardContent className="space-y-4">
            {editMode ? (
              <>
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveProfile} disabled={updateProfile.isPending}>
                    {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save
                  </Button>
                  <Button variant="ghost" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile?.first_name || "—"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile?.phone || "Not set"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{profile?.city || "Not set"}</span>
                </div>
                <Button variant="outline" size="sm" onClick={startEdit}>Edit Profile</Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Trusted contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Trusted Contacts
              <span className="text-xs text-muted-foreground font-normal">({contacts?.length || 0}/3)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts && contacts.length > 0 && (
              <div className="space-y-2">
                {contacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.phone}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteContact.mutate(c.id)}
                      disabled={deleteContact.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {(!contacts || contacts.length < 3) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Input
                    placeholder="Contact name"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                  />
                  <Input
                    placeholder="Phone number"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    type="tel"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addContact.mutate()}
                    disabled={!newContactName.trim() || !newContactPhone.trim() || addContact.isPending}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Contact
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
